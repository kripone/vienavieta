"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { MAX_SAVED_SEARCHES, NOTIFY_FREQUENCIES, type NotifyFrequency } from "@/lib/constants";
import { verifyUnsubscribe } from "@/lib/notify";
import { describeSearch, normalizeFilters, parseSearch } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";
import { userHasPush } from "@/lib/push";

const { savedSearches, users } = schema;

export type SaveSearchResult = { ok: true; id: string; name: string } | { ok: false; error: string; login?: true };

/** Saglabā pašreizējo meklēšanu (ja tieši tāda jau ir, atgriež esošo). */
export async function saveSearch(raw: Record<string, string>): Promise<SaveSearchResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Ielogojies, lai saglabātu meklēšanu.", login: true };
  const filters = normalizeFilters(raw ?? {});
  const mine = await db.select().from(savedSearches).where(eq(savedSearches.userId, user.id));
  const key = JSON.stringify(Object.entries(filters).sort());
  const same = mine.find((m) => JSON.stringify(Object.entries(m.filters).sort()) === key);
  if (same) return { ok: true, id: same.id, name: same.name };
  if (mine.length >= MAX_SAVED_SEARCHES) return { ok: false, error: `Var saglabāt līdz ${MAX_SAVED_SEARCHES} meklēšanām. Izdzēs kādu sadaļā Paziņojumi.` };

  const name = await describeSearch(parseSearch(filters));
  const notifyPush = await userHasPush(user.id);
  const [row] = await db.insert(savedSearches).values({ userId: user.id, name, filters, frequency: "daily", notifyPush }).returning({ id: savedSearches.id });
  revalidatePath("/pazinojumi");
  return { ok: true, id: row.id, name };
}

export async function updateSearch(id: string, patch: { frequency?: string; notifyEmail?: boolean; notifyPush?: boolean; name?: string }) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };
  const set: Partial<typeof savedSearches.$inferInsert> = {};
  if (patch.frequency && (NOTIFY_FREQUENCIES as readonly string[]).includes(patch.frequency)) set.frequency = patch.frequency as NotifyFrequency;
  if (typeof patch.notifyEmail === "boolean") set.notifyEmail = patch.notifyEmail;
  if (typeof patch.notifyPush === "boolean") set.notifyPush = patch.notifyPush;
  if (typeof patch.name === "string" && patch.name.trim()) set.name = patch.name.trim().slice(0, 120);
  if (!Object.keys(set).length) return { ok: false as const };
  await db.update(savedSearches).set(set).where(and(eq(savedSearches.id, id), eq(savedSearches.userId, user.id)));
  revalidatePath("/pazinojumi");
  return { ok: true as const };
}

export async function deleteSearch(id: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };
  await db.delete(savedSearches).where(and(eq(savedSearches.id, id), eq(savedSearches.userId, user.id)));
  revalidatePath("/pazinojumi");
  return { ok: true as const };
}

export async function setPriceDrops(on: boolean) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };
  await db.update(users).set({ notifyPriceDrops: Boolean(on) }).where(eq(users.id, user.id));
  revalidatePath("/pazinojumi");
  return { ok: true as const };
}

export async function setPricePush(on: boolean) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };
  await db.update(users).set({ pushPriceDrops: Boolean(on) }).where(eq(users.id, user.id));
  revalidatePath("/pazinojumi");
  return { ok: true as const };
}

/** Atrakstīšanās no e-pasta saites (bez pieteikšanās; pārbauda parakstu). */
export async function unsubscribe(kind: string, id: string, token: string) {
  if (!verifyUnsubscribe(kind, id, token)) return { ok: false as const };
  if (kind === "s") await db.update(savedSearches).set({ notifyEmail: false }).where(eq(savedSearches.id, id));
  else await db.update(users).set({ notifyPriceDrops: false }).where(eq(users.id, id));
  return { ok: true as const };
}
