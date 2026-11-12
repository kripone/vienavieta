// Dzīvokļu cenu karte (/cenu-karte): €/m² mediāna pa apkaimēm, pilsētām un pagastiem no aktīvajiem sludinājumiem.
// Viens objekts vairākos portālos skaitās vienreiz; vietas ar mazāk nekā PRICE_MAP_MIN sludinājumiem nerādām.
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const PRICE_MAP_MIN = 5;
export type PriceMapDeal = "sell" | "rent";
export type PriceMapPlace = { id: number; name: string; region: string; lat: number; lon: number; n: number; median: number; level: number };

const primary = sql.raw(`(l.group_key is null or not exists (select 1 from listings g where g.group_key = l.group_key and g.status = 'active' and g.id <> l.id and (g.source = 'own' and l.source <> 'own' or (g.source <> 'own' and l.source <> 'own' and g.created_at < l.created_at))))`);

/** Robežas 5 krāsu pakāpēm: kvintiles, noapaļotas (pārdošanai līdz 50 €, īrei līdz 0,5 €). */
function breaks(values: number[], step: number) {
  const s = [...values].sort((a, b) => a - b);
  const q = (p: number) => Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] / step) * step;
  return [...new Set([q(0.2), q(0.4), q(0.6), q(0.8)])];
}

export async function flatPriceMap(deal: PriceMapDeal) {
  const r = await db.execute<{ id: number; name: string; region: string; lat: number; lon: number; n: string; median: string }>(sql`
    select p.id, p.name, r.name region, p.lat, p.lon, count(*) n,
      (percentile_cont(0.5) within group (order by l.price / l.area_m2))::numeric(8,1) median
    from listings l join places p on p.id = l.place_id join regions r on r.id = p.region_id
    where l.status = 'active' and l.property_type = 'Dzīvoklis' and l.deal = ${deal} and l.area_m2 > 10
      and l.price > ${deal === "sell" ? 1000 : 50} and r.country = 'LV' and ${primary}
    group by p.id, p.name, r.name, p.lat, p.lon having count(*) >= ${PRICE_MAP_MIN}`);
  const round = (v: number) => (deal === "sell" ? Math.round(v) : Math.round(v * 10) / 10);
  const raw = r.rows.map((x) => ({ id: x.id, name: x.name, region: x.region, lat: Number(x.lat), lon: Number(x.lon), n: Number(x.n), median: round(Number(x.median)) }));
  const br = raw.length >= 5 ? breaks(raw.map((x) => x.median), deal === "sell" ? 50 : 0.5) : [];
  const places: PriceMapPlace[] = raw.map((x) => ({ ...x, level: br.filter((b) => x.median >= b).length })).sort((a, b) => b.median - a.median);
  return { places, breaks: br, total: places.reduce((s, x) => s + x.n, 0) };
}
