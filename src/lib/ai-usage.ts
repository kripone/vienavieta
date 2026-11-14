// AI meklētāja lietojuma uzskaite pa dienām (diena pēc Rīgas laika).
// Neizmest kļūdu — uzskaite nedrīkst traucēt pašu čatu.
import { sql } from "drizzle-orm";
import { db } from "@/db";

export function rigaDay(d = new Date()): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" });
}

export async function trackAiUsage(kind: "chat" | "transcribe") {
  const col = kind === "chat" ? "requests" : "transcribes";
  await db
    .execute(
      sql`insert into ai_usage_daily (day, ${sql.raw(col)}) values (${rigaDay()}, 1)
          on conflict (day) do update set ${sql.raw(col)} = ai_usage_daily.${sql.raw(col)} + 1`,
    )
    .catch((e) => console.error("ai-usage:", e instanceof Error ? e.message : e));
}
