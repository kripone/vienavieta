/** Izpildās vienreiz, kad serveris startē. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;
  const { checkStorage } = await import("./lib/storage");
  await checkStorage();
  // ss.com sarakstu ievākšana fonā (izslēdzama ar SS_CRAWL=off; izstrādē ieslēdz ar SS_CRAWL=on)
  const { startSsCrawler } = await import("./lib/importers/ss-scheduler");
  startSsCrawler();
}
