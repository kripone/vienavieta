import { ListingCard } from "@/components/listing-card";
import { latestListings } from "@/lib/listings";

// Sākumlapa vienmēr rāda svaigus datus no datubāzes
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let rows: Awaited<ReturnType<typeof latestListings>> = [];
  let dbError = false;
  try {
    rows = await latestListings(50);
  } catch (err) {
    console.error("Datubāze nav pieejama:", err);
    dbError = true;
  }

  return (
    <main className="wrap">
      <h1>Jaunākie sludinājumi</h1>
      <p className="lead">Meklēšana, filtri un karte nāks nākamajā solī.</p>

      {dbError ? (
        <div className="notice">
          Neizdevās pieslēgties datubāzei. Pārbaudi, vai tā darbojas (<code>docker compose up -d</code>) un vai
          <code>.env</code> failā ir pareizs <code>DATABASE_URL</code>.
        </div>
      ) : rows.length === 0 ? (
        <div className="notice">
          Sludinājumu vēl nav. <a href="/pievienot">Pievieno pirmo</a> vai izstrādei ielādē paraugus: <code>npm run db:seed:demo</code>
        </div>
      ) : (
        <div className="list">
          {rows.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      )}
    </main>
  );
}
