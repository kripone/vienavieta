// Automātiski atrastās komplektācijas: saglabā kandidātus tabulā trim_names, aktivizē pēc TRIM_AUTO_MIN
// dažādiem sludinājumiem un ielādē aktīvās atpazīšanai (src/lib/trims.ts), filtram un formai (/api/catalog).
import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { TRIM_AUTO_MIN } from "./constants";
import { setDynamicTrims, trimCandidates } from "./trims";

export async function syncTrims() {
  const { trimNames } = schema;
  for (const c of trimCandidates()) {
    await db
      .insert(trimNames)
      .values({ make: c.make, name: c.name, seen: c.n })
      .onConflictDoUpdate({ target: [trimNames.make, trimNames.name], set: { seen: sql`greatest(${trimNames.seen}, ${c.n})` } });
  }
  const activated = await db
    .update(trimNames)
    .set({ active: true })
    .where(and(eq(trimNames.active, false), gte(trimNames.seen, TRIM_AUTO_MIN)))
    .returning({ make: trimNames.make, name: trimNames.name });
  if (activated.length) console.log("Jaunas komplektācijas:", activated.map((a) => `${a.make} ${a.name}`).join(", "));
  setDynamicTrims(await db.select({ make: trimNames.make, name: trimNames.name }).from(trimNames).where(eq(trimNames.active, true)));
}

/** Starts: ielādē aktīvās uzreiz, tad ik 10 min saglabā jaunos kandidātus. */
export function startTrimSync() {
  const run = () => syncTrims().catch((e) => console.error("[trims]", e));
  setTimeout(run, 30_000);
  setInterval(run, 10 * 60_000);
}
