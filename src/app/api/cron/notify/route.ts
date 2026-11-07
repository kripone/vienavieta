import { runNotifications } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Vienā procesā: neļaujam divām kārtām iet vienlaikus un biežāk kā reizi 5 minūtēs.
let running = false;
let lastRun = 0;

/**
 * Paziņojumu kārta. Izsauc GitHub Actions grafiks (.github/workflows/notify.yml).
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
    const result = await runNotifications();
    console.log("Paziņojumu kārta:", JSON.stringify(result));
    return Response.json(result);
  } catch (err) {
    console.error("Paziņojumu kārta neizdevās:", err);
    return Response.json({ error: "failed" }, { status: 500 });
  } finally {
    running = false;
  }
}

export const GET = handle;
export const POST = handle;
