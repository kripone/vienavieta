import { NextResponse } from "next/server";
import { trackAiUsage } from "@/lib/ai-usage";
import { clientIp } from "@/lib/client-ip";

export const dynamic = "force-dynamic";

// Audio transkripcija ar Gemini (mikrofona poga čatā). Strādā arī iOS/Android, kur Web Speech API nepieejams.
const DAY = 86_400_000;
const LIMIT = 30;
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
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "AI palīgs pagaidām nav pieejams." }, { status: 503 });
  const ip = clientIp(req.headers, "local");
  if (limited(ip)) return NextResponse.json({ error: "Limits izsmelts. Pamēģini rīt!" }, { status: 429 });

  let body: { audio?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nederīgs pieprasījums." }, { status: 400 });
  }
  const audio = String(body.audio ?? "");
  const mimeType = String(body.mimeType ?? "audio/webm").slice(0, 60);
  if (!audio || audio.length > 8_000_000) return NextResponse.json({ error: "Audio par lielu vai tukšs." }, { status: 400 });

  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: audio } },
            { text: "Transcribe the speech in this audio. The speaker is most likely speaking Latvian, but may use English, Russian or Lithuanian. Return ONLY the raw transcription text in the spoken language — no quotes, no commentary, no translation." },
          ],
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 300 },
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = (data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "").trim().slice(0, 500);
    if (!text) return NextResponse.json({ error: "Nedzirdēju neko — pamēģini runāt skaidrāk un tuvāk mikrofonam." }, { status: 422 });
    void trackAiUsage("transcribe");
    return NextResponse.json({ text });
  } catch (e) {
    console.error("ai-transcribe:", e);
    return NextResponse.json({ error: "Transkripcija šobrīd neizdevās. Pamēģini vēlreiz." }, { status: 502 });
  }
}
