// Kļūdu žurnāls: servera kļūdas (src/instrumentation.ts → onRequestError) un pārlūka kļūdas (/api/errors).
// Līdzīgas kļūdas apvieno pēc "fingerprint" (avots + ziņa + pirmā steka rinda), lai tabula neaug bezgalīgi.
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";

const cut = (s: unknown, n: number) => (typeof s === "string" && s ? s.slice(0, n) : null);
/** Skaitļi, id un adreses ziņā atšķiras katru reizi: fingerprint tos neņem vērā. */
const norm = (s: string) => s.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "<id>").replace(/\d+/g, "<n>").replace(/https?:\/\/\S+/g, "<url>");

export type ErrorInput = { source: "server" | "client"; message: string; stack?: string | null; url?: string | null; digest?: string | null; userAgent?: string | null };

export async function recordError(e: ErrorInput) {
  try {
    const message = cut(e.message, 1000) ?? "Nezināma kļūda";
    const stack = cut(e.stack, 4000);
    const frame = stack?.split("\n").find((l) => /at |@/.test(l))?.trim() ?? "";
    const fingerprint = createHash("sha1").update(`${e.source}|${norm(message)}|${norm(frame)}`).digest("hex");
    await db
      .insert(schema.errorEvents)
      .values({ fingerprint, source: e.source, message, stack, url: cut(e.url, 500), digest: cut(e.digest, 100), userAgent: cut(e.userAgent, 300) })
      .onConflictDoUpdate({
        target: schema.errorEvents.fingerprint,
        set: { count: sql`${schema.errorEvents.count} + 1`, lastAt: sql`now()`, url: cut(e.url, 500), resolved: false },
      });
  } catch (err) {
    console.error("Neizdevās ierakstīt kļūdu žurnālā:", err);
  }
}

export async function recentErrors(limit = 100) {
  return db.select().from(schema.errorEvents).orderBy(sql`${schema.errorEvents.resolved}, ${schema.errorEvents.lastAt} desc`).limit(limit);
}
