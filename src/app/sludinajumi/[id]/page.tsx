import { trTitle } from "@/i18n/content";
import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactReveal } from "@/components/contact-reveal";
import { FavButton } from "@/components/fav-button";
import { ReportButton } from "@/components/report-button";
import { Gallery } from "@/components/gallery";
import { ExtThumb } from "@/components/ext-thumb";
import { priceUnit } from "@/components/listing-card";
import { OwnerActions } from "@/components/owner-actions";
import { DEAL_LABEL, PROPERTY_PLURAL, SOURCE_LABEL, VEHICLE_CLASS_LABEL, type VehicleClass } from "@/lib/constants";
import { formatNumber, formatPrice, timeAgo } from "@/lib/format";
import { listingIll } from "@/lib/illustrations";
import { landLabel } from "@/lib/listing-input";
import { CompareToggle } from "@/components/compare";
import { EvalBadge } from "@/components/eval-badge";
import { alsoAt } from "@/lib/dedupe";
import { listingHistory } from "@/lib/history";
import { ListingMapLazy } from "@/components/listing-map-lazy";
import { JsonLd } from "@/components/json-ld";
import { appBase, langAlternates, propertyHref, regionName, vehicleHref, type Crumb } from "@/lib/seo";
import type { PropertyType } from "@/lib/constants";
import { PriceHistory } from "@/components/price-history";
import { dealsForListing } from "@/lib/vzd";
import { VzdDeals } from "@/components/vzd-deals";
import { priceEvals } from "@/lib/price-eval";
import { favoriteIds } from "@/lib/favorites";
import { fullLocation, getListing, locationLabel } from "@/lib/listings";
import { getCurrentUser, isModerator } from "@/lib/session";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saglabats?: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params;
  const d = await getListing(id).catch(() => null);
  if (!d || d.l.status === "deleted") return { title: (await getT()).t("Sludinājums nav atrasts") };
  const external = d.l.source !== "own";
  return {
    title: trTitle(d.l.title, (await getT()).t),
    description: `${formatPrice(d.l.price)} · ${fullLocation(d.l.address, d.place, d.region, d.regionKind)}`,
    alternates: external ? { canonical: `/sludinajumi/${d.l.id}` } : langAlternates(`/sludinajumi/${d.l.id}`, (await getT()).locale),
    // citu portālu sludinājumi ir tikai fakti + saite: meklētājos tos nerādām (indeksējam SEO lapas un pašu sludinājumus)
    robots: external || d.l.status !== "active" ? { index: false, follow: true } : undefined,
    openGraph: { images: d.photos[0] ? [d.photos[0].url] : d.l.externalThumbUrl ? [d.l.externalThumbUrl] : ["/og.png"] },
  };
}

export default async function ListingPage(props: Props) {
  const { t, lp, locale } = await getT();
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
          ["Vietu skaits", l.seats],
          ["Tehniskā apskate", l.inspectionUntil ? t("līdz {d}", { d: l.inspectionUntil }) : null],
        ]
      : [
          ["Īpašuma veids", l.propertyType],
          ["Darījums", l.deal ? DEAL_LABEL[l.deal] : null],
          ["Platība", l.areaM2 ? `${Number(l.areaM2)} m²` : null],
          ["Cena par m²", l.areaM2 && l.deal === "sell" ? `${formatNumber(Math.round(l.price / Number(l.areaM2)))} €` : null],
          ["Istabas", l.rooms],
          ["Stāvs", l.floor != null ? `${l.floor}${l.floors ? " / " + l.floors : ""}` : l.floors ? t("{n} stāvi", { n: l.floors }) : null],
          ["Zeme", l.landM2 ? landLabel(l.landM2) : null],
          ["Sērija", l.series],
          ["Mājas tips", l.material],
          ["Apkure", l.heating],
          ["Stāvoklis", l.condition],
          ["Būvēts", l.builtYear],
          ["Lietošanas mērķis", l.purpose],
          ["Ērtības", l.amenities.length ? l.amenities.map((a) => t(a)).join(", ") : null],
        ];
  const evaluation = (await priceEvals([l.id]).catch(() => new Map())).get(l.id);
  const elsewhere = (await alsoAt([{ id: l.id, groupKey: l.groupKey }]).catch(() => new Map())).get(l.id) ?? [];
  const history = await listingHistory({ id: l.id, price: l.price, createdAt: l.createdAt }).catch(() => null);
  const vzd = l.kind === "property" && l.propertyType === "Dzīvoklis" && l.deal === "sell" ? await dealsForListing(l).catch(() => null) : null;
  const isFav = user && !isOwner ? (await favoriteIds(user.id, [l.id])).has(l.id) : false;
  const seller = (d.sellerType === "dealer" || d.sellerType === "agency") && d.companyName ? d.companyName : d.sellerName || t("Privātpersona");
  const unit = priceUnit(l.deal, t);
  const ext = l.source !== "own" && l.externalUrl ? l.externalUrl : null;
  const src = SOURCE_LABEL[l.source] ?? l.source;

  // ceļš uz SEO lapām (iekšējās saites)
  const crumbs: Crumb[] = [];
  if (l.kind === "vehicle" && l.vehicleClass) {
    const root = vehicleHref(l.vehicleClass as VehicleClass);
    if (root) {
      crumbs.push({ name: l.vehicleClass === "car" ? "Auto" : "Moto", href: root });
      if (d.make) crumbs.push({ name: d.make, href: vehicleHref(l.vehicleClass as VehicleClass, d.make)! });
      if (d.make && d.model) crumbs.push({ name: trTitle(d.model, t), href: vehicleHref(l.vehicleClass as VehicleClass, d.make, d.model)! });
    }
  } else if (l.kind === "property") {
    crumbs.push({ name: "Īpašumi", href: "/ipasumi" });
    if (l.propertyType) {
      const pt = l.propertyType as PropertyType;
      const deal = l.deal === "rent" ? "rent" : "sell";
      crumbs.push({ name: t(PROPERTY_PLURAL[pt]), href: propertyHref(pt, deal) });
      if (d.region && d.regionCountry !== "LT") crumbs.push({ name: regionName(d.region, locale), href: propertyHref(pt, deal, d.region) });
    }
  }
  const ld = l.source === "own" && l.status === "active"
    ? {
        "@context": "https://schema.org",
        "@type": l.kind === "vehicle" && l.vehicleClass === "car" ? "Car" : "Product",
        name: l.title,
        url: `${appBase()}${lp(`/sludinajumi/${l.id}`)}`,
        ...(d.photos.length ? { image: d.photos.slice(0, 5).map((p: { url: string }) => (p.url.startsWith("http") ? p.url : `${appBase()}${p.url}`)) } : {}),
        ...(l.description ? { description: l.description.slice(0, 500) } : {}),
        ...(d.make ? { brand: { "@type": "Brand", name: d.make } } : {}),
        ...(d.model ? { model: d.model } : {}),
        ...(l.kind === "vehicle" && l.year ? { vehicleModelDate: String(l.year) } : {}),
        ...(l.kind === "vehicle" && l.mileageKm != null ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: l.mileageKm, unitCode: "KMT" } } : {}),
        offers: { "@type": "Offer", price: l.price, priceCurrency: "EUR", availability: "https://schema.org/InStock", url: `${appBase()}/sludinajumi/${l.id}`, itemCondition: "https://schema.org/UsedCondition" },
      }
    : null;

  return (
    <main className="wrap">
      {crumbs.length > 0 && (
        <nav className="crumbs" aria-label={t("Ceļš")}>
          <a href={lp("/")}>VienāVietā</a>
          {crumbs.map((c) => <span key={c.href}> › <a href={lp(c.href)}>{t(c.name)}</a></span>)}
        </nav>
      )}
      {crumbs.length > 0 && l.source === "own" && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ name: "VienāVietā", href: "/" }, ...crumbs].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${appBase()}${lp(c.href)}` })) }} />
      )}
      {ld && <JsonLd data={ld} />}
      {saglabats && isOwner && <p className="welcome">{l.status === "active" ? t("Sludinājums saglabāts un redzams visiem.") : t("Sludinājums saglabāts.")}</p>}
      {l.status === "sold" && <p className="alert">{t("Šis sludinājums ir atzīmēts kā pārdots.")}</p>}
      {l.status === "hidden" && (isOwner || isMod) && <p className="alert">{t("Sludinājumu paslēpis moderators, un citi to neredz.")}</p>}
      {l.status === "pending" && isMod && !isOwner && <p className="alert">{t("Paslēpts pēc lietotāju sūdzībām. Izlem sadaļā")} <a href="/moderacija">{t("Moderācija")}</a>.</p>}
      {l.status === "pending" && isOwner && <p className="alert">{t("Sludinājums ir paslēpts pēc vairāku lietotāju sūdzībām. Moderators to pārbaudīs, un pēc tam tas atkal būs redzams.")}</p>}
      {isOwner && <OwnerActions id={l.id} status={l.status} />}
      <div className="det">
        {!d.photos.length && l.source !== "own" && l.externalThumbUrl && process.env.EXTERNAL_THUMBS !== "off" ? (
          // ārējam sludinājumam: saraksta sīktēls no avota servera (lielākas bildes ir oriģinālajā sludinājumā)
          <div className="ext-hero">
            <ExtThumb src={l.externalThumbUrl} source={SOURCE_LABEL[l.source] ?? l.source} fallback={listingIll(l)} />
          </div>
        ) : (
          <Gallery photos={d.photos} title={l.title} placeholder={listingIll(l)} />
        )}
        <div className="det-side">
          <div className="det-title">
            <h1>{trTitle(l.title, t)}</h1>
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
            {(d.place || l.address) && <span>📍 {fullLocation(l.address, d.place, d.region, d.regionKind)}</span>}
            <span>{ext ? t("Pievienots {when}", { when: timeAgo(l.createdAt, t) }) : t("Ievietots {when}", { when: timeAgo(l.createdAt, t) })}</span>
          </p>
          {ext ? (
            <div className="panel seller">
              <b>{t("Sludinājums no {src}", { src })}</b>
              <p className="ext-note">
                {t("Šeit redzami tikai galvenie fakti. Bildes, aprakstu un pārdevēja kontaktus skaties oriģinālajā sludinājumā {src}.", { src })}
              </p>
              <a className="btn primary" href={ext} rel="nofollow noopener noreferrer">{t("Atvērt {src}", { src })} ↗</a>
            </div>
          ) : (
            <div className="panel seller">
              <b>{seller}</b>
              <span className="fine">
                {t(d.sellerType === "agency" ? "Aģentūra" : d.sellerType === "dealer" ? (l.kind === "vehicle" ? "Auto salons" : "Aģentūra") : "Privātpersona")}
                {d.sellerVerified ? ` · ✔ ${t("identitāte apstiprināta")}` : ""}
              </span>
              {l.status === "active" && !isOwner && <ContactReveal id={l.id} />}
              {l.feedId && l.externalUrl && /^https?:\/\//.test(l.externalUrl) && (
                <a className="fine" href={l.externalUrl} rel="nofollow noopener noreferrer">{t("Sludinājums salona mājaslapā")} ↗</a>
              )}
            </div>
          )}
          {elsewhere.length > 0 && (
            <div className="panel also-panel">
              <b>{t("Šis pats sludinājums arī:")}</b>
              <ul>
                {elsewhere.map((a: { id: string; source: string; url: string; price: number }) => (
                  <li key={a.id}>
                    {a.source === "own" ? (
                      <a href={lp(a.url)}>VienāVietā</a>
                    ) : (
                      <a href={a.url} rel="nofollow noopener noreferrer">{SOURCE_LABEL[a.source] ?? a.source} ↗</a>
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
          <h2>{t("Parametri")}</h2>
          <dl className="params">
            {rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => (
              <div key={k}>
                <dt>{t(k)}</dt>
                <dd>{typeof v === "string" ? t(v) : v}</dd>
              </div>
            ))}
          </dl>
        </section>
        {l.features.length > 0 && (
          <details className="feat-box">
            <summary>{t("Aprīkojums")} ({l.features.length})</summary>
            <div className="features">
              {Object.entries(
                l.features.reduce<Record<string, string[]>>((acc, f) => {
                  const [g, item] = f.includes("|") ? f.split("|") : ["Aprīkojums", f];
                  (acc[g] ??= []).push(item);
                  return acc;
                }, {}),
              ).map(([g, items]) => (
                <div key={g}>
                  <h3>{t(g)}</h3>
                  <ul>{items.map((i) => <li key={i}>{t(i)}</li>)}</ul>
                </div>
              ))}
            </div>
            {l.source !== "own" && <p className="fine">{t("Aprīkojums pēc pārdevēja norādītā {src}.", { src: SOURCE_LABEL[l.source] ?? l.source })}</p>}
          </details>
        )}
        {l.kind === "property" && l.lat != null && l.lon != null && <ListingMapLazy lat={l.lat} lon={l.lon} exact={l.geoPrecision === "street"} />}
        {vzd && <VzdDeals data={vzd} perM2={l.areaM2 ? Math.round(l.price / Number(l.areaM2)) : null} />}
        {history && <PriceHistory h={history} external={l.source !== "own"} />}
        {l.description && (
          <section>
            <h2>{t("Apraksts")}</h2>
            <p className="desc">{l.description}</p>
          </section>
        )}
      </div>
    </main>
  );
}
