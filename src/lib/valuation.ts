// Rīks „Cik vērts?” (/novertejums): aptuvena cena no aktīvajiem sludinājumiem (visi avoti, dublikāti vienreiz)
// un dzīvokļiem arī no VZD reālajiem darījumiem tajā pašā mājā. Tikai orientējošs novērtējums.
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { dealsByAddress } from "./vzd";

const primary = sql.raw(`(l.group_key is null or not exists (select 1 from listings g where g.group_key = l.group_key and g.status = 'active' and g.id <> l.id and (g.source = 'own' and l.source <> 'own' or (g.source <> 'own' and l.source <> 'own' and g.created_at < l.created_at))))`);
type Stats = { n: number; median: number; p25: number; p75: number };
const stats = async (q: ReturnType<typeof sql>) => {
  const r = (await db.execute<{ n: string; median: number | null; p25: number | null; p75: number | null }>(q)).rows[0];
  return r && Number(r.n) > 0 && r.median != null ? ({ n: Number(r.n), median: r.median, p25: r.p25 ?? r.median, p75: r.p75 ?? r.median } as Stats) : null;
};

export type VehicleValue = Stats & { yearFrom: number; yearTo: number; kmFiltered: boolean };

/** Auto: tas pats modelis, gads ±1 (ja par maz, ±2, ±3); ja norādīts nobraukums un pietiek datu, līdzīgs nobraukums (±35%). */
export async function valueVehicle(modelId: number, year: number, km?: number | null): Promise<VehicleValue | null> {
  for (const span of [1, 2, 3]) {
    const base = sql`from listings l where l.status = 'active' and l.kind = 'vehicle' and l.model_id = ${modelId} and l.year between ${year - span} and ${year + span} and l.price > 300 and ${primary}`;
    const q = (extra: ReturnType<typeof sql>) => sql`select count(*) n,
      percentile_cont(0.5) within group (order by l.price)::int median,
      percentile_cont(0.25) within group (order by l.price)::int p25,
      percentile_cont(0.75) within group (order by l.price)::int p75 ${base} ${extra}`;
    if (km && km > 0) {
      const s = await stats(q(sql`and l.mileage_km between ${Math.round(km * 0.65)} and ${Math.round(km * 1.35)}`));
      if (s && s.n >= 5) return { ...s, yearFrom: year - span, yearTo: year + span, kmFiltered: true };
    }
    const s = await stats(q(sql``));
    if (s && s.n >= 5) return { ...s, yearFrom: year - span, yearTo: year + span, kmFiltered: false };
  }
  return null;
}

export type FlatValue = {
  asking: (Stats & { scope: "place" | "region"; name: string }) | null;
  deals: { address: string; median: number; n: number; recent: boolean } | null;
};

/** Dzīvoklis: pārdošanas sludinājumu €/m² tajā pašā vietā (vai novadā/pilsētā), līdzīga platība (±40%); un VZD darījumi mājā. */
export async function valueFlat(placeId: number, area: number, rooms?: number | null, address?: string | null): Promise<FlatValue> {
  const run = async (where: ReturnType<typeof sql>, withRooms: boolean) =>
    stats(sql`select count(*) n,
      percentile_cont(0.5) within group (order by l.price / l.area_m2)::int median,
      percentile_cont(0.25) within group (order by l.price / l.area_m2)::int p25,
      percentile_cont(0.75) within group (order by l.price / l.area_m2)::int p75
      from listings l join places p on p.id = l.place_id
      where l.status = 'active' and l.kind = 'property' and l.property_type = 'Dzīvoklis' and l.deal = 'sell' and l.area_m2 > 0 and l.price > 1000
        and l.area_m2 between ${Math.floor(area * 0.6)} and ${Math.ceil(area * 1.4)} ${withRooms && rooms ? sql`and l.rooms = ${rooms}` : sql``}
        and ${where} and ${primary}`);
  const names = (await db.execute<{ place: string; region: string; region_id: number }>(sql`select p.name place, r.name region, r.id region_id from places p join regions r on r.id = p.region_id where p.id = ${placeId}`)).rows[0];
  let asking: FlatValue["asking"] = null;
  if (names) {
    const inPlace = sql`(l.place_id = ${placeId} or l.place_id in (select id from places where parent_id = ${placeId}))`;
    const inRegion = sql`p.region_id = ${names.region_id}`;
    for (const [where, scope, withRooms] of [[inPlace, "place", true], [inPlace, "place", false], [inRegion, "region", true], [inRegion, "region", false]] as const) {
      const s = await run(where, withRooms);
      if (s && s.n >= 5) { asking = { ...s, scope, name: scope === "place" ? names.place : names.region }; break; }
    }
  }
  let deals: FlatValue["deals"] = null;
  if (address && /\d/.test(address)) {
    const city = names?.region && !address.includes(",") ? `${address}, ${names.region}` : address;
    const res = await dealsByAddress(city).catch(() => null);
    const h = res?.houses[0];
    if (h?.median) deals = { address: h.address, median: h.median, n: h.medianN, recent: h.medianRecent };
  }
  return { asking, deals };
}
