/** Izpildās vienreiz, kad serveris startē. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;
  const { checkStorage } = await import("./lib/storage");
  await checkStorage();
  // ss.com sarakstu ievākšana fonā (izslēdzama ar SS_CRAWL=off; izstrādē ieslēdz ar SS_CRAWL=on)
  const { startSsCrawler } = await import("./lib/importers/ss-scheduler");
  startSsCrawler();
  // jaunas komplektācijas no portāliem: saglabā un aktivizē automātiski (src/lib/trims-db.ts)
  const { startTrimSync } = await import("./lib/trims-db");
  startTrimSync();
  // acīmredzamie dublikāti (atkārtoti ielikti sludinājumi) – 2 min pēc starta, tad ik stundu
  const { groupExactDuplicates, normalizeBodies } = await import("./lib/dedupe");
  const { fixCityPlaces } = await import("./lib/city-places");
  const dedupe = async () => {
    // apkaimes pēc koordinātām / „tikai pilsēta” (nevis „Centrs”) – pirms dublikātiem, jo tie grupē pēc pilsētas
    await fixCityPlaces().then((r) => r.moved && console.log("Vietas precizētas:", r)).catch((e) => console.error("Vietu kārta:", e));
    await groupExactDuplicates().then((r) => (r.vehicles || r.properties) && console.log("Dublikāti sagrupēti:", r)).catch((e) => console.error("Dublikātu kārta:", e));
    await normalizeBodies().then((n) => n && console.log("Virsbūves tips no modeļa:", n)).catch((e) => console.error("Virsbūvju kārta:", e));
  };
  setTimeout(() => { void dedupe(); setInterval(() => void dedupe(), 60 * 60_000); }, 2 * 60_000);
  // IndexNow: reizi dienā paziņo Bing par jaunām sitemap lapām (izslēdzams ar INDEXNOW=off)
  const { startIndexNowDaily } = await import("./lib/indexnow");
  startIndexNowDaily();
  // Vecās sēriju vērtības (portālu saīsinājumi) → mūsu SERIES; idempotents, pēc normalizēšanas neko nedara
  import("./lib/series-stats").then((m) => m.normalizeStoredSeries()).catch((e) => console.error("[series]", e));
  // Pēc starta „sasildām” galvenās lapas, lai pirmais apmeklētājs vai meklētāja robots negaida uz tukšiem kešiem
  if (process.env.NODE_ENV === "production" && process.env.WARMUP !== "off") {
    const { WARMUP_PATHS } = await import("./lib/constants");
    const base = `http://127.0.0.1:${process.env.PORT || 3000}`;
    const warm = async () => {
      for (const p of WARMUP_PATHS) {
        await fetch(base + p, { headers: { "user-agent": "VienaVieta-warmup" } }).then((r) => r.arrayBuffer()).catch(() => {});
      }
    };
    // pēc starta un tad ik 30 min (kešs pēc 6 h kļūst nederīgs; naktī bez apmeklētājiem rīta pirmais gaidītu sekundes)
    setTimeout(() => { void warm(); setInterval(() => void warm(), 30 * 60_000); }, 20_000);
  }
}

/** Servera kļūdas (lapas, server actions, API) → kļūdu žurnāls (src/lib/errors.ts). */
export async function onRequestError(err: unknown, request: { path: string; method: string; headers: Record<string, string | string[] | undefined> }, context: { routePath?: string; routeType?: string }) {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;
  const e = err as Error & { digest?: string };
  // Next iekšējie signāli (pāradresācija, notFound, dinamiskā renderēšana) nav kļūdas
  if (typeof e?.digest === "string" && /^(NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK|DYNAMIC_SERVER_USAGE|BAILOUT_TO_CLIENT_SIDE_RENDERING)/.test(e.digest)) return;
  const { recordError } = await import("./lib/errors");
  const ua = request.headers["user-agent"];
  await recordError({
    source: "server",
    message: `${e?.message ?? String(err)}${context.routePath ? ` [${context.routeType ?? ""} ${context.routePath}]` : ""}`,
    stack: e?.stack,
    url: `${request.method} ${request.path}`,
    digest: e?.digest,
    userAgent: Array.isArray(ua) ? ua[0] : ua,
  });
}
