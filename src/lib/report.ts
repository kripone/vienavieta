// Ikmēneša tirgus pārskats (/parskati/<gads-mēnesis>): aprēķināts no sludinājumiem, kas tajā mēnesī bija pieejami,
// cenu izmaiņām (price_history) un dienas momentuzņēmumiem (market_stats). Viens objekts vairākos portālos skaitās vienreiz.
import { sql } from "drizzle-orm";
import { db } from "@/db";

type Row = Record<string, unknown>;
const rows = async <T extends Row>(q: ReturnType<typeof sql>) => (await db.execute<T>(q)).rows;
const primary = sql.raw(`(l.group_key is null or not exists (select 1 from listings g where g.group_key = l.group_key and g.id <> l.id and (g.source = 'own' and l.source <> 'own' or (g.source <> 'own' and l.source <> 'own' and g.created_at < l.created_at))))`);

export const MONTH_RE = /^(20\d\d)-(0[1-9]|1[0-2])$/;
export function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));
  return { from, to, prev: `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}` };
}

/** Mēneši, kuros ir pietiekami daudz datu (vismaz 500 jaunu sludinājumu), jaunākie vispirms. */
export async function reportMonths() {
  const r = await rows<{ ym: string; n: string }>(sql`
    select to_char(m, 'YYYY-MM') ym, (select count(*) from listings where created_at < m + interval '1 month') n
    from generate_series(date_trunc('month', (select min(created_at) from listings)), date_trunc('month', now()), interval '1 month') m
    order by m desc limit 36`);
  return r.map((x) => ({ ym: x.ym, n: Number(x.n) }));
}

export async function monthReport(ym: string) {
  const { from, to } = monthRange(ym);
  // mēneša piedāvājums: sludinājumi, kas tajā mēnesī bija pieejami (parādījās pirms mēneša beigām un toreiz vēl nebija noņemti)
  const inMonth = sql`l.created_at < ${to.toISOString()}::timestamptz and (l.status = 'active' or l.updated_at >= ${from.toISOString()}::timestamptz) and l.status <> 'deleted'`;
  const [totals, carModels, rigaFlats, flatRegions, drops, biggest] = await Promise.all([
    rows<{ kind: string; n: string }>(sql`select l.kind, count(*) n from listings l where ${inMonth} and ${primary} group by l.kind`),
    rows<{ make: string; model: string; n: string; median: number; year: number | null }>(sql`
      select mk.name make, mo.name model, count(*) n, percentile_cont(0.5) within group (order by l.price)::int median,
        percentile_cont(0.5) within group (order by l.year)::int "year"
      from listings l join makes mk on mk.id = l.make_id join models mo on mo.id = l.model_id
      where ${inMonth} and l.kind = 'vehicle' and l.vehicle_class = 'car' and l.price > 300 and ${primary}
      group by mk.name, mo.name order by count(*) desc limit 15`),
    rows<{ place: string; n: string; median: number }>(sql`
      select p.name place, count(*) n, percentile_cont(0.5) within group (order by l.price / l.area_m2)::int median
      from listings l join places p on p.id = l.place_id join regions r on r.id = p.region_id
      where ${inMonth} and l.property_type = 'Dzīvoklis' and l.deal = 'sell' and l.area_m2 > 0 and l.price > 1000 and r.name = 'Rīga' and ${primary}
      group by p.name having count(*) >= 5 order by median desc`),
    rows<{ region: string; n: string; median: number; rent: number | null }>(sql`
      select r.name region, count(*) filter (where l.deal = 'sell') n,
        (percentile_cont(0.5) within group (order by l.price / l.area_m2) filter (where l.deal = 'sell'))::int median,
        (percentile_cont(0.5) within group (order by l.price) filter (where l.deal = 'rent'))::int rent
      from listings l join places p on p.id = l.place_id join regions r on r.id = p.region_id
      where ${inMonth} and l.property_type = 'Dzīvoklis' and l.area_m2 > 0 and l.price > 50 and r.country = 'LV' and ${primary}
      group by r.name having count(*) filter (where l.deal = 'sell') >= 15 order by count(*) filter (where l.deal = 'sell') desc limit 12`),
    rows<{ n: string; median_pct: number | null }>(sql`
      with ch as (
        select h.listing_id, h.price, lag(h.price) over (partition by h.listing_id order by h.changed_at) prev, h.changed_at
        from price_history h)
      select count(*) n, (percentile_cont(0.5) within group (order by (prev - price)::numeric / prev * 100))::numeric(5,1) median_pct
      from ch where prev is not null and price < prev and changed_at >= ${from.toISOString()}::timestamptz and changed_at < ${to.toISOString()}::timestamptz`),
    rows<{ id: string; title: string; price: number; first: number }>(sql`
      select l.id, l.title, l.price, l.first_price "first" from listings l
      where l.status = 'active' and l.first_price is not null and l.first_price > l.price and l.price > 1000
        and exists (select 1 from price_history h where h.listing_id = l.id and h.changed_at >= ${from.toISOString()}::timestamptz and h.changed_at < ${to.toISOString()}::timestamptz)
      order by (l.first_price - l.price)::numeric / l.first_price desc limit 8`),
  ]);
  const count = (k: string) => Number(totals.find((x) => x.kind === k)?.n ?? 0);
  return {
    vehicles: count("vehicle"),
    property: count("property"),
    carModels: carModels.map((x) => ({ ...x, n: Number(x.n) })),
    rigaFlats: rigaFlats.map((x) => ({ ...x, n: Number(x.n) })),
    flatRegions: flatRegions.map((x) => ({ ...x, n: Number(x.n) })),
    drops: { n: Number(drops[0]?.n ?? 0), medianPct: drops[0]?.median_pct != null ? Number(drops[0].median_pct) : null },
    biggest,
  };
}
