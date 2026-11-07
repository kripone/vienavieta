import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
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
