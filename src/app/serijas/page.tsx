// Dzīvokļu māju sērijas: ko nozīmē katra ss.com kategorija + skaitļi no mūsu sludinājumiem (src/content/series.ts, src/lib/series-stats.ts).
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { INTL_LOCALE } from "@/i18n/core";
import { formatNumber } from "@/lib/format";
import { langAlternates } from "@/lib/seo";
import { SERIES_GROUPS } from "@/lib/constants";
import { SERIES_DOC, seriesAnchor } from "@/content/series";
import { seriesStats } from "@/lib/series-stats";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getT();
  const d = SERIES_DOC[locale];
  return { title: d.title, description: d.description, alternates: langAlternates("/serijas", locale) };
}

export default async function SeriesPage() {
  const { t, lp, locale } = await getT();
  const d = SERIES_DOC[locale];
  const stats = await seriesStats().catch(() => ({}) as Awaited<ReturnType<typeof seriesStats>>);
  const href = (s: string) => lp(`/?cat=property&ptype=${encodeURIComponent("Dzīvoklis")}&deal=sell&series=${encodeURIComponent(s)}`);
  const priced = Object.entries(stats).filter(([, x]) => x.m2 != null && x.n >= 5).sort((a, b) => b[1].m2! - a[1].m2!);
  const total = Object.values(stats).reduce((s, x) => s + x.n, 0);

  return (
    <main className="wrap series-page">
      <h1>{d.title}</h1>
      <p className="lead">{d.intro}</p>
      {priced.length > 1 && (
        <p className="facts">
          <time dateTime={new Date().toISOString().slice(0, 10)}>{new Date().toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Riga" })}</time>
          {": "}
          {d.facts.replace("{n}", formatNumber(total)).replace("{a}", t(priced[0][0])).replace("{x}", formatNumber(priced[0][1].m2!)).replace("{b}", t(priced.at(-1)![0])).replace("{y}", formatNumber(priced.at(-1)![1].m2!))}{" "}
          <a href={lp("/dati")}>{t("Kā skaitām")}</a>
        </p>
      )}

      <div className="table-scroll">
        <table className="pm-table">
          <thead><tr><th>{d.colSeries}</th><th>{d.colEra}</th><th>{d.colFloors}</th><th>{d.colM2}</th><th>{d.colN}</th></tr></thead>
          <tbody>
            {(Object.keys(SERIES_GROUPS) as (keyof typeof SERIES_GROUPS)[]).flatMap((g) => [
              <tr key={g} className="series-group"><th colSpan={5}>{d.groups[g]}</th></tr>,
              ...SERIES_GROUPS[g].map((s) => {
                const x = stats[s];
                return (
                  <tr key={s}>
                    <td><a href={`#${seriesAnchor(s)}`}>{t(s)}</a></td>
                    <td>{d.items[s].era}</td>
                    <td>{x?.floors ?? "–"}</td>
                    <td>{x?.m2 != null && x.n >= 5 ? formatNumber(x.m2) : "–"}</td>
                    <td>{x?.n ? <a href={href(s)}>{formatNumber(x.n)}</a> : "–"}</td>
                  </tr>
                );
              }),
            ])}
          </tbody>
        </table>
      </div>
      <p className="fine">{d.statsNote}</p>

      <section className="series-tip">
        <h2>{d.tipH}</h2>
        <p>{d.tip}</p>
      </section>

      {(Object.keys(SERIES_GROUPS) as (keyof typeof SERIES_GROUPS)[]).map((g) => (
        <section key={g}>
          <h2>{d.groups[g]}</h2>
          {SERIES_GROUPS[g].map((s) => (
            <article key={s} id={seriesAnchor(s)} className="series-item">
              <h3>{t(s)} <small>· {d.items[s].era}</small></h3>
              <p>{d.items[s].text}</p>
              {stats[s]?.n ? <a href={href(s)}>{d.more} ({formatNumber(stats[s].n)}) →</a> : null}
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
