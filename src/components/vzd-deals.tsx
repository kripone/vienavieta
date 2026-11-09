import { getT } from "@/i18n/server";
import { formatNumber, formatPrice } from "@/lib/format";
import type { VzdDeal } from "@/lib/vzd";
import { INTL_LOCALE, type Locale } from "@/i18n/core";

const fmtDay = (d: string, loc: Locale) => new Date(d + "T12:00:00Z").toLocaleDateString(INTL_LOCALE[loc], { month: "short", year: "numeric", timeZone: "Europe/Riga" });

/** Reālie darījumi no VZD (tā pati māja + apkārtne) salīdzinājumā ar sludinājuma €/m². */
export async function VzdDeals({ data, perM2 }: { data: { same: VzdDeal[]; median: number | null; medianN: number; medianRecent: boolean; area: { n: number; median: number | null } | null }; perM2: number | null }) {
  const { t, locale } = await getT();
  const cmp = (m: number | null) => {
    if (!m || !perM2) return null;
    const pct = Math.round(((perM2 - m) / m) * 100);
    return pct === 0 ? t("tikpat") : pct > 0 ? t("{p}% dārgāk", { p: Math.abs(pct) }) : t("{p}% lētāk", { p: Math.abs(pct) });
  };
  const SHOW = 5;
  const rows = data.same.slice(0, 15);
  const hero = (median: number, label: string) => (
    <div className="vzd-hero">
      <div className="vzd-hero-top">
        <b>{formatNumber(median)} €/m²</b>
        {cmp(median) && <span className="vzd-pill">{t("sludinājums")} {cmp(median)}</span>}
      </div>
      <span className="fine">{label}</span>
    </div>
  );
  return (
    <section className="vzd" id="vzd">
      <h2>{t("Reālās darījumu cenas")}</h2>
      <div className="vzd-box">
        {data.median != null && hero(data.median, `${data.medianRecent ? t("šajā mājā 3 gados") : t("šajā mājā kopš 2016")} (${data.medianN})`)}
        {data.area?.median != null && hero(data.area.median, `${t("~400 m apkārtnē, 2 gados")} (${data.area.n})`)}
        {rows.length > 0 && (
          <table className="tbl vzd-tbl">
            <thead>
              <tr><th>{t("Datums")}</th><th>{t("Dzīvoklis")}</th><th>{t("Cena")}</th><th>€/m²</th></tr>
            </thead>
            <tbody>
              {rows.map((d, i) => (
                <tr key={i} className={i >= SHOW ? "vzd-more-row" : undefined}>
                  <td>{fmtDay(d.day, locale)}</td>
                  <td>
                    {formatNumber(Number(d.areaM2))} m²
                    <small>{[d.rooms != null ? t("{n} ist.", { n: d.rooms }) : null, d.floor != null ? `${d.floor}${d.floors ? "/" + d.floors : ""} ${t("st.")}` : null].filter(Boolean).join(" · ")}</small>
                  </td>
                  <td>{formatPrice(d.amount)}</td>
                  <td>{formatNumber(Math.round(d.amount / Number(d.areaM2)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length > SHOW && (
          <details className="vzd-all">
            <summary className="more-btn">{t("Rādīt visus {n} darījumus", { n: rows.length })}</summary>
          </details>
        )}
        <p className="fine">
          Dati: Valsts zemes dienests, NĪTIS (<a href="https://data.gov.lv/dati/lv/dataset/darijumi-ar-telpu-grupam" rel="noopener noreferrer">{t("data.gov.lv")}</a>, CC BY 4.0), dzīvokļu pirkuma darījumi kopš 2016. gada. Zemesgrāmatā reģistrētā summa var atšķirties no tirgus vērtības.
        </p>
      </div>
    </section>
  );
}
