import { NextResponse } from "next/server";
import { runAssistant, type ChatMsg } from "@/lib/ai-chat";

export const dynamic = "force-dynamic";

// Vienkāršs atmiņas limits: 20 AI pieprasījumi dienā uz IP (bezmaksas Gemini kvotas un izmaksu aizsardzībai).
const DAY = 86_400_000;
const LIMIT = 20;
const hits = new Map<string, { at: number; n: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > DAY) {
    hits.set(ip, { at: now, n: 1 });
    if (hits.size > 5000) hits.delete(hits.keys().next().value!);
    return false;
  }
  h.n++;
  return h.n > LIMIT;
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "AI palīgs pagaidām nav pieejams." }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Šodienas sarunu limits izsmelts (20/dienā). Pamēģini rīt!" }, { status: 429 });

  let body: { message?: string; history?: ChatMsg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nederīgs pieprasījums." }, { status: 400 });
  }
  const message = String(body.message ?? "").trim().slice(0, 1000);
  if (!message) return NextResponse.json({ error: "Tukšs ziņojums." }, { status: 400 });
  const history: ChatMsg[] = Array.isArray(body.history)
    ? body.history.filter((m) => m && (m.role === "user" || m.role === "model") && typeof m.text === "string").slice(-8)
    : [];

  try {
    const answer = await runAssistant(history, message);
    return NextResponse.json(answer);
  } catch (e) {
    console.error("ai-chat:", e);
    return NextResponse.json({ error: "AI palīgs šobrīd nespēj atbildēt. Pamēģini vēlreiz pēc brīža." }, { status: 502 });
  }
}
