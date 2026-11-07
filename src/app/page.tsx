import { DEAL_LABEL } from "@/lib/constants";
import { formatNumber, formatPrice, timeAgo } from "@/lib/format";
import { latestListings, locationLabel } from "@/lib/listings";

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
      <p className="lead">Šī ir pirmā versija. Meklēšana, filtri, karte un konti nāks nākamajos soļos.</p>

      {dbError ? (
        <div className="notice">
          Neizdevās pieslēgties datubāzei. Pārbaudi, vai tā darbojas (<code>docker compose up -d</code>) un vai
          <code>.env</code> failā ir pareizs <code>DATABASE_URL</code>.
        </div>
      ) : rows.length === 0 ? (
        <div className="notice">
          Sludinājumu vēl nav. Izstrādei vari ielādēt paraugus: <code>npm run db:seed:demo</code>
        </div>
      ) : (
        <div className="list">
          {rows.map((l) => {
            const meta =
              l.kind === "vehicle"
                ? [l.year, l.mileageKm != null ? `${formatNumber(l.mileageKm)} km` : null, l.fuel, l.gearbox]
                : [l.propertyType, l.areaM2 ? `${l.areaM2} m²` : null, l.rooms ? `${l.rooms} ist.` : null, l.deal ? DEAL_LABEL[l.deal] : null];
            const unit = l.deal === "rent" ? "/mēn." : l.deal === "day" ? "/dienā" : "";
            return (
              <article className="card" key={l.id}>
                <div>
                  <span className={`kind ${l.kind}`}>{l.kind === "vehicle" ? "Transports" : "Īpašums"}</span>
                  <h2>{l.title}</h2>
                  <div className="meta">
                    {meta.filter(Boolean).map((m, i) => (
                      <span key={i}>{m}</span>
                    ))}
                    <span>📍 {locationLabel(l.place, l.region, l.regionKind)}</span>
                    <span>{timeAgo(l.createdAt)}</span>
                  </div>
                </div>
                <div className="price">
                  {formatPrice(l.price)} {unit && <small>{unit}</small>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
