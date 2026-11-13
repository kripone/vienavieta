// Dati un metodoloģija: avoti (dzīvs skaits) un aprēķinu skaidrojums (src/content/data-method.ts).
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { DATA_METHOD } from "@/content/data-method";
import { SOURCE_LABEL } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { langAlternates } from "@/lib/seo";
import { cached } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getT();
  const d = DATA_METHOD[locale];
  return { title: d.title, description: d.description, alternates: langAlternates("/dati", locale) };
}

/** Aktīvie sludinājumi pa avotiem un veidiem. */
const sourceTable = () =>
  cached("dati:sources", async () => {
    const r = await db.execute<{ source: string; vehicles: number; property: number }>(sql`
      select source, count(*) filter (where kind = 'vehicle')::int vehicles, count(*) filter (where kind = 'property')::int property
      from listings where status = 'active' group by source order by count(*) desc`);
    return r.rows.map((x) => ({ ...x, vehicles: Number(x.vehicles), property: Number(x.property) }));
  });

export default async function DataPage() {
  const { locale, lp } = await getT();
  const d = DATA_METHOD[locale];
  const rows = await sourceTable().catch(() => []);
  return (
    <main className="wrap legal">
      <h1>{d.title}</h1>
      <p className="lead">{d.intro}</p>
      <section id="avoti">
        <h2>{d.sourcesH}</h2>
        <p>{d.sourcesNote}</p>
        {rows.length > 0 && (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{d.colSource}</th><th>{d.colVehicles}</th><th>{d.colProperty}</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.source}><td>{SOURCE_LABEL[r.source] ?? r.source}</td><td>{r.vehicles ? formatNumber(r.vehicles) : "—"}</td><td>{r.property ? formatNumber(r.property) : "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {d.sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        </section>
      ))}
      <section>
        <h2>{d.citeH}</h2>
        <p>{d.cite}</p>
        <p><a href={lp("/parskati")}>→ /parskati</a> · <a href={lp("/cenu-karte")}>→ /cenu-karte</a> · <a href={lp("/darijumi")}>→ /darijumi</a></p>
      </section>
    </main>
  );
}
