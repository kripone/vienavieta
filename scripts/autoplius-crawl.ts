// Lokāla autoplius.lt ievākšana (piem., no mājas datora, kura IP iet cauri Cloudflare —
// Render datu centra IP autoplius bloķē, tāpēc servisā AUTOPLIUS_CRAWL=off).
// Raksta tieši ražošanas datubāzē; DATABASE_URL jābūt ar ĀRĒJO pieslēguma virkni
// (Render → Postgres → Connect → External), nevis iekšējo dpg-...-a adresi.
// ticks pats izlemj ātro/pilno kārtu pēc crawl_state (tāpat kā servera plānotājs).
// Palaišana: DATABASE_URL="postgresql://...?sslmode=no-verify" npx tsx scripts/autoplius-crawl.ts
import { closeBrowser, tickAutoplius } from "../src/lib/importers/autoplius-pages";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("Nav DATABASE_URL");
  if (/-a(:\d+)?\//.test(url) || /-a\.[a-z0-9-]*\//.test(url) || url.includes("-a/")) {
    console.warn("UZMANĪBU: DATABASE_URL izskatās pēc iekšējās Render adreses — ārpus Render tā nestrādās. Lieto ārējo (External) virkni.");
  }
  const rs = await tickAutoplius();
  for (const r of rs ?? []) console.log(`autoplius.lt ${r.key} ${r.mode}:`, JSON.stringify({ ...r, key: undefined, errors: r.errors.slice(0, 3), errorCount: r.errors.length }));
  if (!rs) console.log("autoplius.lt: kārta vēl nav pienākusies (sk. crawl_state)");
  await closeBrowser().catch(() => {});
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
