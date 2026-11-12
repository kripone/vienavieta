import { getT } from "@/i18n/server";
import { JsonLd } from "./json-ld";
import { Suspense } from "react";
import { FiltersBox } from "./filters-box";
import { ListingCard } from "./listing-card";
import { SaveSearchButton } from "./save-search-button";
import { SearchFilters } from "./search-filters";
import { SearchMapLazy } from "./search-map-lazy";
import { SortSelect } from "./sort-select";
import { SmartSearch } from "./smart-search";
import { PriceInsights } from "./price-insights";
import { TypeStrip } from "./type-strip";
import { VEHICLE_CLASS_LABEL, VEHICLE_CLASSES, type VehicleClass } from "@/lib/constants";
import { alsoAt } from "@/lib/dedupe";
import { priceEvals } from "@/lib/price-eval";
import { vzdBadges } from "@/lib/vzd";
import { favoriteIds } from "@/lib/favorites";
import { regionOptions } from "@/lib/listings";
import { describeSearch, priceInsights, parseSearch, searchListings, typeCounts, sourceCounts } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

import { formatPrice } from "@/lib/format";
import { facetCounts, priceSummary } from "@/lib/search";
import { appBase, propertyHref, regionName, RIGA_DISTRICT, vehicleHref, seoSlug, type Landing } from "@/lib/seo";
import { trTitle } from "@/i18n/content";
import { PROPERTY_PLURAL, PROPERTY_TYPES, type PropertyType } from "@/lib/constants";

export type SP = Record<string, string | string[] | undefined>;

/**
 * Meklēšanas lapa: "/" ar ?filtriem vai SEO lapa (landing) ar fiksētiem filtriem un savu virsrakstu.
 * Filtru maiņa vienmēr ved uz "/?…".
 */
export async function SearchView({ raw, landing }: { raw: SP; landing?: Landing }) {
  const { t, tp, lp, locale } = await getT();
  const s = parseSearch(raw);
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v === "string" && v) flat[k] = v;

  const user = await getCurrentUser();
  let result: Awaited<ReturnType<typeof searchListings>> | null = null;
  let regions: Awaited<ReturnType<typeof regionOptions>> = [];
  try {
    [result, regions] = await Promise.all([searchListings(s), regionOptions()]);
  } catch (err) {
    console.error("Meklēšana neizdevās:", err);
  }
  const stripMode = s.cat === "vehicle" && (s.vc ?? "car") === "car" ? "car" : s.cat === "property" && !s.ptype?.startsWith("g:") ? "home" : null;
  const counts = stripMode && result ? await typeCounts(s).catch(() => ({})) : {};
  const srcCounts = result ? await sourceCounts(s).catch(() => []) : [];
  const [also, evals, vzd] = result
    ? await Promise.all([
        alsoAt(result.rows).catch(() => new Map()),
        priceEvals(result.rows.map((r) => r.id)).catch(() => new Map()),
        vzdBadges(result.rows.filter((r) => r.kind === "property").map((r) => r.id)).catch(() => new Map()),
      ])
    : [new Map(), new Map(), new Map()];
  const favs = user && result ? await favoriteIds(user.id, result.rows.map((r) => r.id)).catch(() => new Set<string>()) : new Set<string>();

  const heading = s.cat === "vehicle" ? t(VEHICLE_CLASS_LABEL[(s.vc ?? "car") as VehicleClass]) : s.cat === "property" ? t("Nekustamais īpašums") : t("Visi sludinājumi");
  const pointsQuery = new URLSearchParams(Object.entries(flat).filter(([k]) => !["page", "sort", "zone"].includes(k))).toString();
  const pageHref = (n: number) => {
    if (landing) return n > 1 ? `${lp(landing.path)}?page=${n}` : lp(landing.path);
    const p = new URLSearchParams(flat);
    if (n > 1) p.set("page", String(n));
    else p.delete("page");
    return p.toString() ? `/?${p}` : "/";
  };
  // SEO lapām: kopsavilkums un iekšējās saites
  // mini analītika: tikai salīdzināmām cenām (transports vai īpašums ar zināmu darījumu), pirmajā lapā
  const insights = result && s.page === 1 && (s.cat === "vehicle" || (s.cat === "property" && (s.deal === "sell" || s.deal === "rent"))) ? await priceInsights(s).catch(() => null) : null;
  const summary = landing ? await priceSummary(s).catch(() => null) : null;
  const facetBy = landing?.facet === "make" || landing?.facet === "model" || landing?.facet === "region" ? landing.facet : null;
  const facets = facetBy ? await facetCounts(s, facetBy).catch(() => []) : [];
  const facetHref = (f: { id: number; name: string }) =>
    facetBy === "make" ? vehicleHref(s.vc as VehicleClass, f.name)
    : facetBy === "model" ? `${landing!.path}/${seoSlug(f.name)}`
    : `${landing!.path}/${seoSlug(f.name)}`;

  return (
    <main className="wrap search">
      <aside className="side">
        {/* telefonā kategorijas redzamas uzreiz, virs aizvērtajiem filtriem */}
        <nav className="quick-cats" aria-label={t("Kategorija")}>
          <div className="seg full">
            {([["", "Visi"], ["vehicle", "Transports"], ["property", "Īpašumi"]] as const).map(([c, l]) => (
              <a key={c} href={lp(c === "vehicle" ? "/auto" : c === "property" ? "/ipasumi" : "/")} aria-current={(s.cat ?? "") === c ? "page" : undefined}>{t(l)}</a>
            ))}
          </div>
          {s.cat === "vehicle" && (
            <div className="quick-vc">
              {VEHICLE_CLASSES.map((c) => (
                <a key={c} href={vehicleHref(c) ? lp(vehicleHref(c)!) : `/?cat=vehicle&vc=${c}`} aria-current={(s.vc ?? "car") === c ? "page" : undefined}>{t(VEHICLE_CLASS_LABEL[c])}</a>
              ))}
            </div>
          )}
        </nav>
        <FiltersBox active={Object.keys(flat).filter((k) => !["cat", "vc", "sort", "page"].includes(k)).length}>
          <SearchFilters initial={flat} regions={regions} sources={srcCounts} />
        </FiltersBox>
      </aside>
      <section className="results">
        {landing && (
          <>
            <nav className="crumbs" aria-label={t("Ceļš")}>
              <a href={lp("/")}>VienāVietā</a>
              {landing.crumbs.map((c) => <span key={c.href}> › <a href={lp(c.href)}>{c.name}</a></span>)}
            </nav>
            <JsonLd data={{
              "@context": "https://schema.org", "@type": "BreadcrumbList",
              itemListElement: [{ name: "VienāVietā", href: "/" }, ...landing.crumbs].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${appBase()}${lp(c.href)}` })),
            }} />
          </>
        )}
        <SmartSearch flat={flat} action={lp("/mekle")} />
        {flat.tq && !landing && (
          <div className="tq-note">
            <p>🔎 <b>„{flat.tq}”</b></p>
            <p>{t("Sapratu")}: <b>{await describeSearch(s).catch(() => "")}</b>. <span className="fine">{t("Filtri ir iestatīti pēc tava teksta; vari tos labot sadaļā „Filtri”.")}</span></p>
            {(flat.tn ?? "").split(",").filter(Boolean).map((n) => (
              <p key={n} className="fine">
                {n === "economy" ? t("„Ekonomisks” saprasts kā dzinējs līdz 2,0 l.") : t("„{x}”: citu portālu sludinājumos to nevar pārbaudīt, tāpēc pēc tā nav filtrēts.", { x: t(n.replace("unchecked:", "")) })}
              </p>
            ))}
            {flat.tu && <p className="fine">{t("Nesaprasti vārdi:")} {flat.tu}</p>}
          </div>
        )}
        {stripMode && <TypeStrip mode={stripMode} flat={flat} counts={counts} />}
        <SearchMapLazy query={pointsQuery} zone={flat.zone} />
        {insights && <PriceInsights d={insights} flat={flat} rent={s.deal === "rent"} />}
        <div className="results-head">
          {landing ? <h1>{landing.h1}</h1> : <h1>{heading}</h1>}
          {result && <span className="count">{tp(result.total, "sludinājums", "sludinājumi")}</span>}
          <span className="grow" />
          <Suspense>
            <SortSelect value={s.sort} base={flat} />
          </Suspense>
        </div>
        <Suspense>
          <SaveSearchButton loggedIn={Boolean(user)} filters={flat} />
        </Suspense>
        {s.zone && (() => {
          const [unit, value, approx, label] = (flat.zl ?? "").split("|");
          if (!label) return <p className="zone-note">{t("Rāda tikai sludinājumus iezīmētajā zonā.")}</p>;
          return (
            <p className="zone-note">
              📍 {unit === "min" ? t("Rāda sludinājumus līdz {n} min braucienā ar auto no: {a}", { n: value, a: label }) : t("Rāda sludinājumus līdz {n} km no: {a}", { n: value, a: label })}
              {approx === "1" ? ` (${t("aptuveni, pēc attāluma")})` : ""}. {t("Transportam vieta ir zināma tikai pilsētas vai pagasta līmenī.")}
            </p>
          );
        })()}
        {!result ? (
          <div className="notice">
            Neizdevās pieslēgties datubāzei. Pārbaudi, vai tā darbojas (<code>docker compose up -d</code>).
          </div>
        ) : result.rows.length === 0 ? (
          <div className="notice">{t("Nekas neatbilst izvēlētajiem filtriem. Pamēģini paplašināt meklēšanu.")}</div>
        ) : (
          <>
            <div className="list">
              {result.rows.map((l) => (
                <ListingCard key={l.id} l={l} favorite={{ on: favs.has(l.id), loggedIn: Boolean(user) }} also={also.get(l.id)} evaluation={evals.get(l.id)} oldPrice={l.firstPrice} vzd={vzd.get(l.id)} compare />
              ))}
            </div>
            {result.pages > 1 && (
              <nav className="pager" aria-label={t("Lapas")}>
                {s.page > 1 && <a className="btn small" href={pageHref(s.page - 1)}>{t("‹ Iepriekšējā")}</a>}
                <span className="fine">
                  {t("{n}. lapa no {m}", { n: s.page, m: result.pages })}
                </span>
                {s.page < result.pages && <a className="btn small" href={pageHref(s.page + 1)}>{t("Nākamā ›")}</a>}
              </nav>
            )}
          </>
        )}
        {landing && (
          <div className="seo-box">
            <p>
              {landing.about}{" "}
              {summary && summary.n > 0 && (
                <>
                  {tp(summary.n, "sludinājums", "sludinājumi")}
                  {summary.median ? `, ${t("cenas mediāna {p}", { p: formatPrice(summary.median) })}` : ""}.
                </>
              )}{" "}
              {t("Salīdzini cenas, skaties cenu vēsturi un saņem paziņojumus par jauniem sludinājumiem.")}
            </p>
            {landing.dealSwitch && <p><a href={lp(landing.dealSwitch.href)}>{landing.dealSwitch.label} →</a></p>}
            {landing.facet === "ptype" && (
              <ul className="seo-links">
                {PROPERTY_TYPES.map((pt: PropertyType) => <li key={pt}><a href={lp(propertyHref(pt, "sell"))}>{t(PROPERTY_PLURAL[pt])}</a></li>)}
              </ul>
            )}
            {facets.length > 0 && (
              <ul className="seo-links">
                {facetBy === "region" && <li><a href={lp(`${landing!.path}/${RIGA_DISTRICT.slug}`)}>{regionName(RIGA_DISTRICT.name, locale)}</a></li>}
                {facets.slice(0, 80).map((f) => {
                  const href = facetHref(f);
                  const label = facetBy === "region" ? regionName(f.name, locale) : facetBy === "model" ? trTitle(f.name, t) : f.name;
                  return href ? <li key={f.id}><a href={lp(href)}>{label}</a> <span className="fine">{f.n}</span></li> : null;
                })}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
