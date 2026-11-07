// Sludinājumu vēsture: cenu izmaiņas, dienas tirgū, cenu kritumi un meklēšana pēc saites.
// price_history glabā cenu katrā brīdī, kad tā mainījusies (arī sākuma cenu ievācot).
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { cardFields } from "@/lib/listings";
import { groupPrimaryOnly } from "@/lib/dedupe";

const { listings, priceHistory, places, regions } = schema;

/** Sākuma cena (listings.first_price; null, ja cena nav mainīta). */
export const firstPriceSql = sql<number | null>`${listings.firstPrice}`;

export type HistoryPoint = { price: number; at: Date };

/** Sludinājuma cenu vēsture laika secībā; pēdējais punkts ir pašreizējā cena. */
export async function listingHistory(l: { id: string; price: number; createdAt: Date }) {
  const rows = await db
    .select({ price: priceHistory.price, at: priceHistory.changedAt })
    .from(priceHistory)
    .where(eq(priceHistory.listingId, l.id))
    .orderBy(priceHistory.changedAt, priceHistory.id);
  const points: HistoryPoint[] = [];
  for (const r of rows) if (!points.length || points[points.length - 1].price !== r.price) points.push(r);
  if (!points.length) points.push({ price: l.price, at: l.createdAt });
  else if (points[0].at > l.createdAt) points[0] = { ...points[0], at: l.createdAt };
  if (points[points.length - 1].price !== l.price) points.push({ price: l.price, at: new Date() });
  const first = points[0].price;
  const days = Math.max(0, Math.floor((Date.now() - l.createdAt.getTime()) / 86_400_000));
  return { points, first, changes: points.length - 1, days, min: Math.min(...points.map((p) => p.price)), max: Math.max(...points.map((p) => p.price)) };
}

/** Pēdējie cenu kritumi: izmaiņa, kur jaunā cena zemāka par iepriekšējo. */
export async function recentDrops(opts: { kind?: "vehicle" | "property"; days?: number; limit?: number } = {}) {
  const days = opts.days ?? 7;
  const limit = opts.limit ?? 60;
  const since = new Date(Date.now() - days * 86_400_000);
  const drops = await db.execute<{ listing_id: string; prev: number; price: number; ms: number }>(sql`
    select listing_id, prev, price, (extract(epoch from changed_at) * 1000)::float8 as ms from (
      select ph.listing_id, ph.price, ph.changed_at,
             lag(ph.price) over (partition by ph.listing_id order by ph.changed_at, ph.id) as prev,
             row_number() over (partition by ph.listing_id order by ph.changed_at desc, ph.id desc) as rn
      from price_history ph
      where ph.listing_id in (select listing_id from price_history group by listing_id having count(*) > 1 and max(changed_at) >= ${since})
    ) x
    where rn = 1 and prev is not null and price < prev and changed_at >= ${since}
    order by changed_at desc
    limit ${limit * 3}
  `);
  const ids = drops.rows.map((r) => r.listing_id);
  if (!ids.length) return [];
  const conds = [inArray(listings.id, ids), eq(listings.status, "active"), groupPrimaryOnly];
  if (opts.kind) conds.push(eq(listings.kind, opts.kind));
  const cards = await db
    .select({ ...cardFields, firstPrice: firstPriceSql })
    .from(listings)
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .where(and(...conds));
  const byId = new Map(cards.map((c) => [c.id, c]));
  return drops.rows
    .filter((d) => byId.has(d.listing_id) && byId.get(d.listing_id)!.price === d.price)
    .slice(0, limit)
    .map((d) => ({ card: byId.get(d.listing_id)!, prev: Number(d.prev), at: new Date(Number(d.ms)) }));
}

/** Normalizē portāla saiti salīdzināšanai: bez protokola, www, vaicājuma un beigu slīpsvītras. */
export function normalizeUrl(u: string) {
  const s = u.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[?#]/)[0].replace(/\/+$/, "");
  // ss.lv un citu valodu versijas ved uz to pašu sludinājumu
  return s.toLowerCase().replace(/^ss\.lv\//, "ss.com/").replace(/^ss\.com\/msg\/(ru|en)\//, "ss.com/msg/lv/");
}

/** Atrod sludinājumu pēc oriģinālās saites (ss.com u.c.) vai mūsu pašu saites. */
export async function findByUrl(input: string) {
  const own = input.match(/\/sludinajumi\/([0-9a-f-]{36})/i);
  if (own) {
    const [r] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, own[1].toLowerCase())).limit(1);
    return r?.id ?? null;
  }
  const n = normalizeUrl(input);
  if (!n || n.length < 8) return null;
  if (n.startsWith("ss.com/")) {
    const [hit] = await db.select({ id: listings.id }).from(listings).where(inArray(listings.externalUrl, [`https://www.${n}`, `https://www.${n}/`])).limit(1);
    if (hit) return hit.id;
  }
  const [r] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(sql`lower(regexp_replace(regexp_replace(split_part(${listings.externalUrl}, '?', 1), '^https?://(www\\.)?', '', 'i'), '/+$', '')) = ${n}`)
    .orderBy(desc(listings.createdAt))
    .limit(1);
  return r?.id ?? null;
}
