// Adrešu ģeokodēšana (Google Geocoding API) īpašumu precīzai vietai kartē.
// Atslēga: GOOGLE_GEOCODING_KEY (servera atslēga, ierobežota tikai uz Geocoding API).
// Katra adrese tiek vaicāta vienreiz (geocode_cache); par rezultātu pieņem tikai ielas/mājas precizitāti Latvijā.
import { and, eq, isNotNull, or, isNull, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { listings, geocodeCache } = schema;
const KEY = () => process.env.GOOGLE_GEOCODING_KEY ?? "";
export const geocodingEnabled = () => Boolean(KEY());

type Hit = { lat: number; lon: number } | null;

async function lookup(address: string): Promise<Hit> {
  const q = new URLSearchParams({ address, components: "country:LV", region: "lv", language: "lv", key: KEY() });
  const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${q}`, { signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`Geocoding HTTP ${r.status}`);
  const j = (await r.json()) as {
    status: string;
    error_message?: string;
    results?: { types: string[]; geometry: { location: { lat: number; lng: number }; location_type: string } }[];
  };
  if (j.status === "ZERO_RESULTS") return null;
  if (j.status !== "OK") throw new Error(`Geocoding ${j.status}${j.error_message ? `: ${j.error_message}` : ""}`);
  const hit = j.results?.find(
    (x) => ["ROOFTOP", "RANGE_INTERPOLATED"].includes(x.geometry.location_type) || x.types.some((t) => ["street_address", "premise", "subpremise", "route"].includes(t)),
  );
  if (!hit) return null;
  const { lat, lng } = hit.geometry.location;
  return lat > 55.6 && lat < 58.2 && lng > 20.8 && lng < 28.4 ? { lat, lon: lng } : null; // tikai Latvija
}

/** Ģeokodē līdz `limit` aktīviem sludinājumiem ar adresi, kam vēl nav ielas precizitātes. */
export async function geocodePending(limit = 40) {
  if (!geocodingEnabled()) return { done: 0, found: 0, cached: 0, errors: 0, skipped: "nav GOOGLE_GEOCODING_KEY" };
  const rows = await db
    .select({ id: listings.id, address: listings.address })
    .from(listings)
    .where(and(eq(listings.status, "active"), isNotNull(listings.address), or(isNull(listings.geoPrecision), ne(listings.geoPrecision, "street")), sql`not exists (select 1 from geocode_cache c where c.query = ${listings.address} and c.ok = false)`))
    .limit(limit);
  const res = { done: 0, found: 0, cached: 0, errors: 0 };
  for (const r of rows) {
    const query = r.address!;
    let hit: Hit;
    const cached = await db.query.geocodeCache.findFirst({ where: eq(geocodeCache.query, query) });
    if (cached) {
      hit = cached.ok ? { lat: cached.lat!, lon: cached.lon! } : null;
      res.cached++;
    } else {
      try {
        hit = await lookup(query);
      } catch (err) {
        res.errors++;
        console.error("Ģeokodēšana neizdevās:", err instanceof Error ? err.message : err);
        if (res.errors >= 3) break; // piem. nederīga atslēga vai kvota
        continue;
      }
      await db.insert(geocodeCache).values({ query, lat: hit?.lat ?? null, lon: hit?.lon ?? null, ok: Boolean(hit) }).onConflictDoNothing();
    }
    res.done++;
    if (hit) {
      res.found++;
      await db.update(listings).set({ lat: hit.lat, lon: hit.lon, geoPrecision: "street" }).where(eq(listings.id, r.id));
    }
  }
  return res;
}
