"use client";
import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteListing, setSold } from "@/app/sludinajumi/actions";

export function OwnerActions({ id, status, compact }: { id: string; status: string; compact?: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    await fn();
    setBusy(false);
    after?.();
    router.refresh();
  };
  return (
    <div className="row owner">
      <a className="btn small" href={`/sludinajumi/${id}/rediget`}>{t("Rediģēt")}</a>
      {status === "active" && <button type="button" className="btn small" disabled={busy} onClick={() => run(() => setSold(id, true))}>{t("Atzīmēt kā pārdotu")}</button>}
      {status === "sold" && <button type="button" className="btn small" disabled={busy} onClick={() => run(() => setSold(id, false))}>{t("Atjaunot")}</button>}
      {!confirm ? (
        <button type="button" className="btn small" onClick={() => setConfirm(true)}>{t("Dzēst")}</button>
      ) : (
        <span className="row">
          <span className="fine">{t("Dzēst neatgriezeniski?")}</span>
          <button type="button" className="btn small danger" disabled={busy} onClick={() => run(() => deleteListing(id), () => { if (!compact) router.push("/mani-sludinajumi"); })}>{t("Jā, dzēst")}</button>
          <button type="button" className="btn small" onClick={() => setConfirm(false)}>{t("Nē")}</button>
        </span>
      )}
    </div>
  );
}
