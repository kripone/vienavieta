import { getT } from "@/i18n/server";
import { formatNumber, formatPrice } from "@/lib/format";
import type { MarketOverview as MO } from "@/lib/search";

/** SEO lapu bloks „Tirgus šobrīd”: īss, no aktīvajiem sludinājumiem ģenerēts teksts un tabula (katrai lapai savs saturs). */
export async function MarketOverview({ mo, title }: { mo: MO; title: string }) {
  const { t } = await getT();
  const sqmTxt = (x: number) => `${formatNumber(x)} €/m²`;
  return (
    <section className="market-ov">
      <h2>{t("Tirgus šobrīd: {x}", { x: title })}</h2>
      {mo.kind === "vehicle" ? (
        <>
          <p>
            {mo.year != null && mo.km != null && t("Tipiskais sludinājums ir {y}. gada auto ar aptuveni {km} km nobraukumu.", { y: mo.year, km: formatNumber(mo.km) })}{" "}
            {mo.autoPct != null && t("{p}% piedāvājuma ir ar automātisko ātrumkārbu.", { p: mo.autoPct })}{" "}
            {mo.fuel && t("Biežākā degviela: {f} ({p}%).", { f: t(mo.fuel.name).toLowerCase(), p: mo.fuel.pct })}
          </p>
          {mo.top.length > 0 && (
            <table className="mo-table">
              <thead>
                <tr><th>{t(mo.topBy === "make" ? "Marka" : "Modelis")}</th><th>{t("Sludinājumi")}</th><th>{t("Cenas mediāna")}</th></tr>
              </thead>
              <tbody>
                {mo.top.map((r) => <tr key={r.name}><td>{r.name}</td><td>{formatNumber(r.n)}</td><td>{r.median != null ? formatPrice(r.median) : "–"}</td></tr>)}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <>
          {mo.rooms.length > 0 && (
            <table className="mo-table">
              <thead>
                <tr><th>{t("Istabas")}</th><th>{t("Sludinājumi")}</th><th>{t("Cenas mediāna")}</th><th>{t("€/m² mediāna")}</th></tr>
              </thead>
              <tbody>
                {mo.rooms.map((r) => <tr key={r.rooms}><td>{r.rooms}</td><td>{formatNumber(r.n)}</td><td>{r.median != null ? formatPrice(r.median) : "–"}</td><td>{r.sqm != null ? sqmTxt(r.sqm) : "–"}</td></tr>)}
              </tbody>
            </table>
          )}
          {mo.cheap.length > 0 && (
            <p>
              {t("Lētākais kvadrātmetrs: {list}.", { list: mo.cheap.map((x) => `${x.name} (${sqmTxt(x.sqm)})`).join(", ") })}{" "}
              {t("Dārgākais: {list}.", { list: mo.dear.map((x) => `${x.name} (${sqmTxt(x.sqm)})`).join(", ") })}
            </p>
          )}
        </>
      )}
      <p className="fine">{t("Aprēķināts no aktīvajiem sludinājumiem, dublikāti skaitīti vienreiz; atjaunojas automātiski.")}</p>
    </section>
  );
}
