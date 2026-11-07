import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

const { listings, places, regions, makes, models } = schema;

/** Jaunākie aktīvie sludinājumi ar vietu un marku/modeli. */
export async function latestListings(limit = 50) {
  return db
    .select({
      id: listings.id,
      kind: listings.kind,
      title: listings.title,
      price: listings.price,
      deal: listings.deal,
      createdAt: listings.createdAt,
      year: listings.year,
      mileageKm: listings.mileageKm,
      fuel: listings.fuel,
      gearbox: listings.gearbox,
      propertyType: listings.propertyType,
      rooms: listings.rooms,
      areaM2: listings.areaM2,
      make: makes.name,
      model: models.name,
      place: places.name,
      region: regions.name,
      regionKind: regions.kind,
    })
    .from(listings)
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .leftJoin(makes, eq(listings.makeId, makes.id))
    .leftJoin(models, eq(listings.modelId, models.id))
    .where(and(eq(listings.status, "active")))
    .orderBy(desc(listings.createdAt))
    .limit(limit);
}

export function locationLabel(place: string | null, region: string | null, regionKind: string | null) {
  if (!place || !region) return "";
  return regionKind === "city" ? `${region}, ${place}` : `${place}, ${region.replace(" novads", " nov.")}`;
}
