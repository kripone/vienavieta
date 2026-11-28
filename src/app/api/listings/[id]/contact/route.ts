import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { clientIp, overLimit } from "@/lib/client-ip";

/** Pārdevēja kontakti. Netiek iekļauti lapas HTML, lai tos nevarētu viegli savākt automātiski. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  // pret kontaktu masveida savākšanu: 20 minūtē un 200 dienā no vienas adreses
  const ip = clientIp(req.headers);
  if (overLimit("contact-min", ip, 20, 60_000) || overLimit("contact-day", ip, 200, 86_400_000)) {
    return Response.json({ error: "Pārāk daudz pieprasījumu. Mēģini vēlāk." }, { status: 429 });
  }
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return Response.json({ error: "Nav atrasts" }, { status: 404 });
  const l = await db.query.listings.findFirst({
    where: and(eq(schema.listings.id, id), eq(schema.listings.status, "active")),
    columns: { contactPhone: true, contactEmail: true },
  });
  if (!l) return Response.json({ error: "Nav atrasts" }, { status: 404 });
  return Response.json({ phone: l.contactPhone, email: l.contactEmail }, { headers: { "Cache-Control": "no-store" } });
}
