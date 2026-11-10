import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import { db, schema } from "@/db";
import { auth } from "./auth";

/** Pašreizējais lietotājs no datubāzes vai null. Bloķētie lietotāji tiek uzskatīti par neielogotiem. */
export async function getCurrentUser() {
  const h = await headers(); // padara lapu dinamisku; šo kļūdu nedrīkst noķert
  let session;
  try {
    session = await auth.api.getSession({ headers: h });
  } catch (err) {
    unstable_rethrow(err);
    // Piem. nav iestatīts BETTER_AUTH_SECRET vai nav datubāzes: lapu rāda kā neielogotam
    console.error("Sesiju neizdevās pārbaudīt:", err instanceof Error ? err.message : err);
    return null;
  }
  if (!session) return null;
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, session.user.id) });
  if (!user || user.blockedAt) return null;
  return user;
}

/** Lapām, kurām vajag pieteikšanos: ja lietotājs nav ielogojies, pārsūta uz pieteikšanās lapu. */
export async function requireUser(nextPath: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/ielogoties?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Atļauj tikai drošus iekšējos ceļus pāradresācijai pēc pieteikšanās. */
export function safeNext(next: string | undefined | null, fallback = "/profils") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

type Who = { role: string; email: string };

/** E-pasti no ADMIN_EMAILS (atdalīti ar komatu) vienmēr ir administratori. */
const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/** Administrators: loma "admin" vai e-pasts ADMIN_EMAILS (piem., portālu partneru plūsmām /importi). */
export function isAdmin(user: Who | null | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || adminEmails().includes(user.email.toLowerCase());
}

export function isModerator(user: Who | null | undefined): boolean {
  if (!user) return false;
  return user.role === "moderator" || user.role === "admin" || adminEmails().includes(user.email.toLowerCase());
}

/** Moderācijas lapām: neielogotus sūta pieteikties, pārējiem lapa "neeksistē". */
export async function requireModerator(nextPath: string) {
  const user = await requireUser(nextPath);
  if (!isModerator(user)) notFound();
  return user;
}
