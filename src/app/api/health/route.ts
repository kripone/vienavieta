import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/** Veselības pārbaude hostingam un uzraudzībai. */
export async function GET(req: Request) {
  // ĪSLAICĪGI (drošības audits): kuras IP galvenes nonāk līdz serverim; rāda tikai paša pieprasītāja vērtības
  if (new URL(req.url).searchParams.get("ip") === "1") {
    const h = req.headers;
    return Response.json({ xff: h.get("x-forwarded-for"), cf: h.get("cf-connecting-ip"), tci: h.get("true-client-ip"), real: h.get("x-real-ip") });
  }
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: "ok" });
  } catch {
    return Response.json({ ok: false, db: "unreachable" }, { status: 503 });
  }
}
