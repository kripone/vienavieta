"use client";
import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSearch, setPriceDrops, setPricePush, updateSearch } from "@/app/pazinojumi/actions";
import { NOTIFY_FREQUENCIES, NOTIFY_FREQUENCY_LABEL, type NotifyFrequency } from "@/lib/constants";

type Props = { id: string; name: string; href: string; frequency: string; notifyEmail: boolean; notifyPush: boolean; notifyTelegram: boolean; hasPush: boolean; hasTelegram: boolean; checked: string | null };

export function SavedSearchRow(p: Props) {
  const { t } = useT();
  const router = useRouter();
  const [freq, setFreq] = useState(p.frequency);
  const [on, setOn] = useState(p.notifyEmail);
  const [push, setPush] = useState(p.notifyPush);
  const [tg, setTg] = useState(p.notifyTelegram);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function save(patch: { frequency?: string; notifyEmail?: boolean; notifyPush?: boolean; notifyTelegram?: boolean }) {
    setBusy(true);
    await updateSearch(p.id, patch);
    setBusy(false);
  }

  return (
    <div className="ss-row">
      <div className="ss-main">
        <a href={p.href} className="ss-name">{p.name}</a>
        <span className="fine">{p.checked ? t("Pēdējā pārbaude {when}", { when: p.checked }) : t("Vēl nav pārbaudīts")}</span>
      </div>
      <div className="row">
        <label className="check">
          <input type="checkbox" checked={on} disabled={busy} onChange={(e) => { setOn(e.target.checked); save({ notifyEmail: e.target.checked }); }} />
          {t("E-pasts")}
        </label>
        {p.hasPush && (
          <label className="check">
            <input type="checkbox" checked={push} disabled={busy} onChange={(e) => { setPush(e.target.checked); save({ notifyPush: e.target.checked }); }} />
            {t("Telefonā")}
          </label>
        )}
        {p.hasTelegram && (
          <label className="check">
            <input type="checkbox" checked={tg} disabled={busy} onChange={(e) => { setTg(e.target.checked); save({ notifyTelegram: e.target.checked }); }} />
            Telegram
          </label>
        )}
        <select aria-label={t("Biežums")} value={freq} disabled={busy || (!on && !push && !tg)} onChange={(e) => { setFreq(e.target.value); save({ frequency: e.target.value }); }}>
          {NOTIFY_FREQUENCIES.map((f) => <option key={f} value={f}>{NOTIFY_FREQUENCY_LABEL[f as NotifyFrequency]}</option>)}
        </select>
        {!confirm ? (
          <button type="button" className="btn small" onClick={() => setConfirm(true)}>{t("Dzēst")}</button>
        ) : (
          <>
            <button type="button" className="btn small danger" disabled={busy} onClick={async () => { setBusy(true); await deleteSearch(p.id); router.refresh(); }}>{t("Jā, dzēst")}</button>
            <button type="button" className="btn small" onClick={() => setConfirm(false)}>{t("Nē")}</button>
          </>
        )}
      </div>
    </div>
  );
}

export function PriceDropToggle({ on }: { on: boolean }) {
  const { t } = useT();
  const [v, setV] = useState(on);
  const [busy, setBusy] = useState(false);
  return (
    <label className="check">
      <input type="checkbox" checked={v} disabled={busy} onChange={async (e) => { const n = e.target.checked; setV(n); setBusy(true); await setPriceDrops(n); setBusy(false); }} />
      {t("Sūtīt e-pastu, ja favorītos saglabātam sludinājumam samazinās cena")}
    </label>
  );
}

export function PricePushToggle({ on }: { on: boolean }) {
  const { t } = useT();
  const [v, setV] = useState(on);
  const [busy, setBusy] = useState(false);
  return (
    <label className="check">
      <input type="checkbox" checked={v} disabled={busy} onChange={async (e) => { const n = e.target.checked; setV(n); setBusy(true); await setPricePush(n); setBusy(false); }} />
      {t("Paziņot telefonā, ja favorītos saglabātam sludinājumam samazinās cena")}
    </label>
  );
}
