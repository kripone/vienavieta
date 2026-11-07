// Cenas novērtējums: sludinājuma cena pret līdzīgo mediānu (arī no citiem portāliem, bez tā paša objekta dublikātiem).
// Auto: tā pati klase, marka, modelis, gads ±PRICE_EVAL.YEARS. Īpašumi: cena par m² (zemei par zemes m²)
// tajā pašā reģionā, veidā un darījumā.
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { PRICE_EVAL } from "./constants";

export type PriceEval = { label: "Laba cena" | "Tirgus cena" | "Virs tirgus"; cls: "good" | "fair" | "high"; ratio: number; median: number; n: number; perM2: boolean };

const cache = new Map<string, { at: number; v: PriceEval | null }>();
const TTL = 10 * 60_000;

function verdict(ratio: number, median: number, n: number, perM2: boolean): PriceEval {
  const [label, cls] = ratio < PRICE_EVAL.GOOD ? (["Laba cena", "good"] as const) : ratio > PRICE_EVAL.HIGH ? (["Virs tirgus", "high"] as const) : (["Tirgus cena", "fair"] as const);
  return { label, cls, ratio, median: Math.round(median), n, perM2 };
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
        and x.price > 100
    ) e
    where l.id in (${idList}) and l.kind = 'vehicle' and l.make_id is not null and l.model_id is not null and l.year is not null`);

  const unit = (t: string) => sql.raw(`(case when ${t}.property_type = 'Zeme' then ${t}.land_m2::numeric else ${t}.area_m2 end)`);
  const props = await db.execute<{ id: string; price: number; u: number; med: number | null; n: number }>(sql`
    select l.id, l.price, ${unit("l")} as u, e.med, e.n
    from listings l
    join places p on p.id = l.place_id
    cross join lateral (
      select percentile_cont(0.5) within group (order by x.price / ${unit("x")}) as med, count(*)::int as n
      from listings x join places px on px.id = x.place_id
      where x.status = 'active' and x.kind = 'property' and x.property_type = l.property_type
        and x.deal is not distinct from l.deal and px.region_id = p.region_id
        and ${unit("x")} > 0 and x.id <> l.id and (l.group_key is null or x.group_key is distinct from l.group_key)
    ) e
    where l.id in (${idList}) and l.kind = 'property' and ${unit("l")} > 0`);

  for (const id of need) out.set(id, null);
  for (const r of vehicles.rows) {
    if (r.med && r.n >= PRICE_EVAL.MIN) out.set(r.id, verdict(r.price / r.med, r.med, r.n, false));
  }
  for (const r of props.rows) {
    if (r.med && r.n >= PRICE_EVAL.MIN && Number(r.u) > 0) out.set(r.id, verdict(r.price / Number(r.u) / r.med, r.med, r.n, true));
  }
  for (const id of need) cache.set(id, { at: now, v: out.get(id) ?? null });
  return out;
}

