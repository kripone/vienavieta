// Cenas novērtējums: sludinājuma cena pret līdzīgo mediānu (arī no citiem portāliem, bez tā paša objekta dublikātiem).
// Auto: tā pati klase, marka, modelis, gads ±PRICE_EVAL.YEARS. Īpašumi: cena par m² (zemei par zemes m²)
// tajā pašā reģionā, veidā un darījumā.
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { PRICE_EVAL } from "./constants";
import { plausibleVehicle } from "./plausible";
import { groupPrimaryAs } from "./dedupe";

/** scope: ar ko salīdzināts – tas pats modelis (auto), tā pati vieta (apkaime/pilsēta) vai viss reģions (īpašumi) */
export type PriceEval = { label: "Laba cena" | "Tirgus cena" | "Virs tirgus"; cls: "good" | "fair" | "high"; ratio: number; median: number; n: number; perM2: boolean; scope: "model" | "place" | "region" };

const cache = new Map<string, { at: number; v: PriceEval | null }>();
const TTL = 10 * 60_000;

function verdict(ratio: number, median: number, n: number, perM2: boolean, scope: PriceEval["scope"]): PriceEval {
  const [label, cls] = ratio < PRICE_EVAL.GOOD ? (["Laba cena", "good"] as const) : ratio > PRICE_EVAL.HIGH ? (["Virs tirgus", "high"] as const) : (["Tirgus cena", "fair"] as const);
  // mediānu glabājam ar tādu precizitāti, kādu rādām (mazām €/m² vērtībām 2 zīmes aiz komata), lai % atbilst redzamajam skaitlim
  return { label, cls, ratio, median: median < 100 ? Math.round(median * 100) / 100 : Math.round(median), n, perM2, scope };
}

/** Novērtējums dotajiem sludinājumiem (līdz ~50); null, ja līdzīgu par maz. */
export async function priceEvals(ids: string[]): Promise<Map<string, PriceEval | null>> {
  const out = new Map<string, PriceEval | null>();
  const now = Date.now();
  const need = ids.filter((id) => {
    const c = cache.get(id);
    if (c && now - c.at < TTL) {
      out.set(id, c.v);
      return false;
    }
    return true;
  });
  if (!need.length) return out;
  const idList = sql.join(need.map((id) => sql`${id}`), sql`, `);

  const vehicles = await db.execute<{ id: string; price: number; med: number | null; n: number }>(sql`
    select l.id, l.price, e.med, e.n
    from listings l
    cross join lateral (
      select percentile_cont(0.5) within group (order by x.price) as med, count(*)::int as n
      from listings x
      where x.status = 'active' and x.kind = 'vehicle' and x.vehicle_class = l.vehicle_class
        and x.make_id = l.make_id and x.model_id = l.model_id
        and x.year between l.year - ${PRICE_EVAL.YEARS} and l.year + ${PRICE_EVAL.YEARS}
        and x.id <> l.id and (l.group_key is null or x.group_key is distinct from l.group_key)
        and x.price > 100 and ${plausibleVehicle("x")} and ${groupPrimaryAs("x")}
    ) e
    where l.id in (${idList}) and l.kind = 'vehicle' and l.make_id is not null and l.model_id is not null and l.year is not null and ${plausibleVehicle("l")}`);

  // Īpašumi: agrāk mediānu rēķināja SQL katram sludinājumam atsevišķi (lateral), un lapā ar 24 dzīvokļiem
  // tas pašu reģionu pārlasīja 24 reizes (~1 s datubāzē). Tagad vienā vaicājumā nolasām grupas (veids, darījums, reģions)
  // €/m² vērtības un mediānu katram sludinājumam rēķinām šeit, izslēdzot to pašu un tā dublikātus (rezultāts tāds pats).
  // platība: zemei zemes m² (≥ LAND_MIN), pārējam telpu m² (≥ AREA_MIN); mazāka = trūkstoša (portālos „1 m²”) → €/m² nerēķinām
  const unit = (t: string) => sql.raw(`(case when ${t}.property_type = 'Zeme' then nullif(greatest(${t}.land_m2::numeric, 0), 0) * (${t}.land_m2 >= ${PRICE_EVAL.LAND_MIN})::int else ${t}.area_m2 * (${t}.area_m2 >= ${PRICE_EVAL.AREA_MIN})::int end)`);
  const props = await db.execute<{ id: string; price: number; u: number; group_key: string | null; property_type: string; deal: string | null; region_id: number; place_id: number }>(sql`
    select l.id, l.price, ${unit("l")}::float8 as u, l.group_key, l.property_type, l.deal::text as deal, p.region_id, l.place_id
    from listings l
    join places p on p.id = l.place_id
    where l.id in (${idList}) and l.kind = 'property' and l.property_type is not null and ${unit("l")} > 0`);
  const groups = await propertyGroups(props.rows.map((r) => groupKeyOf(r.property_type, r.deal, r.region_id)));

  for (const id of need) out.set(id, null);
  for (const r of vehicles.rows) {
    const ratio = r.med ? r.price / r.med : 0;
    if (r.med && r.n >= PRICE_EVAL.MIN && ratio >= PRICE_EVAL.RATIO_MIN_VEHICLE && ratio <= PRICE_EVAL.RATIO_MAX) out.set(r.id, verdict(ratio, r.med, r.n, false, "model"));
  }
  for (const r of props.rows) {
    const vals = groups.get(groupKeyOf(r.property_type, r.deal, r.region_id)) ?? [];
    const others = vals.filter((x) => x.id !== r.id && (r.group_key == null || x.g !== r.group_key));
    // vispirms tā pati vieta (apkaime, pilsēta, pagasts): tur cenas līdzīgākas nekā visā reģionā
    const near = others.filter((x) => x.p === Number(r.place_id));
    const [own, scope] = near.length >= PRICE_EVAL.PLACE_MIN ? [near.map((x) => x.v), "place" as const] : [others.map((x) => x.v), "region" as const];
    const med = medianCont(own);
    const u = Number(r.u);
    const ratio = med && u > 0 ? r.price / u / med : 0;
    if (med && own.length >= PRICE_EVAL.MIN && u > 0 && ratio >= PRICE_EVAL.RATIO_MIN && ratio <= PRICE_EVAL.RATIO_MAX) out.set(r.id, verdict(ratio, med, own.length, true, scope));
  }
  for (const id of need) cache.set(id, { at: now, v: out.get(id) ?? null });
  return out;
}

const groupKeyOf = (type: string, deal: string | null, region: number) => `${type}|${deal ?? ""}|${region}`;

/** Grupas (veids|darījums|reģions) aktīvo īpašumu cena par m², kešota tikpat ilgi kā novērtējumi. */
type GroupVal = { id: string; g: string | null; p: number; v: number };
const groupCache = new Map<string, { at: number; v: GroupVal[] }>();
async function propertyGroups(keys: string[]): Promise<Map<string, GroupVal[]>> {
  const out = new Map<string, GroupVal[]>();
  const now = Date.now();
  const need = [...new Set(keys)].filter((k) => {
    const c = groupCache.get(k);
    if (c && now - c.at < TTL) {
      out.set(k, c.v);
      return false;
    }
    return true;
  });
  if (!need.length) return out;
  const tuples = sql.join(
    need.map((k) => {
      const [type, deal, region] = k.split("|");
      return sql`(${type}, ${deal}, ${Number(region)})`;
    }),
    sql`, `,
  );
  const unit = sql.raw(`(case when x.property_type = 'Zeme' then x.land_m2::numeric * (x.land_m2 >= ${PRICE_EVAL.LAND_MIN})::int else x.area_m2 * (x.area_m2 >= ${PRICE_EVAL.AREA_MIN})::int end)`);
  const rows = await db.execute<{ id: string; group_key: string | null; property_type: string; deal: string; region_id: number; place_id: number; v: number }>(sql`
    select x.id, x.group_key, x.property_type, coalesce(x.deal::text, '') as deal, px.region_id, x.place_id, (x.price / ${unit})::float8 as v
    from listings x join places px on px.id = x.place_id
    where x.status = 'active' and x.kind = 'property' and ${unit} > 0 and ${groupPrimaryAs("x")}
      and (x.property_type, coalesce(x.deal::text, ''), px.region_id) in (${tuples})`);
  for (const k of need) out.set(k, []);
  for (const r of rows.rows) out.get(groupKeyOf(r.property_type, r.deal || null, Number(r.region_id)))?.push({ id: r.id, g: r.group_key, p: Number(r.place_id), v: Number(r.v) });
  for (const k of need) {
    groupCache.set(k, { at: now, v: out.get(k)! });
    if (groupCache.size > 500) groupCache.delete(groupCache.keys().next().value!);
  }
  return out;
}

/** Mediāna kā Postgres percentile_cont(0.5): pāra skaitam vidējais no abām vidējām vērtībām. */
function medianCont(vals: number[]): number | null {
  if (!vals.length) return null;
  const s = [...vals].sort((a, b) => a - b);
  const m = (s.length - 1) / 2;
  return (s[Math.floor(m)] + s[Math.ceil(m)]) / 2;
}

