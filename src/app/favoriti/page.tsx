import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { ListingCard } from "@/components/listing-card";
import { favoriteListings } from "@/lib/favorites";
import { priceEvals } from "@/lib/price-eval";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Favorīti") };
}

export default async function FavoritesPage() {
  const { t, tp } = await getT();
  const user = await requireUser("/favoriti");
  const rows = await favoriteListings(user.id);
  const evals = await priceEvals(rows.map((r) => r.id)).catch(() => new Map());
  const drops = rows.filter((r) => r.priceWhenSaved != null && r.priceWhenSaved > r.price).length;
  return (
    <main className="wrap">
      <div className="row between">
        <h1>{t("Favorīti")}</h1>
        <a className="btn small" href="/pazinojumi">{t("🔔 Cenu krituma paziņojumi")}</a>
      </div>
      {rows.length === 0 ? (
        <div className="notice">
          {t("Tev vēl nav saglabātu sludinājumu. Spied sirsniņu pie sludinājuma, lai to saglabātu šeit.")}
        </div>
      ) : (
        <>
          <p className="lead">
            {tp(rows.length, "saglabāts sludinājums", "saglabāti sludinājumi")}{drops > 0 ? ` · ${t("{n} ar samazinātu cenu kopš saglabāšanas", { n: drops })}` : ""}
          </p>
          <div className="list">
            {rows.map((l) => (
              <ListingCard key={l.id} l={l} showStatus oldPrice={l.priceWhenSaved} favorite={{ on: true, loggedIn: true }} evaluation={evals.get(l.id)} compare />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
