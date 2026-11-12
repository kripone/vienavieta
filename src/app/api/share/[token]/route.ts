// Kopīgotā favorītu saraksta skatītāja vērtējums / komentārs (bez reģistrācijas). Viens ieraksts katram skatītājam un sludinājumam.
import { NextResponse, type NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { SHARE_COMMENT_MAX } from "@/lib/constants";
import { sharedList } from "@/lib/favorites";

const hits = new Map<string, { n: number; at: number }>();
const { shareReactions } = schema;

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.at < 60_000) { if (++h.n > 30) return NextResponse.json({ error: "limit" }, { status: 429 }); } else hits.set(ip, { n: 1, at: now });
  if (hits.size > 5000) hits.clear();

  const { token } = await ctx.params;
  const text = await req.text();
  if (text.length > 4000) return NextResponse.json({ error: "size" }, { status: 413 });
  let b: { listingId?: unknown; key?: unknown; name?: unknown; vote?: unknown; comment?: unknown };
  try { b = JSON.parse(text); } catch { return NextResponse.json({ error: "json" }, { status: 400 }); }
  const key = typeof b.key === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(b.key) ? b.key : null;
  const name = typeof b.name === "string" ? b.name.replace(/\s+/g, " ").trim().slice(0, 40) : "";
  const vote = b.vote === "like" || b.vote === "dislike" ? b.vote : null;
  const comment = typeof b.comment === "string" ? b.comment.trim().slice(0, SHARE_COMMENT_MAX) || null : null;
  if (!key || !name || typeof b.listingId !== "string") return NextResponse.json({ error: "input" }, { status: 400 });

  const list = await sharedList(token);
  if (!list || !list.rows.some((r) => r.id === b.listingId)) return NextResponse.json({ error: "notfound" }, { status: 404 });
  const where = and(eq(shareReactions.shareId, list.share.id), eq(shareReactions.listingId, b.listingId), eq(shareReactions.visitorKey, key));
  if (!vote && !comment) {
    const gone = await db.delete(shareReactions).where(where).returning({ id: shareReactions.id });
    return NextResponse.json({ ok: true, id: gone[0]?.id });
  }
  // ne vairāk kā 300 ierakstu vienam sarakstam
  const total = Number((await db.execute<{ n: string }>(sql`select count(*) n from share_reactions where share_id = ${list.share.id}`)).rows[0]?.n ?? 0);
  if (total >= 300) return NextResponse.json({ error: "full" }, { status: 429 });
  const [row] = await db
    .insert(shareReactions)
    .values({ shareId: list.share.id, listingId: b.listingId, visitorKey: key, name, vote, comment })
    .onConflictDoUpdate({ target: [shareReactions.shareId, shareReactions.listingId, shareReactions.visitorKey], set: { name, vote, comment, updatedAt: new Date() } })
    .returning({ id: shareReactions.id });
  return NextResponse.json({ ok: true, id: row?.id });
}
