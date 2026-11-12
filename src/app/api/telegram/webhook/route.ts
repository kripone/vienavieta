// Telegram bota webhook: saņem ziņas no Telegram serveriem (reģistrē scripts/telegram-setup.ts).
// Telegram gaida ātru 200, tāpēc apstrāde notiek fonā (await ir lēts — tikai pāris DB/API izsaukumi).
import { handleUpdate, telegramEnabled, validWebhookSecret } from "@/lib/telegram";

export async function POST(req: Request) {
  if (!telegramEnabled()) return Response.json({ error: "disabled" }, { status: 503 });
  if (!validWebhookSecret(req.headers.get("x-telegram-bot-api-secret-token"))) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const update = await req.json().catch(() => null);
  if (update) await handleUpdate(update).catch((e) => console.error("telegram webhook:", e instanceof Error ? e.message : e));
  return Response.json({ ok: true });
}
