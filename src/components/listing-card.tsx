import { safeHref } from "@/lib/safe-url";
import { FavButton } from "@/components/fav-button";
import { CompareToggle } from "@/components/compare";
import { EvalBadge } from "@/components/eval-badge";
import { ExtThumb } from "@/components/ext-thumb";
import type { PriceEval } from "@/lib/price-eval";
import { Ill } from "@/components/ill";
import { DEAL_LABEL, DROP_MAX, PRICE_EVAL, SOURCE_LABEL } from "@/lib/constants";
import { listingIll } from "@/lib/illustrations";
import { ssBigThumb } from "@/lib/ext-img";
import { formatNumber, formatPrice, timeAgo } from "@/lib/format";
import { landLabel } from "@/lib/listing-input";
import { fullLocation, locationLabel, type ListingCard as Card } from "@/lib/listings";
import { mediaUrl } from "@/lib/storage";
import { getT } from "@/i18n/server";
import { trTitle } from "@/i18n/content";

const STATUS: Record<string, string> = { active: "Aktīvs", pending: "Gaida pārbaudi", hidden: "Paslēpts", sold: "Pārdots", deleted: "Dzēsts" };

export function priceUnit(deal: string | null, t: (k: string) => string = (k) => k) {
  return deal === "rent" ? t("/mēn.") : deal === "day" ? t("/dienā") : "";
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
  /** Pirmā kartīte sarakstā: bildi ielādē uzreiz (LCP), nevis slinki. */
  priority?: boolean;
  /** virsraksta līmenis: h3, ja kartītes ir zem sadaļas h2 (piem. „Līdzīgi sludinājumi”) */
  heading?: "h2" | "h3";
};

export async function ListingCard({ l, showStatus, actions, favorite, oldPrice, also, evaluation, compare, vzd, priority, heading = "h2" }: CardProps) {
  const H = heading;
  const { t, lp } = await getT();
  // platība zem PRICE_EVAL.AREA_MIN (portālos „1 m²”) nozīmē, ka tās nav – nerādām un €/m² nerēķinām
  const area = l.areaM2 && Number(l.areaM2) >= PRICE_EVAL.AREA_MIN ? Number(l.areaM2) : null;
  const meta =
    l.kind === "vehicle"
      ? [l.year, l.mileageKm != null ? `${formatNumber(l.mileageKm)} km` : null, l.fuel && t(l.fuel), l.gearbox && t(l.gearbox), l.body && t(l.body)]
      : [l.propertyType && t(l.propertyType), area ? `${area} m²` : null, l.rooms ? t("{n} ist.", { n: l.rooms }) : null, l.landM2 && !area ? landLabel(l.landM2) : null, l.deal ? t(DEAL_LABEL[l.deal]) : null];
  const unit = priceUnit(l.deal, t);
  const ext = l.source !== "own" && l.externalUrl ? l.externalUrl : null;
  const src = SOURCE_LABEL[l.source] ?? l.source;
  // Visi sludinājumi vispirms atveras pie mums; saite uz oriģinālu ir sludinājuma lapā.
  const extLink = { rel: "nofollow noopener noreferrer" } as const; // tajā pašā cilnē, lai darbojas poga "Atpakaļ"
  const where = l.kind === "property" ? fullLocation(l.address, l.place, l.region, l.regionKind) : locationLabel(l.place, l.region, l.regionKind);
  return (
    <article className="card lcard">
      <a href={lp(`/sludinajumi/${l.id}`)} className="thumb" aria-hidden="true" tabIndex={-1}>
        {l.thumbKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(l.thumbKey)} alt={trTitle(l.title, t)} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} />
        ) : ext && l.externalThumbUrl && process.env.EXTERNAL_THUMBS !== "off" ? (
          <ExtThumb src={ssBigThumb(l.externalThumbUrl) ?? l.externalThumbUrl} fallbackSrc={l.externalThumbUrl} source={src} ill={{ kind: l.kind, vehicleClass: l.vehicleClass, body: l.body, color: l.color, propertyType: l.propertyType }} alt={trTitle(l.title, t)} priority={priority} />
        ) : !ext && l.externalThumbUrl ? (
          <ExtThumb src={ssBigThumb(l.externalThumbUrl) ?? l.externalThumbUrl} fallbackSrc={l.externalThumbUrl} source="" ill={{ kind: l.kind, vehicleClass: l.vehicleClass, body: l.body, color: l.color, propertyType: l.propertyType }} alt={trTitle(l.title, t)} priority={priority} />
        ) : (
          <Ill svg={listingIll(l)} />
        )}
        {l.photoCount > 1 && <span className="pc">📷 {l.photoCount}</span>}
      </a>
      <div className="body">
        <span className={`kind ${l.kind}`}>{l.kind === "vehicle" ? t("Transports") : t("Īpašums")}</span>
        {showStatus && l.status !== "active" && <span className="status">{t(STATUS[l.status])}</span>}
        <H>
          <a href={lp(`/sludinajumi/${l.id}`)}>{trTitle(l.title, t)}</a>
        </H>
        <div className="meta">
          {meta.filter(Boolean).map((m, i) => (
            <span key={i}>{m}</span>
          ))}
          {where && <span>📍 {where}</span>}
          <span>{timeAgo(l.createdAt, t)}</span>
        </div>
        {ext && (
          <div className="ext-row">
            <span className="src-badge">{t("Avots: {src}", { src })}</span>
          </div>
        )}
        {also && also.length > 0 && (
          <div className="ext-row also">
            <span className="fine">{t("Arī:")}</span>
            {also.map((a) =>
              a.source === "own" ? (
                <a key={a.id} href={a.url}>VienāVietā</a>
              ) : (
                <a key={a.id} href={safeHref(a.url)} {...extLink}>
                  {SOURCE_LABEL[a.source] ?? a.source}{a.price !== l.price ? ` (${formatPrice(a.price)})` : ""} ↗
                </a>
              ),
            )}
          </div>
        )}
        {vzd && (
          <a className="vzd-badge" href={lp(`/sludinajumi/${l.id}`) + "#vzd"} title={t("Reālās pirkuma cenas šajā mājā (Valsts zemes dienests)")}>
            {t("VZD: šajā mājā {v} €/m² ({n})", { v: formatNumber(vzd.median), n: vzd.n })}
            {area ? <> · {t("šis {v} €/m²", { v: formatNumber(Math.round(l.price / area)) })}</> : null}
          </a>
        )}
        {actions}
      </div>
      <div className="price-col">
        <div className="price">
          {formatPrice(l.price)} {unit && <small>{unit}</small>}
        </div>
        {oldPrice != null && oldPrice > l.price && l.price >= oldPrice * (1 - DROP_MAX) && (
          <div className="drop">
            <s>{formatPrice(oldPrice)}</s> −{formatPrice(oldPrice - l.price)}
          </div>
        )}
        {oldPrice != null && oldPrice < l.price && l.price <= oldPrice * (1 + DROP_MAX) && (
          <div className="drop rise">
            <s>{formatPrice(oldPrice)}</s> +{formatPrice(l.price - oldPrice)}
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
