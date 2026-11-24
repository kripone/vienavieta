import { getT } from "@/i18n/server";
import { todayStats } from "@/lib/search";

/** Sānu kolonnas bloks „Šodien tirgū” (sākumlapā). */
export async function TodayStats() {
  const { t, lp } = await getT();
  const s = await todayStats().catch(() => null);
  if (!s) return null;
  const fmt = new Intl.NumberFormat("lv-LV");
  return (
    <section className="today">
      <p className="today-h">{t("Šodien tirgū")}</p>
      <a href={lp("/")}><span>{t("Jauni sludinājumi")}</span><b>{fmt.format(s.fresh)}</b></a>
      <a href={lp("/cenu-kritumi")}><span>{t("Cenu kritumi")}</span><b>{fmt.format(s.drops)}</b></a>
      {s.rigaM2 != null && <a href={lp("/cenu-karte")}><span>{t("Dzīvokļi Rīgā, mediāna")}</span><b>{fmt.format(s.rigaM2)} €/m²</b></a>}
      <p className="fine">{t("Pēdējās 24 stundās")}</p>
    </section>
  );
}
