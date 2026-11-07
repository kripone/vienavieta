// VZD darījumu cenas sludinājuma lapai: tajā pašā mājā un tuvākajā apkārtnē.
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { houseKey } from "./vzd-key";

const { vzdDeals } = schema;

export type VzdDeal = { day: string; amount: number; areaM2: string; rooms: number | null; floor: number | null; floors: number | null; address: string };

/** Darījumi tajā pašā mājā un tuvumā (tikai dzīvokļiem ar ielu un mājas numuru). */
export async function dealsForListing(l: { address: string | null; lat: number | null; lon: number | null; geoPrecision: string | null; rooms: number | null }) {
  const key = l.address ? houseKey(l.address) : null;
  const exact = l.geoPrecision === "street" && l.lat != null && l.lon != null;
  if (!key && !exact) return null;
  // tā pati māja: sakrīt iela+numurs un (ja zināms) būve ne tālāk par ~3 km (vienādas ielas citās pilsētās)
  const near = (dLat: number, dLon: number) =>
    l.lat != null && l.lon != null
      ? sql`${vzdDeals.lat} between ${l.lat - dLat} and ${l.lat + dLat} and ${vzdDeals.lon} between ${l.lon - dLon} and ${l.lon + dLon}`
      : sql`true`;
  const pick = (where: ReturnType<typeof sql> | undefined) =>
    db
      .select({ day: vzdDeals.day, amount: vzdDeals.amount, areaM2: vzdDeals.areaM2, rooms: vzdDeals.rooms, floor: vzdDeals.floor, floors: vzdDeals.floors, address: vzdDeals.address })
      .from(vzdDeals)
      .where(where)
      .orderBy(desc(vzdDeals.day))
      .limit(40);
  let same = key ? await pick(and(eq(vzdDeals.houseKey, key), sql`(${vzdDeals.lat} is null or (${near(0.03, 0.05)}))`)) : [];
  // ielas nosaukums atšķiras (piem. "Valdemāra" pret "Krišjāņa Valdemāra iela"): ēka ~35 m no ģeokodētās adreses
  if (!same.length && exact) same = await pick(near(0.0003, 0.0005));
  // apkārtne: ~400 m, pēdējie 2 gadi, līdzīgs istabu skaits
  let area: { n: number; median: number | null } | null = null;
  if (exact) {
    const since = new Date(Date.now() - 730 * 86_400_000).toISOString().slice(0, 10);
    const [r] = await db
      .select({
        n: sql<number>`count(*)::int`,
        median: sql<number | null>`percentile_cont(0.5) within group (order by ${vzdDeals.amount} / ${vzdDeals.areaM2}::float)`,
      })
      .from(vzdDeals)
      .where(and(near(0.0036, 0.0065), gte(vzdDeals.day, since), l.rooms ? sql`${vzdDeals.rooms} between ${l.rooms - 1} and ${l.rooms + 1}` : sql`true`));
    area = r.n >= 3 ? { n: r.n, median: r.median ? Math.round(r.median) : null } : null;
  }
  if (!same.length && !area) return null;
  // mājas mediāna: pēdējie 3 gadi, ja tajos ir vismaz 3 darījumi, citādi visi kopš 2016
  const cut = new Date(Date.now() - 3 * 365 * 86_400_000).toISOString().slice(0, 10);
  const recent = same.filter((d) => d.day >= cut);
  const basis = recent.length >= 3 ? recent : same;
  const perM2 = basis.map((d) => d.amount / Number(d.areaM2)).sort((a, b) => a - b);
  const median = perM2.length ? Math.round(perM2[Math.floor((perM2.length - 1) / 2)]) : null;
  return { same, median, medianN: basis.length, medianRecent: basis === recent, area };
}
