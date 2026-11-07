// VZD darījumu cenas sludinājuma lapai: tajā pašā mājā un tuvākajā apkārtnē.
import { and, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { houseKey, houseTail } from "./vzd-key";

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
  // saīsināts ielas nosaukums ("Lejiņa 5" → "Paula Lejiņa iela 5"): tikai ar koordinātām, lai nesajauktu pilsētas
  const tail = l.address ? houseTail(l.address) : null;
  if (!same.length && tail && l.lat != null) same = await pick(and(eq(vzdDeals.houseTail, tail), near(0.03, 0.05)));
  // citādi: ēka ~35 m no ģeokodētās adreses
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

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? Math.round(s[Math.floor((s.length - 1) / 2)]) : null;
};
const threeYearsAgo = () => new Date(Date.now() - 3 * 365 * 86_400_000).toISOString().slice(0, 10);
/** ~5 km: tā pati iela citā pilsētā neskaitās */
const close = (a: { lat: number | null; lon: number | null }, b: { lat: number | null; lon: number | null }) =>
  a.lat == null || a.lon == null || b.lat == null || b.lon == null || (Math.abs(a.lat - b.lat) < 0.045 && Math.abs(a.lon - b.lon) < 0.08);

/** Kartītēm: mājas €/m² mediāna (VZD) pārdodamiem dzīvokļiem lapā. */
export async function vzdBadges(ids: string[]) {
  const out = new Map<string, { median: number; n: number }>();
  if (!ids.length) return out;
  const ls = await db
    .select({ id: schema.listings.id, address: schema.listings.address, lat: schema.listings.lat, lon: schema.listings.lon })
    .from(schema.listings)
    .where(and(inArray(schema.listings.id, ids), eq(schema.listings.propertyType, "Dzīvoklis"), eq(schema.listings.deal, "sell")));
  const keyed = ls.map((l) => ({ ...l, key: l.address ? houseKey(l.address) : null, tail: l.address ? houseTail(l.address) : null })).filter((l) => l.key);
  if (!keyed.length) return out;
  const deals = await db
    .select({ key: vzdDeals.houseKey, tail: vzdDeals.houseTail, day: vzdDeals.day, amount: vzdDeals.amount, areaM2: vzdDeals.areaM2, lat: vzdDeals.lat, lon: vzdDeals.lon })
    .from(vzdDeals)
    .where(or(inArray(vzdDeals.houseKey, [...new Set(keyed.map((l) => l.key!))]), inArray(vzdDeals.houseTail, [...new Set(keyed.map((l) => l.tail ?? l.key!))])));
  const cut = threeYearsAgo();
  for (const l of keyed) {
    let mine = deals.filter((d) => d.key === l.key && close(l, d));
    if (!mine.length && l.tail && l.lat != null) mine = deals.filter((d) => d.tail === l.tail && close(l, d));
    if (!mine.length) continue;
    const recent = mine.filter((d) => d.day >= cut);
    const basis = recent.length >= 3 ? recent : mine;
    const m = median(basis.map((d) => d.amount / Number(d.areaM2)));
    if (m) out.set(l.id, { median: m, n: basis.length });
  }
  return out;
}

/** Lapai /darijumi: darījumi pēc adreses (iela + mājas numurs), sagrupēti pa ēkām. */
export async function dealsByAddress(q: string) {
  const key = houseKey(q);
  const tail = houseTail(q);
  const rows = key
    ? await db
        .select({ day: vzdDeals.day, amount: vzdDeals.amount, areaM2: vzdDeals.areaM2, rooms: vzdDeals.rooms, floor: vzdDeals.floor, floors: vzdDeals.floors, address: vzdDeals.address, builtYear: vzdDeals.builtYear, material: vzdDeals.material })
        .from(vzdDeals)
        .where(tail ? or(eq(vzdDeals.houseKey, key), eq(vzdDeals.houseTail, tail)) : eq(vzdDeals.houseKey, key))
        .orderBy(desc(vzdDeals.day))
        .limit(800)
    : [];
  // pilsēta/vieta no pieprasījuma (piem. "Kalna 13a, Rīga") sašaurina, ja tā pati iela ir vairākās vietās
  const cityPart = q.split(",").slice(1).join(" ").trim().toLowerCase();
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    if (cityPart && !r.address.toLowerCase().includes(cityPart)) continue;
    groups.set(r.address, [...(groups.get(r.address) ?? []), r]);
  }
  const cut = threeYearsAgo();
  const houses = [...groups].map(([address, deals]) => {
    const recent = deals.filter((d) => d.day >= cut);
    const basis = recent.length >= 3 ? recent : deals;
    return { address, deals, median: median(basis.map((d) => d.amount / Number(d.areaM2))), medianN: basis.length, medianRecent: basis === recent, builtYear: deals[0].builtYear, material: deals[0].material };
  });
  // precīza iela vispirms, tad pēc darījumu skaita
  houses.sort((a, b) => Number(houseKey(b.address) === key) - Number(houseKey(a.address) === key) || b.deals.length - a.deals.length);
  // ja precīzi neatrada: līdzīgas adreses ieteikumiem
  let suggestions: string[] = [];
  if (!houses.length && q.trim().length >= 3) {
    const term = q.split(",")[0].trim().replace(/[%_]/g, "");
    const r = await db.execute<{ address: string }>(sql`select address from vzd_deals where address ilike ${"%" + term + "%"} group by address order by count(*) desc limit 15`);
    suggestions = r.rows.map((x) => x.address);
  }
  return { houses, suggestions };
}
