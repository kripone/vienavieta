// /serijas: cik dzīvokļu pārdošanā katrā sērijā, €/m² mediāna un biežākais stāvu skaits (aktīvie sludinājumi LV, dublikāti vienreiz).
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { cached } from "@/lib/search";
import { normalizeSeries, SERIES } from "@/lib/constants";
import { groupPrimaryAs } from "./dedupe";

const primary = groupPrimaryAs("l");

export type SeriesStat = { n: number; m2: number | null; floors: number | null };

export function seriesStats(): Promise<Record<string, SeriesStat>> {
  return cached("series-stats", async () => {
    const r = await db.execute<{ series: string; n: string; m2: string | null; floors: number | null }>(sql`
      select l.series, count(*) n,
        (percentile_cont(0.5) within group (order by l.price / l.area_m2) filter (where l.area_m2 > 10 and l.price > 1000))::int m2,
        mode() within group (order by l.floors) filter (where l.floors between 1 and 40) floors
      from listings l
      where l.status = 'active' and l.kind = 'property' and l.property_type = 'Dzīvoklis' and l.deal = 'sell' and l.series is not null and ${primary}
      group by l.series`);
    return Object.fromEntries(r.rows.map((x) => [x.series, { n: Number(x.n), m2: x.m2 == null ? null : Number(x.m2), floors: x.floors == null ? null : Number(x.floors) }]));
  });
}

/** Startā: vecie ieraksti ar portālu saīsinājumiem ("Jaun.", "P. kara", "lietuviešu pr.") → mūsu `SERIES` (lai filtrs tos atrod). */
export async function normalizeStoredSeries() {
  const r = await db.execute<{ series: string }>(sql`select distinct series from listings where series is not null and series not in (${sql.join(SERIES.map((x) => sql`${x}`), sql`, `)})`);
  let n = 0;
  for (const { series } of r.rows) {
    const to = normalizeSeries(series);
    if (!to) continue;
    const u = await db.execute(sql`update listings set series = ${to} where series = ${series}`);
    n += u.rowCount ?? 0;
  }
  if (n) console.log(`[series] normalizētas ${n} sērijas vērtības`);
}
