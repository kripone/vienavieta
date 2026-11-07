"use client";
import { useT } from "@/i18n/client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { reportListing } from "@/app/sludinajumi/report";
import { REPORT_REASONS } from "@/lib/constants";

export function ReportButton({ id, loggedIn }: { id: string; loggedIn: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (done) return <p className="report fine">{t("Paldies! Sūdzība saņemta, un moderators to pārbaudīs.")}</p>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return setError(t("Izvēlies iemeslu."));
    setBusy(true);
    setError("");
    const r = await reportListing(id, reason, note);
    setBusy(false);
    if (r.ok) setDone(true);
    else if (r.login) router.push(`/ielogoties?next=${encodeURIComponent(path)}`);
    else setError(r.error);
  }

  return (
    <div className="report">
      {!open ? (
        <button type="button" className="linkish" onClick={() => (loggedIn ? setOpen(true) : router.push(`/ielogoties?next=${encodeURIComponent(path)}`))}>
          {t("⚑ Ziņot par sludinājumu")}
        </button>
      ) : (
        <form className="panel" onSubmit={submit}>
          <b>{t("Kas nav kārtībā?")}</b>
          <label className="field">
            {t("Iemesls")}
            <select value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={Boolean(error && !reason)}>
              <option value="">{t("— izvēlies —")}</option>
              {Object.entries(REPORT_REASONS).map(([k, v]) => (
                <option key={k} value={k}>{t(v)}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Komentārs (pēc izvēles)
            <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {error && <span className="err">{error}</span>}
          <div className="row">
            <button type="submit" className="btn small primary" disabled={busy}>{t("Nosūtīt")}</button>
            <button type="button" className="btn small" onClick={() => setOpen(false)}>{t("Atcelt")}</button>
          </div>
        </form>
      )}
    </div>
  );
}
