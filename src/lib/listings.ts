import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { mediaUrl } from "./storage";

const { listings, places, regions, makes, models, listingPhotos, users } = schema;

/** Pirmās bildes sīktēla atslēga katram sludinājumam (apakšvaicājums). */
const coverThumb = sql<string | null>`(select ${listingPhotos.thumbKey} from ${listingPhotos} where ${listingPhotos.listingId} = ${listings.id} order by ${listingPhotos.position} limit 1)`;
const photoCount = sql<number>`(select count(*)::int from ${listingPhotos} where ${listingPhotos.listingId} = ${listings.id})`;

export const cardFields = {
  id: listings.id,
  kind: listings.kind,
  status: listings.status,
  title: listings.title,
  price: listings.price,
  deal: listings.deal,
  createdAt: listings.createdAt,
  year: listings.year,
  mileageKm: listings.mileageKm,
  fuel: listings.fuel,
  gearbox: listings.gearbox,
  body: listings.body,
  vehicleClass: listings.vehicleClass,
  color: listings.color,
  groupKey: listings.groupKey,
  source: listings.source,
  externalUrl: listings.externalUrl,
  externalThumbUrl: listings.externalThumbUrl,
  makeId: listings.makeId,
  modelId: listings.modelId,
  placeId: listings.placeId,
  propertyType: listings.propertyType,
  rooms: listings.rooms,
  areaM2: listings.areaM2,
  landM2: listings.landM2,
  place: places.name,
  address: listings.address,
  region: regions.name,
  regionKind: regions.kind,
  thumbKey: coverThumb,
  photoCount,
};

export type ListingCard = Awaited<ReturnType<typeof latestListings>>[number];

/** Jaunākie aktīvie sludinājumi. */
export async function latestListings(limit = 50) {
  return db
    .select(cardFields)
    .from(listings)
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .where(eq(listings.status, "active"))
    .orderBy(desc(listings.createdAt))
    .limit(limit);
}

/** Lietotāja sludinājumi (bez dzēstajiem). */
export async function userListings(userId: string) {
  return db
    .select(cardFields)
    .from(listings)
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .where(and(eq(listings.userId, userId), ne(listings.status, "deleted")))
    .orderBy(desc(listings.updatedAt));
}

/** Viens sludinājums ar visiem datiem, bildēm un pārdevēju. */
export async function getListing(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db
    .select({
      l: listings,
      place: places.name,
      region: regions.name,
      regionCountry: regions.country,
      regionKind: regions.kind,
      make: makes.name,
      model: models.name,
      sellerName: users.name,
      sellerType: users.sellerType,
      companyName: users.companyName,
      sellerVerified: users.identityVerifiedAt,
      sellerSince: users.createdAt,
    })
    .from(listings)
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .leftJoin(makes, eq(listings.makeId, makes.id))
    .leftJoin(models, eq(listings.modelId, models.id))
    .leftJoin(users, eq(listings.userId, users.id))
    .where(eq(listings.id, id));
  if (!row) return null;
  const photos = await db.select().from(listingPhotos).where(eq(listingPhotos.listingId, id)).orderBy(asc(listingPhotos.position));
  return {
    ...row,
    // salona plūsmas sludinājumiem bildes no salona servera (neglabājam)
    photos: photos.length
      ? photos.map((p) => ({ id: p.id, url: mediaUrl(p.storageKey), thumbUrl: mediaUrl(p.thumbKey), width: p.width, height: p.height }))
      : row.l.remotePhotos.map((u, i) => ({ id: `r${i}`, url: u, thumbUrl: u, width: null, height: null })),
  };
}

/** Vietas grupētas pa novadiem formām (bez ciemiem). */
export async function regionOptions() {
  const rows = await db
    .select({ id: places.id, name: places.name, regionId: regions.id, region: regions.name, kind: regions.kind, country: regions.country })
    .from(places)
    .innerJoin(regions, eq(places.regionId, regions.id))
    // ciemus sarakstā nerādām (tie ietilpst pagastā); novadā vispirms pilsētas, tad pagasti
    .where(sql`coalesce(${places.kind}, '') <> 'village'`)
    .orderBy(asc(regions.country), asc(regions.id), sql`case ${places.kind} when 'town' then 0 when 'parish' then 2 else 1 end`, sql`case when ${places.kind} is null then ${places.id} else 0 end`, asc(places.name));
  const map = new Map<string, { regionId: number; region: string; kind: "city" | "municipality"; country: "LV" | "LT"; places: { id: number; name: string }[] }>();
  for (const r of rows) (map.get(r.region) ?? map.set(r.region, { regionId: r.regionId, region: r.region, kind: r.kind, country: r.country, places: [] }).get(r.region)!).places.push({ id: r.id, name: r.name });
  return [...map.values()];
}

/** Iela ar numuru no adreses ("Gaigalas 17, Āgenskalns, Rīga" → "Gaigalas 17"). */
export const streetOf = (address: string | null | undefined) => (address ? address.split(",")[0].trim() || null : null);

/** Vieta ar ielu: "Gaigalas 17, Rīga, Āgenskalns" (ja iela zināma). */
export function fullLocation(address: string | null | undefined, place: string | null, region: string | null, regionKind: string | null) {
  const loc = locationLabel(place, region, regionKind);
  const street = streetOf(address);
  return street && loc ? `${street}, ${loc}` : street ?? loc;
}

export function locationLabel(place: string | null, region: string | null, regionKind: string | null) {
  if (!place || !region) return "";
  return regionKind === "city" ? `${region}, ${place}` : `${place}, ${region.replace(" novads", " nov.").replace(" apskritis", " apskr.")}`;
}


type SimilarSource = {
  id: string; kind: string; price: number; groupKey: string | null; vehicleClass: string | null; makeId: number | null; modelId: number | null; year: number | null;
  propertyType: string | null; deal: string | null; placeId: number | null; areaM2: string | number | null;
};

/** Līdzīgi aktīvie sludinājumi: transportam tas pats modelis (vai marka), ±3 gadi; īpašumam tas pats veids un darījums
 *  tajā pašā vietā (vai reģionā), līdzīga platība. Abiem cena 0,6–1,5× un vistuvākā cena vispirms. */
export async function similarListings(l: SimilarSource, limit = 6) {
  const base = [
    eq(listings.status, "active"),
    ne(listings.id, l.id),
    eq(listings.kind, l.kind as "vehicle" | "property"),
    sql`${listings.price} between ${Math.floor(l.price * 0.6)} and ${Math.ceil(l.price * 1.5)}`,
    ...(l.groupKey ? [sql`${listings.groupKey} is distinct from ${l.groupKey}`] : []),
  ];
  const run = (extra: ReturnType<typeof sql>[]) =>
    db
      .select(cardFields)
      .from(listings)
      .leftJoin(places, eq(listings.placeId, places.id))
      .leftJoin(regions, eq(places.regionId, regions.id))
      .where(and(...base, ...extra))
      .orderBy(sql`abs(${listings.price} - ${l.price})`, desc(listings.createdAt))
      .limit(limit);
  const tries: ReturnType<typeof sql>[][] = [];
  if (l.kind === "vehicle") {
    const cls = l.vehicleClass ? [sql`${listings.vehicleClass} = ${l.vehicleClass}`] : [];
    const yr = l.year ? [sql`${listings.year} between ${l.year - 3} and ${l.year + 3}`] : [];
    if (l.modelId) tries.push([...cls, sql`${listings.modelId} = ${l.modelId}`, ...yr]);
    if (l.makeId) tries.push([...cls, sql`${listings.makeId} = ${l.makeId}`, ...yr]);
  } else {
    const area = Number(l.areaM2) || 0;
    const common = [
      ...(l.propertyType ? [sql`${listings.propertyType} = ${l.propertyType}`] : []),
      ...(l.deal ? [sql`${listings.deal} = ${l.deal}`] : []),
      ...(area ? [sql`${listings.areaM2} between ${Math.floor(area * 0.7)} and ${Math.ceil(area * 1.3)}`] : []),
    ];
    if (l.placeId) {
      tries.push([...common, sql`${listings.placeId} = ${l.placeId}`]);
      tries.push([...common, sql`${places.regionId} = (select region_id from places where id = ${l.placeId})`]);
    }
  }
  const seen = new Set<string>();
  const out: Awaited<ReturnType<typeof run>> = [];
  for (const extra of tries) {
    if (out.length >= limit) break;
    for (const r of await run(extra)) if (!seen.has(r.id) && out.length < limit) { seen.add(r.id); out.push(r); }
  }
  return out;
}
