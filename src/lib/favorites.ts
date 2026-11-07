import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { cardFields } from "./listings";

const { favorites, listings, places, regions, priceHistory } = schema;

/** Kuri no dotajiem sludinājumiem ir lietotāja favorītos. */
export async function favoriteIds(userId: string, listingIds: string[]) {
  if (!listingIds.length) return new Set<string>();
  const rows = await db
    .select({ id: favorites.listingId })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), inArray(favorites.listingId, listingIds)));
  return new Set(rows.map((r) => r.id));
}

/** Cena brīdī, kad sludinājums pievienots favorītiem (vecākiem ierakstiem: no cenu vēstures). */
const priceWhenSaved = sql<number | null>`coalesce(${favorites.priceAtSave}, (select ${priceHistory.price} from ${priceHistory} where ${priceHistory.listingId} = ${listings.id} and ${priceHistory.changedAt} <= ${favorites.createdAt} order by ${priceHistory.changedAt} desc limit 1))`;

/** Lietotāja favorīti, jaunākie pirmie. Dzēstos un paslēptos nerāda. */
export async function favoriteListings(userId: string) {
  return db
    .select({ ...cardFields, savedAt: favorites.createdAt, priceWhenSaved })
    .from(favorites)
    .innerJoin(listings, eq(favorites.listingId, listings.id))
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .where(and(eq(favorites.userId, userId), notInArray(listings.status, ["deleted", "hidden", "pending"])))
    .orderBy(desc(favorites.createdAt));
}
