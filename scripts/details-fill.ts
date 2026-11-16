// Lokālā detaļu (aprīkojuma/ērtību) nolasīšana autoplius.lt un city24.lv sludinājumiem.
// Render starter (512 MB) iet bojā no OOM, kad Playwright pārlūks skrien līdzās Next.js —
// tāpēc serverī AP_DETAILS=off / C24_DETAILS=off, un detaļas lasa šis skripts no mājas datora.
// Abas cilpas skrien SECĪGI (vienlaikus tikai viens pārlūks) un ik pēc partijas pārlūks aizveras.
// Palaišana: DATABASE_URL="postgresql://...?sslmode=no-verify" npx tsx scripts/details-fill.ts
import { closeApDetailsBrowser, fillAutopliusDetails } from "../src/lib/importers/autoplius-details";
import { closeC24DetailsBrowser, fillCity24Details } from "../src/lib/importers/city24-details";

const BATCHES = 20; // 20 × 25 = līdz 500 sludinājumiem katram avotam vienā palaišanā (autoplius pilnā seguma dēļ rinda ir liela)

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("Nav DATABASE_URL");
  for (let i = 0; i < BATCHES; i++) {
    const ap = await fillAutopliusDetails().catch((e) => (console.error("autoplius.lt detaļas:", e instanceof Error ? e.message : e), null));
    if (ap && (ap.features || ap.errors || ap.gone)) console.log("autoplius.lt detaļas:", JSON.stringify(ap));
    await closeApDetailsBrowser().catch(() => {});
    const c24 = await fillCity24Details().catch((e) => (console.error("city24.lv detaļas:", e instanceof Error ? e.message : e), null));
    if (c24 && (c24.filled || c24.errors)) console.log("city24.lv detaļas:", JSON.stringify(c24));
    await closeC24DetailsBrowser().catch(() => {});
    if (!ap && !c24) break; // vairs nav ko lasīt
  }
}
main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
