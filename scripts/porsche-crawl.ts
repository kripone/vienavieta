// Lokāla finder.porsche.com ievākšana (Vercel bot aizsardzība — vajag reālu pārlūku, tāpēc ne serverī).
// Raksta tieši ražošanas datubāzē; DATABASE_URL jābūt ar ĀRĒJO pieslēguma virkni.
// Palaišana: DATABASE_URL="postgresql://...?sslmode=no-verify" npx tsx scripts/porsche-crawl.ts
import { closeBrowser, tickPorsche } from "../src/lib/importers/porsche-pages";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("Nav DATABASE_URL");
  if (/-a(:\d+)?\//.test(url) || /-a\.[a-z0-9-]*\//.test(url) || url.includes("-a/")) {
    console.warn("UZMANĪBU: DATABASE_URL izskatās pēc iekšējās Render adreses — ārpus Render tā nestrādās. Lieto ārējo (External) virkni.");
  }
  const r = await tickPorsche();
  if (!r) console.log("finder.porsche.com: kārta vēl nav pienākusies (sk. crawl_state)");
  else console.log("finder.porsche.com:", JSON.stringify({ ...r, errors: r.errors.slice(0, 3), errorCount: r.errors.length }));
  await closeBrowser().catch(() => {});
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
