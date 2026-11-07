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
  return (
    <section className="vzd" id="vzd">
      <h2>{t("Reālās darījumu cenas")}</h2>
      <div className="stat-row">
        {data.median != null && (
          <div className="stat">
            <b>{formatNumber(data.median)} €/m²</b>
            <span>{data.medianRecent ? t("šajā mājā 3 gados") : t("šajā mājā kopš 2016")} ({data.medianN}){cmp(data.median) ? ` · ${t("sludinājums")} ${cmp(data.median)}` : ""}</span>
          </div>
        )}
        {data.area?.median != null && (
          <div className="stat">
            <b>{formatNumber(data.area.median)} €/m²</b>
            <span>{t("~400 m apkārtnē, 2 gados")} ({data.area.n}){cmp(data.area.median) ? ` · ${t("sludinājums")} ${cmp(data.area.median)}` : ""}</span>
          </div>
        )}
      </div>
      {data.same.length > 0 && (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>{t("Datums")}</th><th>{t("Stāvs")}</th><th>{t("Istabas")}</th><th>{t("Platība")}</th><th>{t("Cena")}</th><th>€/m²</th></tr>
            </thead>
            <tbody>
              {data.same.slice(0, 15).map((d, i) => (
                <tr key={i}>
                  <td>{fmtDay(d.day, locale)}</td>
                  <td>{d.floor != null ? `${d.floor}${d.floors ? "/" + d.floors : ""}` : "—"}</td>
                  <td>{d.rooms ?? "—"}</td>
                  <td>{Number(d.areaM2)} m²</td>
                  <td>{formatPrice(d.amount)}</td>
                  <td>{formatNumber(Math.round(d.amount / Number(d.areaM2)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="fine">
        Dati: Valsts zemes dienests, NĪTIS (<a href="https://data.gov.lv/dati/lv/dataset/darijumi-ar-telpu-grupam" target="_blank" rel="noopener noreferrer">{t("data.gov.lv")}</a>, CC BY 4.0), dzīvokļu pirkuma darījumi kopš 2016. gada. Zemesgrāmatā reģistrētā summa var atšķirties no tirgus vērtības.
      </p>
    </section>
  );
}
