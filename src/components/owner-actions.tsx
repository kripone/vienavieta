"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteListing, setSold } from "@/app/sludinajumi/actions";

export function OwnerActions({ id, status, compact }: { id: string; status: string; compact?: boolean }) {
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
      <a className="btn small" href={`/sludinajumi/${id}/rediget`}>Rediģēt</a>
      {status === "active" && <button type="button" className="btn small" disabled={busy} onClick={() => run(() => setSold(id, true))}>Atzīmēt kā pārdotu</button>}
      {status === "sold" && <button type="button" className="btn small" disabled={busy} onClick={() => run(() => setSold(id, false))}>Atjaunot</button>}
      {!confirm ? (
        <button type="button" className="btn small" onClick={() => setConfirm(true)}>Dzēst</button>
      ) : (
        <span className="row">
          <span className="fine">Dzēst neatgriezeniski?</span>
          <button type="button" className="btn small danger" disabled={busy} onClick={() => run(() => deleteListing(id), () => { if (!compact) router.push("/mani-sludinajumi"); })}>Jā, dzēst</button>
          <button type="button" className="btn small" onClick={() => setConfirm(false)}>Nē</button>
        </span>
      )}
    </div>
  );
}
