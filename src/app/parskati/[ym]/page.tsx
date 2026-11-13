// Ikmēneša tirgus pārskats (src/lib/report.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { INTL_LOCALE } from "@/i18n/core";
import { BarList } from "@/components/charts";
import { formatNumber, formatPrice } from "@/lib/format";
import { langAlternates, regionName } from "@/lib/seo";
import { trTitle } from "@/i18n/content";
import { MONTH_RE, monthRange, monthReport, reportMonths } from "@/lib/report";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ ym: string }> };

const monthName = (ym: string, locale: keyof typeof INTL_LOCALE) =>
  new Date(`${ym}-15T12:00:00Z`).toLocaleDateString(INTL_LOCALE[locale], { month: "long", year: "numeric", timeZone: "Europe/Riga" });

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { ym } = await props.params;
  const { t, locale } = await getT();
  if (!MONTH_RE.test(ym)) return {};
  const m = monthName(ym, locale);
  return {
    title: t("Tirgus pārskats: {m}", { m }),
    description: t("Dzīvokļu cenas Rīgā un Latvijā, populārākie lietotie auto un cenu kritumi: {m}.", { m }),
    alternates: langAlternates(`/parskati/${ym}`, locale),
  };
}

export default async function ReportPage(props: Props) {
  const { ym } = await props.params;
  if (!MONTH_RE.test(ym)) notFound();
  const { t, tp, lp, locale } = await getT();
  const months = (await reportMonths().catch(() => [])).filter((m) => m.n >= 500);
  if (!months.some((m) => m.ym === ym)) notFound();
  const r = await monthReport(ym);
  const { to } = monthRange(ym);
  const ongoing = to.getTime() > Date.now();
  const idx = months.findIndex((m) => m.ym === ym);
  const newer = months[idx - 1]?.ym, older = months[idx + 1]?.ym;
  const m = monthName(ym, locale);

  return (
    <main className="wrap report">
      <h1>{t("Tirgus pārskats: {m}", { m })}</h1>
      <p className="lead">
        {t("Automātisks kopsavilkums no visiem tajā mēnesī pieejamajiem sludinājumiem (VienāVietā un ss.com); viens objekts vairākos portālos skaitās vienreiz.")}
        {ongoing ? ` ${t("Mēnesis vēl turpinās, skaitļi mainās katru dienu.")}` : ""}
      </p>
      {(() => {
        // galvenie skaitļi vienā teikumā: meklētāji un AI asistenti to var citēt
        const riga = r.flatRegions.find((x) => x.region === "Rīga");
        const top = r.rigaFlats[0], low = r.rigaFlats[r.rigaFlats.length - 1];
        const car = r.carModels[0];
        const parts = [t("{m}: {v} transporta un {p} īpašumu sludinājumi.", { m, v: formatNumber(r.vehicles), p: formatNumber(r.property) })];
        if (riga) parts.push(t("Dzīvokļa kvadrātmetra cenas mediāna Rīgā {x} €/m².", { x: formatNumber(riga.median) }));
        if (top && low && top !== low) parts.push(t("Dārgākā apkaime {a} ({x} €/m²), lētākā {b} ({y} €/m²).", { a: top.place, x: formatNumber(top.median), b: low.place, y: formatNumber(low.median) }));
        if (car) parts.push(t("Populārākais lietotais auto: {c} ({n} sludinājumi, mediānas cena {p}).", { c: `${car.make} ${trTitle(car.model, t)}`, n: formatNumber(car.n), p: formatPrice(car.median) }));
        return <p className="facts">{parts.join(" ")} <a href={lp("/dati")}>{t("Kā skaitām")}</a></p>;
      })()}
      <nav className="report-nav">
        {older ? <a className="btn small" href={lp(`/parskati/${older}`)}>← {monthName(older, locale)}</a> : <span />}
        {newer && <a className="btn small" href={lp(`/parskati/${newer}`)}>{monthName(newer, locale)} →</a>}
      </nav>

      <div className="stat-row">
        <div className="stat"><b>{formatNumber(r.vehicles)}</b><span>{t("transporta sludinājumi")}</span></div>
        <div className="stat"><b>{formatNumber(r.property)}</b><span>{t("īpašumu sludinājumi")}</span></div>
        <div className="stat"><b>{formatNumber(r.drops.n)}</b><span>{t("cenu samazinājumi")}{r.drops.medianPct != null ? ` · ${t("vidēji −{p}%", { p: String(r.drops.medianPct).replace(".", ",") })}` : ""}</span></div>
      </div>

      <div className="market-grid">
        <BarList
          title={t("Dzīvokļu cena par m² Rīgā pa apkaimēm")}
          data={r.rigaFlats.slice(0, 25).map((x) => ({ label: x.place, value: x.median, n: x.n }))}
          unit="€/m²"
          color="var(--home)"
        />
        <section>
          <h2>{t("Dzīvokļi pa pilsētām un novadiem")}</h2>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{t("Vieta")}</th><th>{t("Pārdod, €/m²")}</th><th>{t("Īre, €/mēn.")}</th><th>{t("Sludinājumi")}</th></tr></thead>
              <tbody>
                {r.flatRegions.map((x) => (
                  <tr key={x.region}><td>{regionName(x.region, locale)}</td><td>{formatNumber(x.median)}</td><td>{x.rent ? formatNumber(x.rent) : "—"}</td><td>{formatNumber(x.n)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section>
        <h2>{t("Populārākie lietotie auto")}</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t("Modelis")}</th><th>{t("Sludinājumi")}</th><th>{t("Mediānas cena")}</th><th>{t("Tipiskais gads")}</th></tr></thead>
            <tbody>
              {r.carModels.map((x) => (
                <tr key={`${x.make}${x.model}`}><td>{x.make} {trTitle(x.model, t)}</td><td>{formatNumber(x.n)}</td><td>{formatPrice(x.median)}</td><td>{x.year ?? "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {r.biggest.length > 0 && (
        <section>
          <h2>{t("Lielākie cenu kritumi mēnesī")}</h2>
          <ul className="report-drops">
            {r.biggest.map((x) => (
              <li key={x.id}>
                <a href={lp(`/sludinajumi/${x.id}`)}>{trTitle(x.title, t)}</a>{" "}
                <span className="down">{formatPrice(x.first)} → {formatPrice(x.price)} (−{Math.round(((x.first - x.price) / x.first) * 100)}%)</span>
              </li>
            ))}
          </ul>
          <a className="btn small" href={lp("/cenu-kritumi")}>{t("Visi cenu kritumi")} →</a>
        </section>
      )}

      <p className="fine">
        {t("Cenas ir sludinājumu cenas, nevis darījumu cenas. Reālās dzīvokļu darījumu cenas pēc adreses:")} <a href={lp("/darijumi")}>{t("Darījumu cenas")}</a>. {t("Sava auto vai dzīvokļa aptuveno cenu vari uzzināt šeit:")} <a href={lp("/novertejums")}>{t("Cik vērts?")}</a>
      </p>
      <p className="fine">{tp(months.length, "pieejams pārskats", "pieejami pārskati")}: {months.map((x, i) => (<span key={x.ym}>{i ? ", " : ""}<a href={lp(`/parskati/${x.ym}`)}>{monthName(x.ym, locale)}</a></span>))}</p>
    </main>
  );
}
