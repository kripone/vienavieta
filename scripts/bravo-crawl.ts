// Manuāla bravo-auto.lv ievākšana (serverī skrien plānotājs automātiski; šis manuālām pārbaudēm).
// Palaišana: DATABASE_URL="postgresql://...?sslmode=no-verify" npx tsx scripts/bravo-crawl.ts
import { tickBravo } from "../src/lib/importers/bravo-pages";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("Nav DATABASE_URL");
  const r = await tickBravo();
  if (!r) console.log("bravo-auto.lv: kārta vēl nav pienākusies (sk. crawl_state)");
  else console.log("bravo-auto.lv:", JSON.stringify({ ...r, errors: r.errors.slice(0, 3), errorCount: r.errors.length }));
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
