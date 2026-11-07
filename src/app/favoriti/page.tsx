import type { Metadata } from "next";
import { ListingCard } from "@/components/listing-card";
import { favoriteListings } from "@/lib/favorites";
import { plural } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Favorīti" };

export default async function FavoritesPage() {
  const user = await requireUser("/favoriti");
  const rows = await favoriteListings(user.id);
  const drops = rows.filter((r) => r.priceWhenSaved != null && r.priceWhenSaved > r.price).length;
  return (
    <main className="wrap">
      <div className="row between">
        <h1>Favorīti</h1>
        <a className="btn small" href="/pazinojumi">🔔 Cenu krituma paziņojumi</a>
      </div>
      {rows.length === 0 ? (
        <div className="notice">
          Tev vēl nav saglabātu sludinājumu. Spied sirsniņu pie sludinājuma, lai to saglabātu šeit.
        </div>
      ) : (
        <>
          <p className="lead">
            {plural(rows.length, "saglabāts sludinājums", "saglabāti sludinājumi")}{drops > 0 ? ` · ${drops} ar samazinātu cenu kopš saglabāšanas` : ""}
          </p>
          <div className="list">
            {rows.map((l) => (
              <ListingCard key={l.id} l={l} showStatus oldPrice={l.priceWhenSaved} favorite={{ on: true, loggedIn: true }} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
