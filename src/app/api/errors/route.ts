// Pārlūka kļūdas (src/components/error-reporter.tsx). Ierobežots apjoms: max 20 ziņas minūtē no vienas adreses.
import { NextResponse, type NextRequest } from "next/server";
import { recordError } from "@/lib/errors";

const hits = new Map<string, { n: number; at: number }>();

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.at < 60_000) {
    if (++h.n > 20) return new NextResponse(null, { status: 429 });
  } else hits.set(ip, { n: 1, at: now });
  if (hits.size > 5000) hits.clear();
  const text = await req.text();
  if (text.length > 10_000) return new NextResponse(null, { status: 413 });
  let b: { message?: unknown; stack?: unknown; url?: unknown; digest?: unknown };
  try { b = JSON.parse(text); } catch { return new NextResponse(null, { status: 400 }); }
  if (typeof b.message !== "string" || !b.message) return new NextResponse(null, { status: 400 });
  await recordError({ source: "client", message: b.message, stack: typeof b.stack === "string" ? b.stack : null, url: typeof b.url === "string" ? b.url : null, digest: typeof b.digest === "string" ? b.digest : null, userAgent: req.headers.get("user-agent") });
  return new NextResponse(null, { status: 204 });
}
