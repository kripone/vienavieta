import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactReveal } from "@/components/contact-reveal";
import { Gallery } from "@/components/gallery";
import { priceUnit } from "@/components/listing-card";
import { OwnerActions } from "@/components/owner-actions";
import { DEAL_LABEL, VEHICLE_CLASS_LABEL, type VehicleClass } from "@/lib/constants";
import { formatNumber, formatPrice, timeAgo } from "@/lib/format";
import { landLabel } from "@/lib/listing-input";
import { getListing, locationLabel } from "@/lib/listings";
import { getCurrentUser } from "@/lib/session";

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
  if (l.status === "deleted" || ((l.status === "hidden" || l.status === "pending") && !isOwner)) notFound();

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
  const seller = d.sellerType === "dealer" && d.companyName ? d.companyName : d.sellerName || "Privātpersona";
  const unit = priceUnit(l.deal);

  return (
    <main className="wrap">
      {saglabats && isOwner && <p className="welcome">Sludinājums saglabāts{l.status === "active" ? " un redzams visiem" : ""}.</p>}
      {l.status === "sold" && <p className="alert">Šis sludinājums ir atzīmēts kā pārdots.</p>}
      {isOwner && <OwnerActions id={l.id} status={l.status} />}
      <div className="det">
        <Gallery photos={d.photos} title={l.title} placeholder={l.kind === "vehicle" ? "🚗" : "🏠"} />
        <div className="det-side">
          <h1>{l.title}</h1>
          <div className="det-price">
            {formatPrice(l.price)} {unit && <small>{unit}</small>}
          </div>
          <p className="meta">
            <span>📍 {locationLabel(d.place, d.region, d.regionKind)}</span>
            <span>Ievietots {timeAgo(l.createdAt)}</span>
          </p>
          <div className="panel seller">
            <b>{seller}</b>
            <span className="fine">
              {d.sellerType === "dealer" ? (l.kind === "vehicle" ? "Auto salons" : "Aģentūra") : "Privātpersona"}
              {d.sellerVerified ? " · ✔ identitāte apstiprināta" : ""}
            </span>
            {l.status === "active" && !isOwner && <ContactReveal id={l.id} />}
          </div>
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
