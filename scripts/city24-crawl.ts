// Lokāla city24.lv ievākšana (piem., no mājas datora). Render starter (512 MB) iet bojā
// no OOM, kad Playwright pārlūks skrien līdzās Next.js — tāpēc servisā CITY24_CRAWL=off.
// Raksta tieši ražošanas datubāzē; DATABASE_URL jābūt ar ĀRĒJO pieslēguma virkni
// (Render → Postgres → Connect → External), nevis iekšējo dpg-...-a adresi.
// ticks pats izlemj sadaļu un ātro/pilno kārtu pēc crawl_state (tāpat kā servera plānotājs).
// Palaišana: DATABASE_URL="postgresql://...?sslmode=no-verify" npx tsx scripts/city24-crawl.ts
import { closeBrowser, tickCity24 } from "../src/lib/importers/city24-pages";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("Nav DATABASE_URL");
  if (/-a(:\d+)?\//.test(url) || /-a\.[a-z0-9-]*\//.test(url) || url.includes("-a/")) {
    console.warn("UZMANĪBU: DATABASE_URL izskatās pēc iekšējās Render adreses — ārpus Render tā nestrādās. Lieto ārējo (External) virkni.");
  }
  // izpildām vairākas kārtas pēc kārtas (katrs tick apstrādā vienu sadaļu), līdz visas sadaļas apdarītas
  for (let i = 0; i < 6; i++) {
    const r = await tickCity24();
    if (!r) {
      if (i === 0) console.log("city24.lv: kārta vēl nav pienākusies (sk. crawl_state)");
      break;
    }
    console.log(`city24.lv ${r.section} ${r.mode}:`, JSON.stringify({ ...r, errors: r.errors.slice(0, 3), errorCount: r.errors.length }));
  }
  await closeBrowser().catch(() => {});
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
