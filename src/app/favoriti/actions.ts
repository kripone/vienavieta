"use server";
import { and, eq, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { FAVORITE_NOTE_MAX, FAVORITE_STAGES } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/session";

const { favorites, listings, favoriteShares, shareReactions } = schema;

export type FavResult = { ok: true; on: boolean } | { ok: false; login?: true };

/** Pievieno vai noņem sludinājumu no favorītiem. */
export async function toggleFavorite(listingId: string): Promise<FavResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, login: true };
  if (typeof listingId !== "string" || listingId.length > 64) return { ok: false };

  const where = and(eq(favorites.userId, user.id), eq(favorites.listingId, listingId));
  const existing = await db.query.favorites.findFirst({ where });
  if (existing) {
    await db.delete(favorites).where(where);
  } else {
    const l = await db.query.listings.findFirst({ where: eq(listings.id, listingId), columns: { status: true, price: true } });
    if (!l || l.status === "deleted") return { ok: false };
    await db.insert(favorites).values({ userId: user.id, listingId, priceAtSave: l.price }).onConflictDoNothing();
  }
  revalidatePath("/favoriti");
  return { ok: true, on: !existing };
}

/** Saglabā privāto piezīmi un statusu pie favorīta. */
export async function saveFavoriteNote(listingId: string, note: string, stage: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || typeof listingId !== "string" || listingId.length > 64 || typeof note !== "string") return { ok: false };
  const st = (FAVORITE_STAGES as readonly string[]).includes(stage) ? stage : null;
  await db
    .update(favorites)
    .set({ note: note.trim().slice(0, FAVORITE_NOTE_MAX) || null, stage: st })
    .where(and(eq(favorites.userId, user.id), eq(favorites.listingId, listingId)));
  return { ok: true };
}

/** Izveido (vai atgriež esošo) kopīgošanas saiti favorītu sarakstam. */
export async function createShare(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const existing = await db.query.favoriteShares.findFirst({ where: and(eq(favoriteShares.userId, user.id), isNull(favoriteShares.revokedAt)) });
  if (!existing) await db.insert(favoriteShares).values({ userId: user.id, token: randomBytes(16).toString("base64url") });
  revalidatePath("/favoriti");
}

/** Atsauc kopīgošanas saiti: tā vairs nedarbojas, un citu atstātie komentāri tiek dzēsti. */
export async function revokeShare(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const rows = await db.update(favoriteShares).set({ revokedAt: new Date() }).where(and(eq(favoriteShares.userId, user.id), isNull(favoriteShares.revokedAt))).returning({ id: favoriteShares.id });
  for (const r of rows) await db.delete(shareReactions).where(eq(shareReactions.shareId, r.id));
  revalidatePath("/favoriti");
}

/** Saraksta īpašnieks dzēš cita atstātu vērtējumu vai komentāru. */
export async function deleteReaction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  if (!user || !id) return;
  const share = await db.query.favoriteShares.findFirst({ where: and(eq(favoriteShares.userId, user.id), isNull(favoriteShares.revokedAt)) });
  if (share) await db.delete(shareReactions).where(and(eq(shareReactions.id, id), eq(shareReactions.shareId, share.id)));
  revalidatePath("/favoriti");
}
