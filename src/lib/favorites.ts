import { and, asc, desc, eq, inArray, isNull, notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { cardFields } from "./listings";

const { favorites, listings, places, regions, priceHistory, favoriteShares, shareReactions, users } = schema;

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
    .select({ ...cardFields, savedAt: favorites.createdAt, priceWhenSaved, note: favorites.note, stage: favorites.stage })
    .from(favorites)
    .innerJoin(listings, eq(favorites.listingId, listings.id))
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .where(and(eq(favorites.userId, userId), notInArray(listings.status, ["deleted", "hidden", "pending"])))
    .orderBy(desc(favorites.createdAt));
}

// ---------- saraksta kopīgošana ar saiti (/saraksts/<token>) ----------

/** Lietotāja aktīvā kopīgošanas saite (vai null). */
export async function activeShare(userId: string) {
  return (await db.query.favoriteShares.findFirst({ where: and(eq(favoriteShares.userId, userId), isNull(favoriteShares.revokedAt)) })) ?? null;
}

/** Kopīgotais saraksts pēc saites: īpašnieka vārds un sludinājumi (bez privātajām piezīmēm). */
export async function sharedList(token: string) {
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(token)) return null;
  const share = (await db
    .select({ id: favoriteShares.id, userId: favoriteShares.userId, owner: users.name })
    .from(favoriteShares)
    .innerJoin(users, eq(users.id, favoriteShares.userId))
    .where(and(eq(favoriteShares.token, token), isNull(favoriteShares.revokedAt))))[0];
  if (!share) return null;
  const rows = await db
    .select(cardFields)
    .from(favorites)
    .innerJoin(listings, eq(favorites.listingId, listings.id))
    .leftJoin(places, eq(listings.placeId, places.id))
    .leftJoin(regions, eq(places.regionId, regions.id))
    .where(and(eq(favorites.userId, share.userId), notInArray(listings.status, ["deleted", "hidden", "pending"]), sql`coalesce(${favorites.stage}, '') <> 'rejected'`))
    .orderBy(desc(favorites.createdAt));
  return { share, rows };
}

export type Reaction = { id: string; listingId: string; name: string; vote: string | null; comment: string | null; at: string; mine?: boolean };
/** Visi vērtējumi un komentāri kopīgotajam sarakstam, vecākie pirmie. */
export async function shareReactionRows(shareId: string, visitorKey?: string): Promise<Reaction[]> {
  const rows = await db.select().from(shareReactions).where(eq(shareReactions.shareId, shareId)).orderBy(asc(shareReactions.createdAt));
  return rows.map((r) => ({ id: r.id, listingId: r.listingId, name: r.name, vote: r.vote, comment: r.comment, at: r.updatedAt.toISOString(), mine: visitorKey ? r.visitorKey === visitorKey : undefined }));
}
