// Brīvā teksta meklēšana: /mekle?q=… → vispirms mēģina saprast ar Gemini AI (src/lib/ai-chat.ts),
// neveiksmes gadījumā — lokālais noteikumu parsētājs (src/lib/text-query.ts) → pāradresē uz "/" ar filtriem.
// tq = lietotāja teksts (rādām virs rezultātiem), tn = piezīmes, tu = nesaprastie vārdi.
import { NextResponse, type NextRequest } from "next/server";
import { parseTextQuery, textQueryCatalog } from "@/lib/text-query";
import { aiTextToQuery } from "@/lib/ai-chat";
import { MEKLE_AI_DAILY_MAX, MEKLE_AI_PER_IP_DAY } from "@/lib/constants";

// Gemini izsaukumi maksā/izsmeļ kvotu: limits atmiņā (uz adresi un kopā dienā). Virs limita — lokālais parsētājs.
const DAY = 86_400_000;
const hits = new Map<string, { at: number; n: number }>();
let total = { at: Date.now(), n: 0 };

function aiAllowed(ip: string): boolean {
  const now = Date.now();
  if (now - total.at > DAY) total = { at: now, n: 0 };
  if (total.n >= MEKLE_AI_DAILY_MAX) return false;
  const h = hits.get(ip);
  if (!h || now - h.at > DAY) {
    hits.set(ip, { at: now, n: 1 });
    if (hits.size > 5000) hits.delete(hits.keys().next().value!);
  } else if (++h.n > MEKLE_AI_PER_IP_DAY) return false;
  total.n++;
  return true;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 200);
  const prefix = req.headers.get("x-url-locale") ? `/${req.headers.get("x-url-locale")}` : "";
  const base = process.env.APP_URL || req.nextUrl.origin;
  if (!q) return NextResponse.redirect(`${base}${prefix || "/"}`, 303);

  // 1) AI (Gemini): saprot dabisko valodu, rādiusus, ērtības, arī cenu kritumus/tirgu/darījumus/novērtējumu
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  if (process.env.GEMINI_API_KEY && aiAllowed(ip)) {
    try {
      const ai = await aiTextToQuery(q);
      if (ai?.redirect) return NextResponse.redirect(`${base}${prefix}${ai.redirect}`, 303);
      if (ai?.params && Object.keys(ai.params).length) {
        const p = new URLSearchParams(ai.params);
        p.set("tq", q);
        return NextResponse.redirect(`${base}${prefix}/?${p}`, 303);
      }
    } catch (err) {
      console.error("AI teksta meklēšana neizdevās (krītam uz lokālo parsētāju):", err);
    }
  }

  // 2) Lokālais noteikumu parsētājs (rezerves variants)
  const p = new URLSearchParams();
  try {
    const r = parseTextQuery(q, await textQueryCatalog());
    for (const [k, v] of Object.entries(r.params)) p.set(k, v);
    if (r.notes.length) p.set("tn", r.notes.join(","));
    if (r.unknown.length) p.set("tu", r.unknown.slice(0, 6).join(" ").slice(0, 80));
    // neko nesapratām: parastā meklēšana pēc vārda virsrakstā
    if (!Object.keys(r.params).length) p.set("q", q.slice(0, 80));
  } catch (err) {
    console.error("Teksta meklēšana neizdevās:", err);
    p.set("q", q.slice(0, 80));
  }
  p.set("tq", q);
  return NextResponse.redirect(`${base}${prefix}/?${p}`, 303);
}
