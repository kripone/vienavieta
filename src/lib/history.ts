// Sludinājumu vēsture: cenu izmaiņas, dienas tirgū, cenu kritumi un meklēšana pēc saites.
// price_history glabā cenu katrā brīdī, kad tā mainījusies (arī sākuma cenu ievācot).
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { cardFields } from "@/lib/listings";
import { groupPrimaryOnly } from "@/lib/dedupe";
import { DROP_MAX } from "@/lib/constants";
import { cached } from "@/lib/search";

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

export type ChangeDir = "down" | "up";
type ChangeOpts = { kind?: "vehicle" | "property"; days?: number };

/**
 * Pēdējā cenu izmaiņa katram aktīvajam sludinājumam periodā (viens objekts no dublikātu grupas vienreiz).
 * Izmaiņa virs DROP_MAX (50%) abos virzienos ir aizdomīga (drukas kļūda, vienības/valūtas maiņa) un netiek ņemta;
 * tieši 50% tiek ņemta (robeža ir „> 50%”).
 */
function changesSql(opts: ChangeOpts) {
  const since = new Date(Date.now() - (opts.days ?? 7) * 86_400_000);
  return sql`
    with ch as (
      select listing_id, prev, price, changed_at from (
        select ph.listing_id, ph.price, ph.changed_at,
               lag(ph.price) over (partition by ph.listing_id order by ph.changed_at, ph.id) as prev,
               row_number() over (partition by ph.listing_id order by ph.changed_at desc, ph.id desc) as rn
        from price_history ph
        where ph.listing_id in (select listing_id from price_history group by listing_id having count(*) > 1 and max(changed_at) >= ${since})
      ) x
      where rn = 1 and prev is not null and prev > 0 and changed_at >= ${since}
        and price between prev * ${1 - DROP_MAX}::float8 and prev * ${1 + DROP_MAX}::float8 and price <> prev
    )
    select ch.listing_id, ch.prev, ch.price, ch.changed_at from ch
    join listings on listings.id = ch.listing_id
    where listings.status = 'active' and listings.price = ch.price and ${groupPrimaryOnly}
      ${opts.kind ? sql`and listings.kind = ${opts.kind}` : sql``}`;
}

/** Cenu kritumi vai kāpumi: kārtojums pēc laika ("time") vai izmaiņas % ("pct"); vienādiem – jaunākais pirmais. */
export function recentChanges(opts: ChangeOpts & { dir?: ChangeDir; order?: "time" | "pct"; limit?: number } = {}) {
  // kešs (10 min svaigs, pēc tam rāda veco un pārrēķina fonā): vaicājums pār visu cenu vēsturi aizņem sekundes
  return cached(`chg:${JSON.stringify(opts)}`, () => loadChanges(opts));
}
async function loadChanges(opts: ChangeOpts & { dir?: ChangeDir; order?: "time" | "pct"; limit?: number }) {
  const dir = opts.dir ?? "down";
  const limit = opts.limit ?? 60;
  const order = opts.order === "pct" ? sql`abs(c.price - c.prev)::float8 / c.prev desc, c.changed_at desc` : sql`c.changed_at desc`;
  const res = await db.execute<{ listing_id: string; prev: number; price: number; ms: number }>(sql`
    select c.listing_id, c.prev, c.price, (extract(epoch from c.changed_at) * 1000)::float8 as ms
    from (${changesSql(opts)}) c
    where ${dir === "down" ? sql`c.price < c.prev` : sql`c.price > c.prev`}
    order by ${order}, c.listing_id
    limit ${limit}`);
  const ids = res.rows.map((r) => r.listing_id);
  if (!ids.length) return [];
  const cards = await db
    .select({ ...cardFields, firstPrice: firstPriceSql })
    .from(listings)
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .where(inArray(listings.id, ids));
  const byId = new Map(cards.map((c) => [c.id, c]));
  return res.rows
    .filter((r) => byId.has(r.listing_id))
    .map((r) => {
      const prev = Number(r.prev), price = Number(r.price);
      // viens avots: € un % rēķina no tā paša pāra (iepriekšējā → pašreizējā cena)
      return { card: byId.get(r.listing_id)!, prev, at: new Date(Number(r.ms)), diff: price - prev, pct: Math.round(((price - prev) / prev) * 100) };
    });
}

/** Kritumu un kāpumu skaits periodā (cilņu skaitļiem). */
export function changeCounts(opts: ChangeOpts = {}) {
  return cached(`chgn:${JSON.stringify(opts)}`, async () => {
  const res = await db.execute<{ down: number; up: number }>(sql`
    select count(*) filter (where c.price < c.prev)::int as down, count(*) filter (where c.price > c.prev)::int as up
    from (${changesSql(opts)}) c`);
  return { down: Number(res.rows[0]?.down ?? 0), up: Number(res.rows[0]?.up ?? 0) };
  });
}

/** Pēdējie cenu kritumi (jaunākie pirmie) – saderībai (AI čats). */
export const recentDrops = (opts: ChangeOpts & { limit?: number } = {}) => recentChanges({ ...opts, dir: "down", order: "time" });

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
