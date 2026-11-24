import { getT } from "@/i18n/server";
import { HOME_CATEGORIES, HOME_CAT_MIN } from "@/lib/constants";
import { katIcon } from "@/lib/illustrations";
import { homeCategoryCounts } from "@/lib/search";

/** Sākumlapas rinda „Ko meklē?”: galvenās kategorijas ar skaitu; ved uz SEO lapām. */
export async function HomeCategories() {
  const { t, lp } = await getT();
  const counts = await homeCategoryCounts().catch(() => ({}) as Record<string, number>);
  const items = HOME_CATEGORIES.filter((c) => (counts[c.key] ?? 0) >= HOME_CAT_MIN);
  if (!items.length) return null;
  const fmt = new Intl.NumberFormat("lv-LV");
  return (
    <section className="kat" aria-label={t("Ko meklē?")}>
      <p className="kat-h">{t("Ko meklē?")}</p>
      <div className="kat-row">
        {items.map((c) => (
          <a key={c.key} className={`kat-card ${c.group === "vehicle" ? "v" : "p"}`} href={c.href.startsWith("/?") ? c.href : lp(c.href)}>
            <span className="kat-ico" dangerouslySetInnerHTML={{ __html: katIcon(c.key) }} />
            <b>{t(c.label)}</b>
            <span className="n">{fmt.format(counts[c.key] ?? 0)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
