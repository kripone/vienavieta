import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";

// Pret kontaktu masveida savākšanu: ne vairāk kā 30 pieprasījumu minūtē no vienas adreses (atmiņā).
const hits = new Map<string, { n: number; at: number }>();

/** Pārdevēja kontakti. Netiek iekļauti lapas HTML, lai tos nevarētu viegli savākt automātiski. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.at < 60_000) {
    if (++h.n > 30) return Response.json({ error: "Pārāk daudz pieprasījumu. Mēģini pēc brīža." }, { status: 429 });
  } else hits.set(ip, { n: 1, at: now });
  if (hits.size > 5000) hits.clear();

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return Response.json({ error: "Nav atrasts" }, { status: 404 });
  const l = await db.query.listings.findFirst({
    where: and(eq(schema.listings.id, id), eq(schema.listings.status, "active")),
    columns: { contactPhone: true, contactEmail: true },
  });
  if (!l) return Response.json({ error: "Nav atrasts" }, { status: 404 });
  return Response.json({ phone: l.contactPhone, email: l.contactEmail }, { headers: { "Cache-Control": "no-store" } });
}
