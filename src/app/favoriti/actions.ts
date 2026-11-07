"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/session";

const { favorites, listings } = schema;

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
