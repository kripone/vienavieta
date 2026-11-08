import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { langAlternates } from "@/lib/seo";
import { dealsByAddress } from "@/lib/vzd";
import { formatNumber, formatPrice } from "@/lib/format";
import { INTL_LOCALE, type Locale } from "@/i18n/core";

export async function generateMetadata(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { t, locale } = await getT();
  const filtered = Object.keys(await props.searchParams).length > 0;
  return { alternates: langAlternates("/darijumi", locale), robots: filtered ? { index: false, follow: true } : undefined, title: t("Dzīvokļu darījumu cenas"), description: t("Par cik dzīvokļi patiešām pārdoti konkrētā mājā: Valsts zemes dienesta darījumu dati kopš 2016. gada.") };
}
export const dynamic = "force-dynamic";

const fmtDay = (d: string, loc: Locale) => new Date(d + "T12:00:00Z").toLocaleDateString(INTL_LOCALE[loc], { month: "short", year: "numeric", timeZone: "Europe/Riga" });

/** "Kalna iela 13A, Rīga" → "Kalna" (meklēšanai sludinājumu adresēs, kur ielas tips nav rakstīts) */
const streetOf = (address: string) => address.split(",")[0].replace(/\s+\d.*$/, "").replace(/\s+(iela|gatve|prospekts|bulvāris|šoseja|laukums|aleja|dambis|krastmala|ceļš)$/i, "").trim() || null;

export default async function DealsPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { t, tp, locale } = await getT();
  const { q: raw } = await props.searchParams;
  const q = (raw ?? "").trim().slice(0, 120);
  const res = q ? await dealsByAddress(q).catch(() => ({ houses: [], suggestions: [] })) : null;
  return (
    <main className="wrap">
      <h1>{t("Dzīvokļu darījumu cenas")}</h1>
      <p className="lead">{t("Ieraksti mājas adresi, un redzēsi, par cik tajā patiešām pārdoti dzīvokļi. Dati ir no zemesgrāmatā reģistrētajiem pirkuma darījumiem kopš 2016. gada.")}</p>
      <form className="lookup" action="/darijumi">
        <input name="q" required defaultValue={q} placeholder={t("Piem. Kalna iela 13A, Rīga")} aria-label={t("Adrese")} />
        <button className="btn primary">{t("Meklēt")}</button>
      </form>
      {res && res.houses.length === 0 && (
        <div className="notice">
          {/\d/.test(q) ? t("Šai adresei darījumu nav atrasts.") : t("Ieraksti ielu kopā ar mājas numuru, piem. „Brīvības iela 100”.")}
          {res.suggestions.length > 0 && (
            <>
              <p>{t("Varbūt domāji:")}</p>
              <ul className="sugg">
                {res.suggestions.map((a) => (
                  <li key={a}><a className="btn small" href={`/darijumi?q=${encodeURIComponent(a)}`}>{a}</a></li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {res?.houses.map((h) => (
        <section key={h.address} className="house">
          <h2>{h.address}</h2>
          <p className="fine">
            {[h.builtYear ? t("Būvēta {y}", { y: h.builtYear }) : null, h.material && t(h.material)].filter(Boolean).join(" · ")}
          </p>
          <div className="stat-row">
            {h.median != null && (
              <div className="stat"><b>{formatNumber(h.median)} €/m²</b><span>{h.medianRecent ? t("vidēji pēdējos 3 gados") : t("vidēji kopš 2016")} ({h.medianN})</span></div>
            )}
            <div className="stat"><b>{tp(h.deals.length, "darījums", "darījumi")}</b><span>{t("kopš 2016")}</span></div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>{t("Datums")}</th><th>{t("Stāvs")}</th><th>{t("Istabas")}</th><th>{t("Platība")}</th><th>{t("Cena")}</th><th>€/m²</th></tr>
              </thead>
              <tbody>
                {h.deals.slice(0, 60).map((d, i) => (
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
          {streetOf(h.address) && (
            <p><a href={`/?cat=property&ptype=Dz%C4%ABvoklis&q=${encodeURIComponent(streetOf(h.address)!)}`}>{t("Pārdošanā esošie dzīvokļi: {s}", { s: streetOf(h.address) })} →</a></p>
          )}
        </section>
      ))}
      <p className="fine">
        Dati: Valsts zemes dienests, NĪTIS (<a href="https://data.gov.lv/dati/lv/dataset/darijumi-ar-telpu-grupam" rel="noopener noreferrer">{t("data.gov.lv")}</a>, CC BY 4.0). Tikai veseli dzīvokļi; atjaunots reizi mēnesī. Zemesgrāmatā reģistrētā summa var atšķirties no tirgus vērtības.
      </p>
    </main>
  );
}
