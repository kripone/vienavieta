"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSearch, setPriceDrops, updateSearch } from "@/app/pazinojumi/actions";
import { NOTIFY_FREQUENCIES, NOTIFY_FREQUENCY_LABEL, type NotifyFrequency } from "@/lib/constants";

type Props = { id: string; name: string; href: string; frequency: string; notifyEmail: boolean; checked: string | null };

export function SavedSearchRow(p: Props) {
  const router = useRouter();
  const [freq, setFreq] = useState(p.frequency);
  const [on, setOn] = useState(p.notifyEmail);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function save(patch: { frequency?: string; notifyEmail?: boolean }) {
    setBusy(true);
    await updateSearch(p.id, patch);
    setBusy(false);
  }

  return (
    <div className="ss-row">
      <div className="ss-main">
        <a href={p.href} className="ss-name">{p.name}</a>
        <span className="fine">{p.checked ? `Pēdējā pārbaude ${p.checked}` : "Vēl nav pārbaudīts"}</span>
      </div>
      <div className="row">
        <label className="check">
          <input type="checkbox" checked={on} disabled={busy} onChange={(e) => { setOn(e.target.checked); save({ notifyEmail: e.target.checked }); }} />
          E-pasts
        </label>
        <select aria-label="Biežums" value={freq} disabled={busy || !on} onChange={(e) => { setFreq(e.target.value); save({ frequency: e.target.value }); }}>
          {NOTIFY_FREQUENCIES.map((f) => <option key={f} value={f}>{NOTIFY_FREQUENCY_LABEL[f as NotifyFrequency]}</option>)}
        </select>
        {!confirm ? (
          <button type="button" className="btn small" onClick={() => setConfirm(true)}>Dzēst</button>
        ) : (
          <>
            <button type="button" className="btn small danger" disabled={busy} onClick={async () => { setBusy(true); await deleteSearch(p.id); router.refresh(); }}>Jā, dzēst</button>
            <button type="button" className="btn small" onClick={() => setConfirm(false)}>Nē</button>
          </>
        )}
      </div>
    </div>
  );
}

export function PriceDropToggle({ on }: { on: boolean }) {
  const [v, setV] = useState(on);
  const [busy, setBusy] = useState(false);
  return (
    <label className="check">
      <input type="checkbox" checked={v} disabled={busy} onChange={async (e) => { const n = e.target.checked; setV(n); setBusy(true); await setPriceDrops(n); setBusy(false); }} />
      Sūtīt e-pastu, ja favorītos saglabātam sludinājumam samazinās cena
    </label>
  );
}
