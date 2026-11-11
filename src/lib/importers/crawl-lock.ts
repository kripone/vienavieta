// Vienkārša rinda pārlūku crawleriem (autoplius.lt, city24.lv): nedrīkst darboties vienlaikus,
// jo katrs chromium patērē ~200–300 MB, bet Render starter instancē ir 512 MB (divi reizē = OOM restarts).
let tail: Promise<unknown> = Promise.resolve();

/** Izpilda fn tikai tad, kad iepriekšējais ar šo slēdzeni ieliktais darbs beidzies (arī ar kļūdu). */
export function withCrawlLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  tail = run.catch(() => {});
  return run;
}
