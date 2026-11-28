import { parseSearch, searchMapView } from "@/lib/search";
import { clientIp, overLimit } from "@/lib/client-ip";

/** Īss kešs (5 min, līdz 200 skatiem): punktu saraksti var būt lieli, tāpēc ne kopējā `cached` kešā. */
const viewCache = new Map<string, { at: number; v: Promise<Awaited<ReturnType<typeof searchMapView>>> }>();

/**
 * Kartes dati redzamajam laukumam (`b=rietumi,dienvidi,austrumi,ziemeļi&z=tālummaiņa`) ar tiem pašiem filtriem kā sarakstā.
 * Atbilde: { total, points: [id, lat, lon, veids, cena, virsraksts][] } vai { total, cells: [lat, lon, skaits][] }.
 */
export async function GET(req: Request) {
  // kartes kustības: ~1 pieprasījums sekundē ir daudz; 120 minūtē no vienas adreses
  if (overLimit("search-points", clientIp(req.headers), 120, 60_000)) return Response.json({ error: "limit" }, { status: 429 });
  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const b = (url.searchParams.get("b") ?? "").split(",").map(Number);
  const z = Number(url.searchParams.get("z"));
  const ok = b.length === 4 && b.every(Number.isFinite) && Number.isFinite(z);
  // bez robežām: visa Latvija un Lietuva
  // robežas noapaļotas uz āru līdz režģim (atkarīgs no tālummaiņas): līdzīgi skati izmanto to pašu kešu
  const zoom = ok ? Math.min(18, Math.max(5, Math.round(z))) : 6;
  const g = 0.32 / 2 ** Math.max(0, zoom - 6);
  const dn = (v: number) => Math.floor(v / g) * g, up = (v: number) => Math.ceil(v / g) * g;
  const view = ok
    ? { west: Math.max(19, dn(b[0])), south: Math.max(53, dn(b[1])), east: Math.min(30, up(b[2])), north: Math.min(59, up(b[3])), zoom }
    : { west: 19, south: 53, east: 30, north: 59, zoom: 6 };
  for (const k of ["b", "z"]) delete sp[k];
  const s = parseSearch(sp);
  const key = `${JSON.stringify({ ...s, page: 1, sort: "" })}:${Object.values(view).map((v) => v.toFixed(4)).join(",")}`;
  let hit = viewCache.get(key);
  if (!hit || Date.now() - hit.at > 5 * 60_000) {
    hit = { at: Date.now(), v: searchMapView(s, view) };
    hit.v.catch(() => viewCache.delete(key));
    viewCache.set(key, hit);
    if (viewCache.size > 200) viewCache.delete(viewCache.keys().next().value!);
  }
  const r = await hit.v;
  const round = (n: number) => Math.round(n * 1e5) / 1e5;
  return Response.json(
    {
      total: r.total,
      points: r.points?.map((p) => [p.id, round(p.lat), round(p.lon), p.kind === "vehicle" ? 1 : 2, p.price, p.title]),
      cells: r.cells?.map((c) => [round(c.lat), round(c.lon), c.n]),
    },
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
