// Lokāla autoplius.lt ievākšana (piem., no mājas datora, kura IP iet cauri Cloudflare —
// Render datu centra IP autoplius bloķē, tāpēc servisā AUTOPLIUS_CRAWL=off).
// Raksta tieši ražošanas datubāzē; DATABASE_URL jābūt ar ĀRĒJO pieslēguma virkni
// (Render → Postgres → Connect → External), nevis iekšējo dpg-...-a adresi.
// ticks pats izlemj ātro/pilno kārtu pēc crawl_state (tāpat kā servera plānotājs).
// Pilnā kārta pa gadu joslām var ilgt vairākas stundas — Postgres sesijas slēdze
// (pg_try_advisory_lock) neļauj nākamajam plānotāja palaišanas brīdim startēt otro instanci
// (withCrawlLock darbojas tikai viena procesa iekšienē). Slēdze atslēdzas, kad procesam mirst savienojums.
// Palaišana: DATABASE_URL="postgresql://...?sslmode=no-verify" npx tsx scripts/autoplius-crawl.ts
import { closeBrowser, tickAutoplius } from "../src/lib/importers/autoplius-pages";
import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("Nav DATABASE_URL");
  if (/-a(:\d+)?\//.test(url) || /-a\.[a-z0-9-]*\//.test(url) || url.includes("-a/")) {
    console.warn("UZMANĪBU: DATABASE_URL izskatās pēc iekšējās Render adreses — ārpus Render tā nestrādās. Lieto ārējo (External) virkni.");
  }
  const lock = await db.execute(sql`SELECT pg_try_advisory_lock(724301) AS got`);
  if (!(lock as unknown as { rows: { got: boolean }[] }).rows[0]?.got) {
    console.log("autoplius.lt: cita instance jau strādā — izlaižam šo palaišanu");
    process.exit(0);
  }
  try {
    const rs = await tickAutoplius();
    for (const r of rs ?? []) console.log(`autoplius.lt ${r.key} ${r.mode}:`, JSON.stringify({ ...r, key: undefined, errors: r.errors.slice(0, 3), errorCount: r.errors.length }));
    if (!rs) console.log("autoplius.lt: kārta vēl nav pienākusies (sk. crawl_state)");
  } finally {
    await closeBrowser().catch(() => {});
    await db.execute(sql`SELECT pg_advisory_unlock(724301)`).catch(() => {});
  }
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
