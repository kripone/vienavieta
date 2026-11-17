import { getCurrentUser } from "@/lib/session";
import { assistListing } from "@/lib/listing-assist";
import { LISTING_ASSIST_PER_HOUR } from "@/lib/constants";

// vienkāršs apjoma ierobežojums vienam lietotājam (atmiņā; Gemini izsaukumi maksā)
const hits = new Map<string, number[]>();

/** POST /api/listing-assist { text, lang } → formas lauki, apraksts un cenas ieteikums. Tikai pieteiktiem lietotājiem. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Jāpiesakās" }, { status: 401 });
  if (!process.env.GEMINI_API_KEY) return Response.json({ error: "AI nav pieejams" }, { status: 503 });
  const now = Date.now();
  const list = (hits.get(user.id) ?? []).filter((t) => now - t < 3_600_000);
  if (list.length >= LISTING_ASSIST_PER_HOUR) return Response.json({ error: "Pārāk daudz pieprasījumu — pamēģini pēc brīža." }, { status: 429 });
  hits.set(user.id, [...list, now]);
  const body = (await req.json().catch(() => ({}))) as { text?: string; lang?: string };
  const text = String(body.text ?? "").trim();
  if (text.length < 10) return Response.json({ error: "Uzraksti mazliet vairāk par to, ko pārdod." }, { status: 400 });
  try {
    return Response.json(await assistListing(text, String(body.lang ?? "lv")));
  } catch (e) {
    console.error("listing-assist:", e instanceof Error ? e.message : e);
    return Response.json({ error: "Neizdevās — pamēģini vēlreiz vai aizpildi laukus pats." }, { status: 502 });
  }
}
