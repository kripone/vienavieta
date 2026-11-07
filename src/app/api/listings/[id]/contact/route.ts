import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";

/** Pārdevēja kontakti. Netiek iekļauti lapas HTML, lai tos nevarētu viegli savākt automātiski. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return Response.json({ error: "Nav atrasts" }, { status: 404 });
  const l = await db.query.listings.findFirst({
    where: and(eq(schema.listings.id, id), eq(schema.listings.status, "active")),
    columns: { contactPhone: true, contactEmail: true },
  });
  if (!l) return Response.json({ error: "Nav atrasts" }, { status: 404 });
  return Response.json({ phone: l.contactPhone, email: l.contactEmail }, { headers: { "Cache-Control": "no-store" } });
}
