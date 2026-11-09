/** Izpildās vienreiz, kad serveris startē. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;
  const { checkStorage } = await import("./lib/storage");
  await checkStorage();
  // ss.com sarakstu ievākšana fonā (izslēdzama ar SS_CRAWL=off; izstrādē ieslēdz ar SS_CRAWL=on)
  const { startSsCrawler } = await import("./lib/importers/ss-scheduler");
  startSsCrawler();
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
