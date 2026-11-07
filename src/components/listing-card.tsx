import { FavButton } from "@/components/fav-button";
import { DEAL_LABEL } from "@/lib/constants";
import { formatNumber, formatPrice, timeAgo } from "@/lib/format";
import { landLabel } from "@/lib/listing-input";
import { locationLabel, type ListingCard as Card } from "@/lib/listings";
import { mediaUrl } from "@/lib/storage";

const STATUS: Record<string, string> = { active: "Aktīvs", pending: "Gaida pārbaudi", hidden: "Paslēpts", sold: "Pārdots", deleted: "Dzēsts" };

export function priceUnit(deal: string | null) {
  return deal === "rent" ? "/mēn." : deal === "day" ? "/dienā" : "";
}

type CardProps = {
  l: Card;
  showStatus?: boolean;
  actions?: React.ReactNode;
  /** Ja norādīts, kartītē rāda sirsniņu. */
  favorite?: { on: boolean; loggedIn: boolean };
  /** Cena, kad sludinājums saglabāts favorītos (rāda, ja tagad lētāk). */
  oldPrice?: number | null;
};

export function ListingCard({ l, showStatus, actions, favorite, oldPrice }: CardProps) {
  const meta =
    l.kind === "vehicle"
      ? [l.year, l.mileageKm != null ? `${formatNumber(l.mileageKm)} km` : null, l.fuel, l.gearbox, l.body]
      : [l.propertyType, l.areaM2 ? `${Number(l.areaM2)} m²` : null, l.rooms ? `${l.rooms} ist.` : null, l.landM2 && !l.areaM2 ? landLabel(l.landM2) : null, l.deal ? DEAL_LABEL[l.deal] : null];
  const unit = priceUnit(l.deal);
  return (
    <article className="card lcard">
      <a href={`/sludinajumi/${l.id}`} className="thumb" aria-hidden="true" tabIndex={-1}>
        {l.thumbKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(l.thumbKey)} alt="" loading="lazy" />
        ) : (
          <span className="noimg">{l.kind === "vehicle" ? "🚗" : "🏠"}</span>
        )}
        {l.photoCount > 1 && <span className="pc">📷 {l.photoCount}</span>}
      </a>
      <div className="body">
        <span className={`kind ${l.kind}`}>{l.kind === "vehicle" ? "Transports" : "Īpašums"}</span>
        {showStatus && l.status !== "active" && <span className="status">{STATUS[l.status]}</span>}
        <h2>
          <a href={`/sludinajumi/${l.id}`}>{l.title}</a>
        </h2>
        <div className="meta">
          {meta.filter(Boolean).map((m, i) => (
            <span key={i}>{m}</span>
          ))}
          <span>📍 {locationLabel(l.place, l.region, l.regionKind)}</span>
          <span>{timeAgo(l.createdAt)}</span>
        </div>
        {actions}
      </div>
      <div className="price-col">
        <div className="price">
          {formatPrice(l.price)} {unit && <small>{unit}</small>}
        </div>
        {oldPrice != null && oldPrice > l.price && (
          <div className="drop">
            <s>{formatPrice(oldPrice)}</s> −{formatPrice(oldPrice - l.price)}
          </div>
        )}
        {favorite && <FavButton id={l.id} on={favorite.on} loggedIn={favorite.loggedIn} />}
      </div>
    </article>
  );
}
