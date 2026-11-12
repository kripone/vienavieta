"use client";
import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { linkTelegram, setTelegramPriceDrops, unlinkTelegram } from "@/app/pazinojumi/actions";

type Props = { chatId: string | null; username: string | null; priceDrops: boolean };

export function TelegramConnect({ chatId, username, priceDrops }: Props) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [drops, setDrops] = useState(priceDrops);

  async function connect() {
    setBusy(true);
    const r = await linkTelegram();
    setBusy(false);
    if (r.ok) window.open(r.url, "_blank", "noopener");
  }
  async function disconnect() {
    setBusy(true);
    await unlinkTelegram();
    setBusy(false);
    router.refresh();
  }

  if (!chatId) {
    return (
      <div className="row">
        <button type="button" className="btn" disabled={busy} onClick={connect}>
          {busy ? t("Gatavojam saiti…") : t("Pieslēgt Telegram")}
        </button>
      </div>
    );
  }
  return (
    <div className="stack">
      <p className="fine">
        {t("Pieslēgts čats:")} <b>{username ? `@${username}` : chatId}</b>
      </p>
      <label className="check">
        <input
          type="checkbox"
          checked={drops}
          disabled={busy}
          onChange={async (e) => { const n = e.target.checked; setDrops(n); setBusy(true); await setTelegramPriceDrops(n); setBusy(false); }}
        />
        {t("Sūtīt Telegram ziņu, ja favorītos saglabātam sludinājumam samazinās cena")}
      </label>
      <div className="row">
        <button type="button" className="btn small" disabled={busy} onClick={disconnect}>{t("Atvienot Telegram")}</button>
      </div>
    </div>
  );
}
