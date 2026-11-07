"use server";
import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { REPORT_HIDE_THRESHOLD, REPORT_REASONS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

const { listings, reports } = schema;

export type ReportResult = { ok: true } | { ok: false; error: string; login?: true };

/**
 * Sūdzība par sludinājumu. Viens lietotājs var iesniegt vienu sūdzību par sludinājumu (atkārtoti tā tiek atjaunota).
 * Pēc REPORT_HIDE_THRESHOLD dažādu lietotāju atvērtām sūdzībām sludinājums tiek paslēpts līdz moderatora pārbaudei.
 */
export async function reportListing(listingId: string, reason: string, note: string): Promise<ReportResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Ielogojies, lai ziņotu.", login: true };
  if (!(reason in REPORT_REASONS)) return { ok: false, error: "Izvēlies iemeslu." };
  const cleanNote = String(note ?? "").trim().slice(0, 500) || null;

  const l = await db.query.listings.findFirst({ where: eq(listings.id, String(listingId)), columns: { id: true, userId: true, status: true } });
  if (!l || l.status === "deleted") return { ok: false, error: "Sludinājums nav atrasts." };
  if (l.userId === user.id) return { ok: false, error: "Par savu sludinājumu ziņot nevar." };

  const r = reason as keyof typeof REPORT_REASONS;
  await db
    .insert(reports)
    .values({ listingId: l.id, userId: user.id, reason: r, note: cleanNote })
    .onConflictDoUpdate({ target: [reports.listingId, reports.userId], set: { reason: r, note: cleanNote, status: "open", createdAt: new Date() } });

  const [{ n }] = await db.select({ n: count() }).from(reports).where(and(eq(reports.listingId, l.id), eq(reports.status, "open")));
  if (n >= REPORT_HIDE_THRESHOLD && l.status === "active") {
    await db.update(listings).set({ status: "pending" }).where(and(eq(listings.id, l.id), eq(listings.status, "active")));
  }
  return { ok: true };
}
