// Iknedēļas seguma pārbaude: mūsu aktīvo sludinājumu skaits pret portāla faktisko
// (h1 "… (N)") pa klasēm. Ja atkāpe > 5 %, sūta Telegram brīdinājumu administratoram.
// Palaižas kopā ar pārējiem uzdevumiem; pats izlaižas, ja kopš pēdējās pārbaudes < 7 dienu.
// Palaišana: DATABASE_URL="..." TELEGRAM_BOT_TOKEN="..." ADMIN_TG_CHAT="..." npx tsx scripts/coverage-check.ts
import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { AP_TARGETS, browserFetch, closeBrowser, parseListPage } from "../src/lib/importers/autoplius-pages";

const { listings, crawlState } = schema;
const WEEK_MS = 7 * 86_400_000;
const TOLERANCE = 0.05;
const CLASS_LABEL: Record<string, string> = { car: "Auto", moto: "Moto", camper: "Kemperi" };

async function sendTG(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.ADMIN_TG_CHAT;
  if (!token || !chat) return console.warn("Telegram nav iestatīts, ziņa:", text.slice(0, 300));
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
}

async function main() {
  // nedēļas vārti
  const st = await db.select().from(crawlState).where(eq(crawlState.name, "coverage:autoplius"));
  if (st[0]?.lastFullAt && Date.now() - st[0].lastFullAt.getTime() < WEEK_MS && !process.env.COVERAGE_FORCE) {
    console.log("seguma pārbaude: izlaista (kopš pēdējās < 7d)");
    return;
  }

  // portāla faktiskie skaitļi pa klasēm (katra bandas 1. lapas h1 kopskaits)
  const portal: Record<string, number> = { car: 0, moto: 0, camper: 0 };
  const errors: string[] = [];
  try {
    for (const t of AP_TARGETS) {
      try {
        const { total } = parseListPage(await browserFetch(t.url));
        if (total) portal[t.vc] = (portal[t.vc] ?? 0) + total;
        else errors.push(`${t.key}: nav h1 kopskaita`);
      } catch (e) {
        errors.push(`${t.key}: ${e instanceof Error ? e.message : e}`);
      }
    }
  } finally {
    await closeBrowser().catch(() => {});
  }

  // mūsu skaitļi pa klasēm
  const oursRows = await db
    .select({ vc: listings.vehicleClass, c: count() })
    .from(listings)
    .where(and(eq(listings.source, "autoplius.lt"), eq(listings.status, "active")))
    .groupBy(listings.vehicleClass);
  const ours: Record<string, number> = {};
  for (const r of oursRows) if (r.vc) ours[r.vc] = r.c;

  const lines: string[] = [];
  let worst = 0;
  for (const vc of Object.keys(CLASS_LABEL)) {
    const p = portal[vc] ?? 0;
    const o = ours[vc] ?? 0;
    if (!p) continue;
    const dev = (o - p) / p;
    worst = Math.max(worst, Math.abs(dev));
    lines.push(`${CLASS_LABEL[vc]}: mums ${o} / portālā ${p} (${dev >= 0 ? "+" : ""}${(dev * 100).toFixed(1)} %)`);
  }
  console.log("segums:", lines.join(" | "), errors.length ? `| kļūdas: ${errors.join("; ")}` : "");

  if (worst > TOLERANCE) {
    await sendTG(`⚠️ <b>autoplius seguma atkāpe &gt; 5 %</b>\n${lines.join("\n")}${errors.length ? `\nKļūdas: ${errors.join("; ")}` : ""}`);
  }

  await db
    .insert(crawlState)
    .values({ name: "coverage:autoplius", lastFullAt: new Date(), lastResult: { portal, ours, errors } as unknown as Record<string, unknown> })
    .onConflictDoUpdate({ target: crawlState.name, set: { lastFullAt: new Date(), lastResult: { portal, ours, errors } as unknown as Record<string, unknown> } });
}

main().then(() => process.exit(0), (e) => (console.error(e), process.exit(1)));
