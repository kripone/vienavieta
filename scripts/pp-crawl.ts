// Lokāla pp.lv ievākšana (publiskais JSON API — bez pārlūka; var palaist arī serverī).
// Raksta tieši ražošanas datubāzē; DATABASE_URL jābūt ar ĀRĒJO pieslēguma virkni
// (Render → Postgres → Connect → External), nevis iekšējo dpg-...-a adresi.
// tickPp pats izlemj ātro/pilno kārtu pa kategorijām pēc crawl_state (tāpat kā servera plānotājs).
// Palaišana: DATABASE_URL="postgresql://...?sslmode=no-verify" npx tsx scripts/pp-crawl.ts
import { tickPp } from "../src/lib/importers/pp-pages";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("Nav DATABASE_URL");
  if (/-a(:\d+)?\//.test(url) || /-a\.[a-z0-9-]*\//.test(url) || url.includes("-a/")) {
    console.warn("UZMANĪBU: DATABASE_URL izskatās pēc iekšējās Render adreses — ārpus Render tā nestrādās. Lieto ārējo (External) virkni.");
  }
  // izpildām vairākas kārtas pēc kārtas, līdz visas kategorijas apdarītas (tick apstrādā vienu)
  for (let i = 0; i < 12; i++) {
    const r = await tickPp();
    if (!r) break;
    console.log(`pp.lv ${r.section} ${r.mode}:`, JSON.stringify({ ...r, section: undefined, errors: r.errors.slice(0, 3), errorCount: r.errors.length }));
  }
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
