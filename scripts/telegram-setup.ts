// Telegram bota webhook reģistrācija: pēc izvietošanas palaist reizi ar
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... APP_URL=https://vienavieta.lv npx tsx scripts/telegram-setup.ts
// setWebhook norāda Telegram, uz kurieni sūtīt bota ziņas; secret_token jābūt tādam pašam kā servera env.
export {};
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
const appUrl = (process.env.APP_URL || "https://vienavieta.lv").replace(/\/$/, "");
if (!token) throw new Error("Nav TELEGRAM_BOT_TOKEN");

async function call(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = (await r.json()) as { ok: boolean; description?: string; result?: unknown };
  console.log(method, "→", d.ok ? "OK" : `KĻŪDA: ${d.description}`);
  if (!d.ok) process.exit(1);
  return d.result;
}

const me = (await call("getMe", {})) as { username?: string };
console.log("bots: @" + me.username, "(TELEGRAM_BOT_USERNAME=" + me.username + ")");
await call("setWebhook", {
  url: `${appUrl}/api/telegram/webhook`,
  secret_token: secret,
  allowed_updates: ["message"],
  drop_pending_updates: true,
});
await call("setMyCommands", {
  commands: [
    { command: "start", description: "Pieslēgt paziņojumus" },
    { command: "stop", description: "Atrakstīties no paziņojumiem" },
  ],
});
console.log("webhook:", `${appUrl}/api/telegram/webhook`);
