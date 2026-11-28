import { CAR_STRIP, HOME_STRIP, carIll, homeIll } from "@/lib/illustrations";
import { getT } from "@/i18n/server";
import { Ill } from "./ill";
import { bodySlug, getCatalog, vehicleHref } from "@/lib/seo";

/** Josla ar virsbūvēm (vieglie auto) vai īpašuma veidiem; klikšķis ieslēdz/izslēdz filtru. */
export async function TypeStrip({ mode, flat, counts }: { mode: "car" | "home"; flat: Record<string, string>; counts: Record<string, number> }) {
  const { t: tr, tp, lp } = await getT();
  // ja bez virsbūves ir tikai „visi auto” vai „marka”, virsbūves saite ved uz SEO lapu (/auto/hecbeks, /auto/bmw/universals),
  // nevis uz /?…&body= (tās ir noindex) – meklētāji atrod indeksējamās lapas
  const seoKeys = Object.keys(flat).filter((k) => !["page", "sort", "body"].includes(k));
  const seoBase = mode === "car" && flat.vc === "car" && seoKeys.every((k) => ["cat", "vc", "make"].includes(k))
    ? flat.make ? (await getCatalog().then((c) => c.makes.find((m) => String(m.id) === flat.make)?.name).catch(() => undefined)) ?? null : ""
    : null;
  const key = mode === "car" ? "body" : "ptype";
  const items = mode === "car" ? CAR_STRIP : HOME_STRIP;
  const active = flat[key];
  const href = (t: string) => {
    if (seoBase != null && active !== t) return lp(`${vehicleHref("car", seoBase || null)}/${bodySlug(t)}`);
    const p = new URLSearchParams(flat);
    p.delete("page");
    if (active === t) p.delete(key);
    else p.set(key, t);
    return `/?${p}`;
  };
  return (
    <section className="strip" aria-label={mode === "car" ? tr("Virsbūves tips") : tr("Īpašuma veids")}>
      <div className="strip-head">
        {/* nav virsraksts: šis bloks ir virs lapas h1, tāpēc tikai teksts (virsrakstu hierarhija) */}
        <p className="strip-h">{mode === "car" ? tr("Virsbūves tips") : tr("Īpašuma veids")}</p>
      </div>
      <div className="strip-row">
        {/* tukšas kategorijas nerādām (izņemot ieslēgto filtru) */}
        {items.filter((t) => (counts[t] ?? 0) > 0 || active === t).map((t) => (
          <a key={t} className="tcard" href={href(t)} rel={href(t).includes("?") ? "nofollow" : undefined} aria-current={active === t ? "true" : undefined}>
            <Ill svg={mode === "car" ? carIll(t) : homeIll(t)} />
            <b>{tr(t)}</b>
            <span className="n">{tp(counts[t] ?? 0, "sludinājums", "sludinājumi")}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
