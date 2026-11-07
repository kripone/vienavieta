import { getT } from "@/i18n/server";
import { Suspense } from "react";
import { FiltersBox } from "@/components/filters-box";
import { ListingCard } from "@/components/listing-card";
import { SaveSearchButton } from "@/components/save-search-button";
import { SearchFilters } from "@/components/search-filters";
import { SearchMapLazy } from "@/components/search-map-lazy";
import { SortSelect } from "@/components/sort-select";
import { TypeStrip } from "@/components/type-strip";
import { VEHICLE_CLASS_LABEL, VEHICLE_CLASSES, type VehicleClass } from "@/lib/constants";
import { alsoAt } from "@/lib/dedupe";
import { priceEvals } from "@/lib/price-eval";
import { vzdBadges } from "@/lib/vzd";
import { favoriteIds } from "@/lib/favorites";
import { regionOptions } from "@/lib/listings";
import { parseSearch, searchListings, typeCounts } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function SearchPage(props: { searchParams: Promise<SP> }) {
  const { t, tp } = await getT();
  const raw = await props.searchParams;
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
    const p = new URLSearchParams(flat);
    if (n > 1) p.set("page", String(n));
    else p.delete("page");
    return p.toString() ? `/?${p}` : "/";
  };

  return (
    <main className="wrap search">
      <aside className="side">
        {/* telefonā kategorijas redzamas uzreiz, virs aizvērtajiem filtriem */}
        <nav className="quick-cats" aria-label={t("Kategorija")}>
          <div className="seg full">
            {([["", "Visi"], ["vehicle", "Transports"], ["property", "Īpašumi"]] as const).map(([c, l]) => (
              <a key={c} href={c ? `/?cat=${c}` : "/"} aria-current={(s.cat ?? "") === c ? "page" : undefined}>{t(l)}</a>
            ))}
          </div>
          {s.cat === "vehicle" && (
            <div className="quick-vc">
              {VEHICLE_CLASSES.map((c) => (
                <a key={c} href={`/?cat=vehicle&vc=${c}`} aria-current={(s.vc ?? "car") === c ? "page" : undefined}>{t(VEHICLE_CLASS_LABEL[c])}</a>
              ))}
            </div>
          )}
        </nav>
        <FiltersBox active={Object.keys(flat).filter((k) => !["cat", "vc", "sort", "page"].includes(k)).length}>
          <SearchFilters initial={flat} regions={regions} />
        </FiltersBox>
      </aside>
      <section className="results">
        {stripMode && <TypeStrip mode={stripMode} flat={flat} counts={counts} />}
        <SearchMapLazy query={pointsQuery} zone={flat.zone} />
        <div className="results-head">
          <h1>{heading}</h1>
          {result && <span className="count">{tp(result.total, "sludinājums", "sludinājumi")}</span>}
          <span className="grow" />
          <Suspense>
            <SortSelect value={s.sort} />
          </Suspense>
        </div>
        <Suspense>
          <SaveSearchButton loggedIn={Boolean(user)} />
        </Suspense>
        {s.zone && <p className="zone-note">{t("Rāda tikai sludinājumus iezīmētajā zonā.")}</p>}
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
      </section>
    </main>
  );
}
