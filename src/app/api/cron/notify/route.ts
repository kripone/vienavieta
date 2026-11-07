import { importSsRss } from "@/lib/importers/ss-rss";
import { ssCrawlerEnabled } from "@/lib/importers/ss-scheduler";
import { runNotifications } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Vienā procesā: neļaujam divām kārtām iet vienlaikus un biežāk kā reizi 5 minūtēs.
let running = false;
let lastRun = 0;

/**
 * Stundas kārta: ārējo sludinājumu imports (ss.com RSS) un paziņojumi. Izsauc GitHub Actions grafiks (.github/workflows/notify.yml).
 * Ja iestatīts CRON_SECRET, pieprasījumam jābūt ar galveni "Authorization: Bearer <CRON_SECRET>".
 * Bez tā izsaukums ir drošs: e-pasti netiek sūtīti biežāk, kā atļauj katras meklēšanas biežums.
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (running) return Response.json({ skipped: "running" }, { status: 409 });
  if (Date.now() - lastRun < 5 * 60_000) return Response.json({ skipped: "too-soon" });
  running = true;
  lastRun = Date.now();
  try {
    // 1) ārējie sludinājumi: ja darbojas ss.com sarakstu ievākšana (ss-scheduler), RSS nav vajadzīgs;
    //    citādi RSS plūsmas kā rezerve (izslēdzams ar EXTERNAL_IMPORT=off)
    let imported: unknown = ssCrawlerEnabled() ? "ss.com sarakstu ievākšana darbojas fonā" : "off";
    if (!ssCrawlerEnabled() && process.env.EXTERNAL_IMPORT !== "off") {
      try {
        imported = await importSsRss();
        console.log("ss.com RSS imports:", JSON.stringify(imported));
      } catch (err) {
        imported = "failed";
        console.error("ss.com RSS imports neizdevās:", err);
      }
    }
    // 2) paziņojumi (ietver arī tikko ievāktos)
    const result = await runNotifications();
    console.log("Paziņojumu kārta:", JSON.stringify(result));
    return Response.json({ imported, ...result });
  } catch (err) {
    console.error("Paziņojumu kārta neizdevās:", err);
    return Response.json({ error: "failed" }, { status: 500 });
  } finally {
    running = false;
  }
}

export const GET = handle;
export const POST = handle;
