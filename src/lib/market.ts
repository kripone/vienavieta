// Tirgus tendences: kopsavilkumi no aktīvajiem sludinājumiem (visi avoti) un dienas momentuzņēmumi (market_stats).
import { sql } from "drizzle-orm";
import { db } from "@/db";

type Row = Record<string, unknown>;
const rows = async <T extends Row>(q: ReturnType<typeof sql>) => (await db.execute<T>(q)).rows;

/** Viena dublikātu grupa skaitās vienreiz (savējais vai agrākais). */
const primary = sql.raw(`(l.group_key is null or not exists (select 1 from listings g where g.group_key = l.group_key and g.status = 'active' and g.id <> l.id and (g.source = 'own' and l.source <> 'own' or (g.source <> 'own' and l.source <> 'own' and g.created_at < l.created_at))))`);

/** Saglabā šodienas tirgus momentuzņēmumu (atkārtoti tajā pašā dienā pārraksta). */
export async function snapshotMarket(day = new Date()) {
  const d = day.toISOString().slice(0, 10);
  const vehicle = await db.execute(sql`
    insert into market_stats (day, segment, median, p25, p75, n)
    select ${d}::date, l.vehicle_class || ':' || l.make_id || ':' || l.model_id,
      percentile_cont(0.5) within group (order by l.price)::int,
      percentile_cont(0.25) within group (order by l.price)::int,
      percentile_cont(0.75) within group (order by l.price)::int, count(*)::int
    from listings l
    where l.status = 'active' and l.kind = 'vehicle' and l.make_id is not null and l.model_id is not null and l.price > 100 and ${primary}
    group by l.vehicle_class, l.make_id, l.model_id having count(*) >= 3
    on conflict (day, segment) do update set median = excluded.median, p25 = excluded.p25, p75 = excluded.p75, n = excluded.n`);
  const property = await db.execute(sql`
    insert into market_stats (day, segment, median, p25, p75, n)
    select ${d}::date, 'prop:' || l.property_type || ':' || p.region_id || ':' || coalesce(l.deal::text, 'sell'),
      percentile_cont(0.5) within group (order by l.price / u)::int,
      percentile_cont(0.25) within group (order by l.price / u)::int,
      percentile_cont(0.75) within group (order by l.price / u)::int, count(*)::int
    from (select l.*, (case when l.property_type = 'Zeme' then l.land_m2::numeric else l.area_m2 end) u from listings l
          where l.status = 'active' and l.kind = 'property' and ${primary}) l
    join places p on p.id = l.place_id
    where l.u > 0
    group by l.property_type, p.region_id, l.deal having count(*) >= 3
    on conflict (day, segment) do update set median = excluded.median, p25 = excluded.p25, p75 = excluded.p75, n = excluded.n`);
  return { day: d, vehicleSegments: vehicle.rowCount ?? 0, propertySegments: property.rowCount ?? 0 };
}

export async function marketTotals() {
  const r = await rows<{ kind: string; own: string; ext: string }>(sql`
    select kind, count(*) filter (where source = 'own') own, count(*) filter (where source <> 'own') ext
    from listings l where status = 'active' and ${primary} group by kind`);
  return Object.fromEntries(r.map((x) => [x.kind, { own: Number(x.own), ext: Number(x.ext) }])) as Record<string, { own: number; ext: number }>;
}

/** Populārākās markas ar sludinājumu skaitu un mediānas cenu. */
export async function topMakes(vehicleClass: string, limit = 15) {
  const r = await rows<{ id: number; name: string; n: string; median: number }>(sql`
    select m.id, m.name, count(*) n, percentile_cont(0.5) within group (order by l.price)::int median
    from listings l join makes m on m.id = l.make_id
    where l.status = 'active' and l.kind = 'vehicle' and l.vehicle_class = ${vehicleClass} and l.price > 100 and ${primary}
    group by m.id, m.name order by count(*) desc limit ${limit}`);
  return r.map((x) => ({ id: x.id, name: x.name, n: Number(x.n), median: x.median }));
}

export async function makesWithListings(vehicleClass: string) {
  const r = await rows<{ id: number; name: string; n: string }>(sql`
    select m.id, m.name, count(*) n from listings l join makes m on m.id = l.make_id
    where l.status = 'active' and l.kind = 'vehicle' and l.vehicle_class = ${vehicleClass} and ${primary}
    group by m.id, m.name having count(*) >= 3 order by m.name`);
  return r.map((x) => ({ id: x.id, name: x.name, n: Number(x.n) }));
}

export async function modelsWithListings(makeId: number) {
  const r = await rows<{ id: number; name: string; n: string; median: number }>(sql`
    select mo.id, mo.name, count(*) n, percentile_cont(0.5) within group (order by l.price)::int median from listings l join models mo on mo.id = l.model_id
    where l.status = 'active' and l.make_id = ${makeId} and ${primary}
    group by mo.id, mo.name having count(*) >= 3 order by count(*) desc`);
  return r.map((x) => ({ id: x.id, name: x.name, n: Number(x.n), median: x.median }));
}

/** Mediānas cena pa izlaiduma gadiem (gadi ar vismaz 2 sludinājumiem). */
export async function priceByYear(makeId: number, modelId: number) {
  const r = await rows<{ year: number; median: number; n: string }>(sql`
    select l.year, percentile_cont(0.5) within group (order by l.price)::int median, count(*) n
    from listings l
    where l.status = 'active' and l.make_id = ${makeId} and l.model_id = ${modelId} and l.year is not null and l.price > 100 and ${primary}
    group by l.year having count(*) >= 2 order by l.year`);
  return r.map((x) => ({ year: x.year, median: x.median, n: Number(x.n) }));
}

/** Cena pret nobraukumu (punkti; līdz 400). */
export async function priceVsMileage(makeId: number, modelId: number) {
  const r = await rows<{ id: string; price: number; km: number; year: number | null }>(sql`
    select l.id, l.price, l.mileage_km km, l.year from listings l
    where l.status = 'active' and l.make_id = ${makeId} and l.model_id = ${modelId} and l.mileage_km between 1 and 1500000 and l.price > 100 and ${primary}
    order by random() limit 400`);
  return r;
}

/** Segmenta mediāna laikā no momentuzņēmumiem. */
export async function segmentTrend(segment: string) {
  const r = await rows<{ day: string; median: number; p25: number; p75: number; n: number }>(sql`
    select to_char(m.day, 'YYYY-MM-DD') as "day", m.median, m.p25, m.p75, m.n from market_stats m where m.segment = ${segment} order by m.day`);
  return r;
}

/** Īpašuma cena par m² pa reģioniem (pašreizējā). */
export async function propertyByRegion(propertyType: string, deal: string) {
  const r = await rows<{ region_id: number; region: string; median: number; n: string }>(sql`
    select r.id region_id, r.name region, percentile_cont(0.5) within group (order by l.price / l.u)::int median, count(*) n
    from (select l.*, (case when l.property_type = 'Zeme' then l.land_m2::numeric else l.area_m2 end) u from listings l
          where l.status = 'active' and l.kind = 'property' and l.property_type = ${propertyType} and l.deal = ${deal}::deal_type and ${primary}) l
    join places p on p.id = l.place_id join regions r on r.id = p.region_id
    where l.u > 0 and r.country = 'LV'
    group by r.id, r.name having count(*) >= 5 order by median desc`);
  return r.map((x) => ({ regionId: x.region_id, region: x.region, median: x.median, n: Number(x.n) }));
}

/** Rīgas (vai cita reģiona) apkaimes: cena par m². */
export async function propertyByPlace(regionId: number, propertyType: string, deal: string) {
  const r = await rows<{ place: string; median: number; n: string }>(sql`
    select p.name place, percentile_cont(0.5) within group (order by l.price / l.u)::int median, count(*) n
    from (select l.*, (case when l.property_type = 'Zeme' then l.land_m2::numeric else l.area_m2 end) u from listings l
          where l.status = 'active' and l.kind = 'property' and l.property_type = ${propertyType} and l.deal = ${deal}::deal_type and ${primary}) l
    join places p on p.id = l.place_id
    where l.u > 0 and p.region_id = ${regionId}
    group by p.name having count(*) >= 3 order by median desc`);
  return r.map((x) => ({ place: x.place, median: x.median, n: Number(x.n) }));
}


/** Ja šodien momentuzņēmuma vēl nav, to izveido (izsauc fona plānotājs un stundas kārta). */
export async function ensureDailySnapshot() {
  const today = new Date().toISOString().slice(0, 10);
  const r = await rows<{ has: boolean }>(sql`select exists (select 1 from market_stats where day = ${today}::date) has`);
  if (r[0]?.has) return null;
  return snapshotMarket();
}
