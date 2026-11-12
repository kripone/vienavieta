// Attāluma/brauciena laika zona meklēšanai: adrese vai koordinātas + "km" vai "min" → daudzstūris parametram `zone`.
// Brauciena laiks: openrouteservice izohrona (ORS_API_KEY); bez atslēgas aptuvens aplis (vid. ~33 km/h taisnā līnijā).
// Adresi ģeokodē Google Geocoding (GOOGLE_GEOCODING_KEY). Neko neglabājam; ierobežots pieprasījumu skaits.
import { NextResponse, type NextRequest } from "next/server";

const hits = new Map<string, { n: number; at: number }>();
const cache = new Map<string, unknown>();
const inLv = (lat: number, lon: number) => lat > 55.6 && lat < 58.2 && lon > 20.8 && lon < 28.4;

async function geocode(address: string) {
  const key = process.env.GOOGLE_GEOCODING_KEY;
  if (!key) return null;
  const q = new URLSearchParams({ address, components: "country:LV", region: "lv", language: "lv", key });
  const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${q}`, { signal: AbortSignal.timeout(10_000) });
  const j = (await r.json()) as { status: string; results?: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[] };
  const hit = j.status === "OK" ? j.results?.[0] : null;
  if (!hit || !inLv(hit.geometry.location.lat, hit.geometry.location.lng)) return null;
  return { lat: hit.geometry.location.lat, lon: hit.geometry.location.lng, label: hit.formatted_address.replace(/, Latvija$/, "").replace(/, LV-\d{4}/, "") };
}

function circle(lat: number, lon: number, km: number, n = 40): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    out.push([lat + (km / 111.2) * Math.cos(a), lon + (km / (111.2 * Math.cos((lat * Math.PI) / 180))) * Math.sin(a)]);
  }
  return out;
}

async function isochrone(lat: number, lon: number, minutes: number): Promise<[number, number][] | null> {
  const key = process.env.ORS_API_KEY;
  if (!key) return null;
  const r = await fetch("https://api.openrouteservice.org/v2/isochrones/driving-car", {
    method: "POST",
    headers: { Authorization: key, "content-type": "application/json" },
    body: JSON.stringify({ locations: [[lon, lat]], range: [minutes * 60], smoothing: 25 }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) { console.error("ORS izohrona:", r.status, (await r.text()).slice(0, 200)); return null; }
  const j = (await r.json()) as { features?: { geometry: { coordinates: [number, number][][] } }[] };
  const ring = j.features?.[0]?.geometry.coordinates[0];
  if (!ring || ring.length < 4) return null;
  // ne vairāk kā 70 punkti (parametra `zone` ierobežojums ir 80)
  const step = Math.max(1, Math.ceil(ring.length / 70));
  return ring.filter((_, i) => i % step === 0).map(([lo, la]) => [la, lo]);
}

export async function GET(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.at < 60_000) { if (++h.n > 15) return NextResponse.json({ error: "limit" }, { status: 429 }); } else hits.set(ip, { n: 1, at: now });
  if (hits.size > 5000) hits.clear();

  const sp = req.nextUrl.searchParams;
  const unit = sp.get("unit") === "min" ? "min" : "km";
  const value = Number(sp.get("value"));
  if (!Number.isFinite(value) || value < 1 || value > (unit === "min" ? 60 : 100)) return NextResponse.json({ error: "value" }, { status: 400 });
  const addr = (sp.get("addr") ?? "").trim().slice(0, 150);
  let lat = Number(sp.get("lat")), lon = Number(sp.get("lon"));
  let label = "";
  const ck = `${addr.toLowerCase()}|${sp.get("lat")}|${sp.get("lon")}|${unit}|${value}`;
  if (cache.has(ck)) return NextResponse.json(cache.get(ck));
  try {
    if (addr) {
      const g = await geocode(addr);
      if (!g) return NextResponse.json({ error: "notfound" }, { status: 404 });
      ({ lat, lon, label } = g);
    } else if (!sp.get("lat") || !Number.isFinite(lat) || !Number.isFinite(lon) || !inLv(lat, lon)) {
      return NextResponse.json({ error: "notfound" }, { status: 404 });
    }
    let pts: [number, number][] | null = null;
    let approx = false;
    if (unit === "min") {
      pts = await isochrone(lat, lon, value).catch(() => null);
      if (!pts) { pts = circle(lat, lon, value * 0.55); approx = true; }
    } else pts = circle(lat, lon, value);
    const zone = pts.map(([la, lo]) => `${Math.min(58.49, Math.max(53.51, la)).toFixed(4)},${Math.min(28.99, Math.max(20.01, lo)).toFixed(4)}`).join(";");
    const res = { zone, label, lat, lon, approx };
    if (cache.size > 500) cache.clear();
    cache.set(ck, res);
    return NextResponse.json(res);
  } catch (err) {
    console.error("Zonas aprēķins neizdevās:", err);
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
