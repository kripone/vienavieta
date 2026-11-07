import { Suspense } from "react";
import { FiltersBox } from "@/components/filters-box";
import { ListingCard } from "@/components/listing-card";
import { SearchFilters } from "@/components/search-filters";
import { SearchMapLazy } from "@/components/search-map-lazy";
import { SortSelect } from "@/components/sort-select";
import { VEHICLE_CLASS_LABEL, type VehicleClass } from "@/lib/constants";
import { favoriteIds } from "@/lib/favorites";
import { plural } from "@/lib/format";
import { regionOptions } from "@/lib/listings";
import { parseSearch, searchListings } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function SearchPage(props: { searchParams: Promise<SP> }) {
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
  const favs = user && result ? await favoriteIds(user.id, result.rows.map((r) => r.id)).catch(() => new Set<string>()) : new Set<string>();

  const heading = s.cat === "vehicle" ? VEHICLE_CLASS_LABEL[(s.vc ?? "car") as VehicleClass] : s.cat === "property" ? "Nekustamais īpašums" : "Visi sludinājumi";
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
        <FiltersBox active={Object.keys(flat).filter((k) => !["cat", "vc", "sort", "page"].includes(k)).length}>
          <SearchFilters initial={flat} regions={regions} />
        </FiltersBox>
      </aside>
      <section className="results">
        <SearchMapLazy query={pointsQuery} zone={flat.zone} />
        <div className="results-head">
          <h1>{heading}</h1>
          {result && <span className="count">{plural(result.total, "sludinājums", "sludinājumi")}</span>}
          <span className="grow" />
          <Suspense>
            <SortSelect value={s.sort} />
          </Suspense>
        </div>
        {s.zone && <p className="zone-note">Rāda tikai sludinājumus iezīmētajā zonā.</p>}
        {!result ? (
          <div className="notice">
            Neizdevās pieslēgties datubāzei. Pārbaudi, vai tā darbojas (<code>docker compose up -d</code>).
          </div>
        ) : result.rows.length === 0 ? (
          <div className="notice">Nekas neatbilst izvēlētajiem filtriem. Pamēģini paplašināt meklēšanu.</div>
        ) : (
          <>
            <div className="list">
              {result.rows.map((l) => (
                <ListingCard key={l.id} l={l} favorite={{ on: favs.has(l.id), loggedIn: Boolean(user) }} />
              ))}
            </div>
            {result.pages > 1 && (
              <nav className="pager" aria-label="Lapas">
                {s.page > 1 && <a className="btn small" href={pageHref(s.page - 1)}>‹ Iepriekšējā</a>}
                <span className="fine">
                  {s.page}. lapa no {result.pages}
                </span>
                {s.page < result.pages && <a className="btn small" href={pageHref(s.page + 1)}>Nākamā ›</a>}
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
