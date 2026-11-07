import { FavButton } from "@/components/fav-button";
import { CompareToggle } from "@/components/compare";
import { EvalBadge } from "@/components/eval-badge";
import { ExtThumb } from "@/components/ext-thumb";
import type { PriceEval } from "@/lib/price-eval";
import { Ill } from "@/components/ill";
import { DEAL_LABEL, SOURCE_LABEL } from "@/lib/constants";
import { listingIll } from "@/lib/illustrations";
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
  /** Tas pats objekts citos portālos (sk. src/lib/dedupe.ts). */
  also?: { id: string; source: string; url: string; price: number }[];
  /** Cenas novērtējums pret līdzīgiem (src/lib/price-eval.ts). */
  evaluation?: PriceEval | null;
  /** Rādīt pogu "Salīdzināt". */
  compare?: boolean;
  /** VZD darījumu €/m² mediāna šajā mājā (src/lib/vzd.ts). */
  vzd?: { median: number; n: number } | null;
};

export function ListingCard({ l, showStatus, actions, favorite, oldPrice, also, evaluation, compare, vzd }: CardProps) {
  const meta =
    l.kind === "vehicle"
      ? [l.year, l.mileageKm != null ? `${formatNumber(l.mileageKm)} km` : null, l.fuel, l.gearbox, l.body]
      : [l.propertyType, l.areaM2 ? `${Number(l.areaM2)} m²` : null, l.rooms ? `${l.rooms} ist.` : null, l.landM2 && !l.areaM2 ? landLabel(l.landM2) : null, l.deal ? DEAL_LABEL[l.deal] : null];
  const unit = priceUnit(l.deal);
  const ext = l.source !== "own" && l.externalUrl ? l.externalUrl : null;
  const src = SOURCE_LABEL[l.source] ?? l.source;
  // Ārējie sludinājumi: virsraksts ved uz oriģinālu (jaunā cilnē); mūsu lapā ir tikai fakti un saite.
  const extLink = { target: "_blank", rel: "nofollow noopener noreferrer" } as const;
  const where = locationLabel(l.place, l.region, l.regionKind);
  return (
    <article className="card lcard">
      <a href={`/sludinajumi/${l.id}`} className="thumb" aria-hidden="true" tabIndex={-1}>
        {l.thumbKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(l.thumbKey)} alt="" loading="lazy" />
        ) : ext && l.externalThumbUrl && process.env.EXTERNAL_THUMBS !== "off" ? (
          <ExtThumb src={l.externalThumbUrl} source={src} fallback={listingIll(l)} />
        ) : (
          <Ill svg={listingIll(l)} />
        )}
        {l.photoCount > 1 && <span className="pc">📷 {l.photoCount}</span>}
      </a>
      <div className="body">
        <span className={`kind ${l.kind}`}>{l.kind === "vehicle" ? "Transports" : "Īpašums"}</span>
        {showStatus && l.status !== "active" && <span className="status">{STATUS[l.status]}</span>}
        <h2>
          {ext ? (
            <a href={ext} {...extLink} title={`Atvērt sludinājumu ${src} (jaunā cilnē)`}>{l.title}</a>
          ) : (
            <a href={`/sludinajumi/${l.id}`}>{l.title}</a>
          )}
        </h2>
        <div className="meta">
          {meta.filter(Boolean).map((m, i) => (
            <span key={i}>{m}</span>
          ))}
          {where && <span>📍 {where}</span>}
          <span>{timeAgo(l.createdAt)}</span>
        </div>
        {ext && (
          <div className="ext-row">
            <span className="src-badge">Avots: {src}</span>
            <a className="ext-link" href={ext} {...extLink}>Skatīt {src} ↗</a>
            <a className="fine" href={`/sludinajumi/${l.id}`}>Sīkāk</a>
          </div>
        )}
        {also && also.length > 0 && (
          <div className="ext-row also">
            <span className="fine">Arī:</span>
            {also.map((a) =>
              a.source === "own" ? (
                <a key={a.id} href={a.url}>VienāVietā</a>
              ) : (
                <a key={a.id} href={a.url} {...extLink}>
                  {SOURCE_LABEL[a.source] ?? a.source}{a.price !== l.price ? ` (${formatPrice(a.price)})` : ""} ↗
                </a>
              ),
            )}
          </div>
        )}
        {vzd && (
          <a className="vzd-badge" href={`/sludinajumi/${l.id}#vzd`} title="Reālās pirkuma cenas šajā mājā (Valsts zemes dienests)">
            VZD: šajā mājā {formatNumber(vzd.median)} €/m² ({vzd.n})
            {l.areaM2 ? <> · šis {formatNumber(Math.round(l.price / Number(l.areaM2)))} €/m²</> : null}
          </a>
        )}
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
        {evaluation && <EvalBadge e={evaluation} />}
        <div className="card-tools">
          {compare && <CompareToggle id={l.id} kind={l.kind} />}
          {favorite && <FavButton id={l.id} on={favorite.on} loggedIn={favorite.loggedIn} />}
        </div>
      </div>
    </article>
  );
}
