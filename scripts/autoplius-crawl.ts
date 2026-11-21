// Lokāla autoplius.lt ievākšana (piem., no mājas datora, kura IP iet cauri Cloudflare —
// Render datu centra IP autoplius bloķē, tāpēc servisā AUTOPLIUS_CRAWL=off).
// Raksta tieši ražošanas datubāzē; DATABASE_URL jābūt ar ĀRĒJO pieslēguma virkni
// (Render → Postgres → Connect → External), nevis iekšējo dpg-...-a adresi.
// ticks pats izlemj ātro/pilno kārtu pēc crawl_state (tāpat kā servera plānotājs).
// Pilnā kārta pa gadu joslām var ilgt vairākas stundas — Postgres sesijas slēdze
// (pg_try_advisory_lock) neļauj nākamajam plānotāja palaišanas brīdim startēt otro instanci
// (withCrawlLock darbojas tikai viena procesa iekšienē).
// SVARĪGI: slēdze jātur uz ATSEVIŠĶA pg Client, nevis uz kopējā poola — poola dīkstāves
// savienojumi tiek aizvērti pēc ~10 s (node-postgres noklusējums), tātad sesijas līmeņa
// slēdze pazustu jau kārtas sākumā un paralēlās instances sāktu dublēt darbu (2026-11-21
// novērotas 3 vienlaicīgas instances → Cloudflare rate-limit un tukšas kārtas).
// Keep-alive ik minūti, lai stundu garās pilnajās kārtās vidējsēdis nenogrieztu slēdzes sesiju.
// Palaišana: DATABASE_URL="postgresql://...?sslmode=no-verify" npx tsx scripts/autoplius-crawl.ts
import { Client } from "pg";
import { closeBrowser, tickAutoplius } from "../src/lib/importers/autoplius-pages";

const LOCK_ID = 724301;

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("Nav DATABASE_URL");
  if (/-a(:\d+)?\//.test(url) || /-a\.[a-z0-9-]*\//.test(url) || url.includes("-a/")) {
    console.warn("UZMANĪBU: DATABASE_URL izskatās pēc iekšējās Render adreses — ārpus Render tā nestrādās. Lieto ārējo (External) virkni.");
  }
  // dedikēts savienojums slēdzei: paliek atvērts, kamēr process dzīvs (nav poola dīkstāves slēgšanas)
  const lock = new Client({ connectionString: url });
  await lock.connect();
  const got = await lock.query<{ got: boolean }>("SELECT pg_try_advisory_lock($1) AS got", [LOCK_ID]);
  if (!got.rows[0]?.got) {
    console.log("autoplius.lt: cita instance jau strādā — izlaižam šo palaišanu");
    await lock.end();
    process.exit(0);
  }
  const keepAlive = setInterval(() => {
    lock.query("SELECT 1").catch(() => {});
  }, 60_000);
  try {
    const rs = await tickAutoplius();
    for (const r of rs ?? []) console.log(`autoplius.lt ${r.key} ${r.mode}:`, JSON.stringify({ ...r, key: undefined, errors: r.errors.slice(0, 3), errorCount: r.errors.length }));
    if (!rs) console.log("autoplius.lt: kārta vēl nav pienākusies (sk. crawl_state)");
  } finally {
    clearInterval(keepAlive);
    await closeBrowser().catch(() => {});
    await lock.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
    await lock.end().catch(() => {});
  }
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
