"use server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { getCurrentUser, isModerator } from "@/lib/session";

const { listings, reports, sessions, users } = schema;

export type ModResult = { ok: true } | { ok: false; error: string };

async function moderator() {
  const user = await getCurrentUser();
  return isModerator(user) ? user! : null;
}

const done = (): ModResult => {
  revalidatePath("/moderacija");
  revalidatePath("/");
  return { ok: true };
};

/** Sūdzības nepamatotas: sūdzības noraida, paslēpto sludinājumu atjauno. */
export async function approveListing(listingId: string): Promise<ModResult> {
  if (!(await moderator())) return { ok: false, error: "Nav tiesību." };
  await db.transaction(async (tx) => {
    await tx.update(reports).set({ status: "dismissed" }).where(and(eq(reports.listingId, listingId), eq(reports.status, "open")));
    await tx.update(listings).set({ status: "active", updatedAt: new Date() }).where(and(eq(listings.id, listingId), inArray(listings.status, ["pending", "hidden"])));
  });
  return done();
}

/** Paslēpj sludinājumu (īpašnieks to redz, citi ne) un atzīmē sūdzības kā izskatītas. */
export async function hideListing(listingId: string): Promise<ModResult> {
  if (!(await moderator())) return { ok: false, error: "Nav tiesību." };
  await db.transaction(async (tx) => {
    await tx.update(reports).set({ status: "actioned" }).where(and(eq(reports.listingId, listingId), eq(reports.status, "open")));
    await tx.update(listings).set({ status: "hidden", updatedAt: new Date() }).where(and(eq(listings.id, listingId), inArray(listings.status, ["active", "pending", "sold"])));
  });
  return done();
}

/**
 * Bloķē lietotāju: viņš vairs nevar pieteikties (sesijas tiek dzēstas), visi viņa redzamie sludinājumi tiek paslēpti,
 * sūdzības par tiem atzīmētas kā izskatītas.
 */
export async function blockUser(userId: string): Promise<ModResult> {
  const me = await moderator();
  if (!me) return { ok: false, error: "Nav tiesību." };
  if (userId === me.id) return { ok: false, error: "Sevi bloķēt nevar." };
  const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!target) return { ok: false, error: "Lietotājs nav atrasts." };
  if (isModerator(target)) return { ok: false, error: "Moderatoru vai administratoru bloķēt nevar." };

  await db.transaction(async (tx) => {
    const own = tx.select({ id: listings.id }).from(listings).where(eq(listings.userId, userId));
    await tx.update(users).set({ blockedAt: new Date() }).where(eq(users.id, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.update(listings).set({ status: "hidden", updatedAt: new Date() }).where(and(eq(listings.userId, userId), inArray(listings.status, ["active", "pending", "sold"])));
    await tx.update(reports).set({ status: "actioned" }).where(and(inArray(reports.listingId, own), eq(reports.status, "open")));
  });
  return done();
}

/** Atbloķē lietotāju. Sludinājumi paliek paslēpti; tos var atjaunot atsevišķi. */
export async function unblockUser(userId: string): Promise<ModResult> {
  if (!(await moderator())) return { ok: false, error: "Nav tiesību." };
  await db.update(users).set({ blockedAt: null }).where(eq(users.id, userId));
  return done();
}

/** Kļūdu žurnāls: atzīmē visas kļūdas kā izskatītas (atkārtojoties tās atkal kļūst neizskatītas). */
export async function resolveErrors(): Promise<void> {
  if (!(await moderator())) return;
  await db.update(schema.errorEvents).set({ resolved: true }).where(eq(schema.errorEvents.resolved, false));
  revalidatePath("/moderacija");
}
