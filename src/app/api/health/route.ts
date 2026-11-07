import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/** Veselības pārbaude hostingam un uzraudzībai. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: "ok" });
  } catch {
    return Response.json({ ok: false, db: "unreachable" }, { status: 503 });
  }
}
