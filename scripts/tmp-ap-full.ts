import { crawlAutoplius, AP_TARGETS, closeBrowser } from "../src/lib/importers/autoplius-pages";
(async () => {
  for (const t of AP_TARGETS) {
    const r = await crawlAutoplius("full", t);
    console.log(t.key, JSON.stringify({ ...r, errors: r.errors.slice(0, 3), errorCount: r.errors.length }));
  }
  await closeBrowser().catch(() => {});
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
