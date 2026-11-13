import { parseSearch, searchMapView } from "@/lib/search";

/**
 * Kartes dati redzamajam laukumam (`b=rietumi,dienvidi,austrumi,ziemeļi&z=tālummaiņa`) ar tiem pašiem filtriem kā sarakstā.
 * Atbilde: { total, points: [id, lat, lon, veids, cena, virsraksts][] } vai { total, cells: [lat, lon, skaits][] }.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const b = (url.searchParams.get("b") ?? "").split(",").map(Number);
  const z = Number(url.searchParams.get("z"));
  const ok = b.length === 4 && b.every(Number.isFinite) && Number.isFinite(z);
  // bez robežām: visa Latvija un Lietuva
  const view = ok
    ? { west: Math.max(19, b[0]), south: Math.max(53, b[1]), east: Math.min(30, b[2]), north: Math.min(59, b[3]), zoom: Math.min(18, Math.max(5, Math.round(z))) }
    : { west: 19, south: 53, east: 30, north: 59, zoom: 6 };
  const r = await searchMapView(parseSearch(sp), view);
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
