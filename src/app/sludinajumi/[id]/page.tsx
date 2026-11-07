import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactReveal } from "@/components/contact-reveal";
import { FavButton } from "@/components/fav-button";
import { ReportButton } from "@/components/report-button";
import { Gallery } from "@/components/gallery";
import { priceUnit } from "@/components/listing-card";
import { OwnerActions } from "@/components/owner-actions";
import { DEAL_LABEL, SOURCE_LABEL, VEHICLE_CLASS_LABEL, type VehicleClass } from "@/lib/constants";
import { formatNumber, formatPrice, timeAgo } from "@/lib/format";
import { listingIll } from "@/lib/illustrations";
import { landLabel } from "@/lib/listing-input";
import { CompareToggle } from "@/components/compare";
import { EvalBadge } from "@/components/eval-badge";
import { alsoAt } from "@/lib/dedupe";
import { listingHistory } from "@/lib/history";
import { PriceHistory } from "@/components/price-history";
import { priceEvals } from "@/lib/price-eval";
import { favoriteIds } from "@/lib/favorites";
import { getListing, locationLabel } from "@/lib/listings";
import { getCurrentUser, isModerator } from "@/lib/session";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saglabats?: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params;
  const d = await getListing(id).catch(() => null);
  if (!d || d.l.status === "deleted") return { title: "Sludinājums nav atrasts" };
  return { title: d.l.title, description: `${formatPrice(d.l.price)} · ${locationLabel(d.place, d.region, d.regionKind)}`, openGraph: { images: d.photos[0] ? [d.photos[0].url] : [] } };
}

export default async function ListingPage(props: Props) {
  const { id } = await props.params;
  const { saglabats } = await props.searchParams;
  const [d, user] = await Promise.all([getListing(id), getCurrentUser()]);
  if (!d) notFound();
  const l = d.l;
  const isOwner = Boolean(user && l.userId === user.id);
  const isMod = isModerator(user);
  if (l.status === "deleted" || ((l.status === "hidden" || l.status === "pending") && !isOwner && !isMod)) notFound();

  const rows: [string, string | number | null | undefined][] =
    l.kind === "vehicle"
      ? [
          ["Transporta veids", l.vehicleClass ? VEHICLE_CLASS_LABEL[l.vehicleClass as VehicleClass] : null],
          ["Marka", d.make ?? l.makeText],
          ["Modelis", d.model ?? l.modelText],
          ["Gads", l.year],
          ["Nobraukums", l.mileageKm != null ? `${formatNumber(l.mileageKm)} km` : null],
          ["Degviela", l.fuel],
          ["Ātrumkārba", l.gearbox],
          ["Virsbūve / tips", l.body],
          ["Tilpums", l.engineL ? `${Number(l.engineL).toFixed(1)} L` : null],
          ["Jauda", l.powerKw ? `${l.powerKw} kW (${Math.round(l.powerKw * 1.36)} ZS)` : null],
          ["Piedziņa", l.drive],
          ["Krāsa", l.color],
        ]
      : [
          ["Īpašuma veids", l.propertyType],
          ["Darījums", l.deal ? DEAL_LABEL[l.deal] : null],
          ["Platība", l.areaM2 ? `${Number(l.areaM2)} m²` : null],
          ["Cena par m²", l.areaM2 && l.deal === "sell" ? `${formatNumber(Math.round(l.price / Number(l.areaM2)))} €` : null],
          ["Istabas", l.rooms],
          ["Stāvs", l.floor != null ? `${l.floor}${l.floors ? " / " + l.floors : ""}` : l.floors ? `${l.floors} stāvi` : null],
          ["Zeme", l.landM2 ? landLabel(l.landM2) : null],
          ["Sērija", l.series],
          ["Mājas tips", l.material],
          ["Apkure", l.heating],
          ["Stāvoklis", l.condition],
          ["Būvēts", l.builtYear],
          ["Lietošanas mērķis", l.purpose],
          ["Ērtības", l.amenities.length ? l.amenities.join(", ") : null],
        ];
  const evaluation = (await priceEvals([l.id]).catch(() => new Map())).get(l.id);
  const elsewhere = (await alsoAt([{ id: l.id, groupKey: l.groupKey }]).catch(() => new Map())).get(l.id) ?? [];
  const history = await listingHistory({ id: l.id, price: l.price, createdAt: l.createdAt }).catch(() => null);
  const isFav = user && !isOwner ? (await favoriteIds(user.id, [l.id])).has(l.id) : false;
  const seller = d.sellerType === "dealer" && d.companyName ? d.companyName : d.sellerName || "Privātpersona";
  const unit = priceUnit(l.deal);
  const ext = l.source !== "own" && l.externalUrl ? l.externalUrl : null;
  const src = SOURCE_LABEL[l.source] ?? l.source;

  return (
    <main className="wrap">
      {saglabats && isOwner && <p className="welcome">Sludinājums saglabāts{l.status === "active" ? " un redzams visiem" : ""}.</p>}
      {l.status === "sold" && <p className="alert">Šis sludinājums ir atzīmēts kā pārdots.</p>}
      {l.status === "hidden" && (isOwner || isMod) && <p className="alert">Sludinājumu paslēpis moderators, un citi to neredz.</p>}
      {l.status === "pending" && isMod && !isOwner && <p className="alert">Paslēpts pēc lietotāju sūdzībām. Izlem sadaļā <a href="/moderacija">Moderācija</a>.</p>}
      {l.status === "pending" && isOwner && <p className="alert">Sludinājums ir paslēpts pēc vairāku lietotāju sūdzībām. Moderators to pārbaudīs, un pēc tam tas atkal būs redzams.</p>}
      {isOwner && <OwnerActions id={l.id} status={l.status} />}
      <div className="det">
        <Gallery photos={d.photos} title={l.title} placeholder={listingIll(l)} />
        <div className="det-side">
          <div className="det-title">
            <h1>{l.title}</h1>
            <div className="card-tools">
              <CompareToggle id={l.id} kind={l.kind} />
              {!isOwner && <FavButton id={l.id} on={isFav} loggedIn={Boolean(user)} big />}
            </div>
          </div>
          <div className="det-price">
            {formatPrice(l.price)} {unit && <small>{unit}</small>}
          </div>
          {evaluation && <EvalBadge e={evaluation} long />}
          <p className="meta">
            {d.place && <span>📍 {locationLabel(d.place, d.region, d.regionKind)}</span>}
            <span>{ext ? `Pievienots ${timeAgo(l.createdAt)}` : `Ievietots ${timeAgo(l.createdAt)}`}</span>
          </p>
          {ext ? (
            <div className="panel seller">
              <b>Sludinājums no {src}</b>
              <p className="ext-note">
                Šeit redzami tikai galvenie fakti. Bildes, aprakstu un pārdevēja kontaktus skaties oriģinālajā sludinājumā {src}.
              </p>
              <a className="btn primary" href={ext} target="_blank" rel="nofollow noopener noreferrer">Atvērt {src} ↗</a>
            </div>
          ) : (
            <div className="panel seller">
              <b>{seller}</b>
              <span className="fine">
                {d.sellerType === "dealer" ? (l.kind === "vehicle" ? "Auto salons" : "Aģentūra") : "Privātpersona"}
                {d.sellerVerified ? " · ✔ identitāte apstiprināta" : ""}
              </span>
              {l.status === "active" && !isOwner && <ContactReveal id={l.id} />}
            </div>
          )}
          {elsewhere.length > 0 && (
            <div className="panel also-panel">
              <b>Šis pats sludinājums arī:</b>
              <ul>
                {elsewhere.map((a: { id: string; source: string; url: string; price: number }) => (
                  <li key={a.id}>
                    {a.source === "own" ? (
                      <a href={a.url}>VienāVietā</a>
                    ) : (
                      <a href={a.url} target="_blank" rel="nofollow noopener noreferrer">{SOURCE_LABEL[a.source] ?? a.source} ↗</a>
                    )}{" "}
                    <span className="fine">{formatPrice(a.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {l.status === "active" && !isOwner && <ReportButton id={l.id} loggedIn={Boolean(user)} />}
        </div>
      </div>
      <div className="det-body">
        <section>
          <h2>Parametri</h2>
          <dl className="params">
            {rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        {history && <PriceHistory h={history} external={l.source !== "own"} />}
        {l.description && (
          <section>
            <h2>Apraksts</h2>
            <p className="desc">{l.description}</p>
          </section>
        )}
      </div>
    </main>
  );
}
