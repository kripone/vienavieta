"use client";
import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { approveBusiness, approveListing, blockUser, hideListing, revokeBusiness, unblockUser, type ModResult } from "@/app/moderacija/actions";

type Action = "approve" | "hide" | "block" | "unblock" | "verify" | "unverify";

const LABEL: Record<Action, string> = {
  approve: "✓ Viss kārtībā",
  hide: "Paslēpt",
  block: "Bloķēt lietotāju",
  unblock: "Atbloķēt",
  verify: "✓ Apstiprināt uzņēmumu",
  unverify: "Atsaukt apstiprinājumu",
};
const CONFIRM: Partial<Record<Action, string>> = {
  block: "Bloķēt? Lietotājs tiks izrakstīts, un visi viņa sludinājumi paslēpti.",
  unverify: "Atsaukt? Plūsmas vairs netiks nolasītas; esošie sludinājumi paliek.",
};

/** Moderatora pogas sludinājumam vai lietotājam. */
export function ModActions({ listingId, userId, actions }: { listingId?: string; userId?: string; actions: Action[] }) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Action | null>(null);
  const [error, setError] = useState("");

  async function run(a: Action) {
    setBusy(true);
    setError("");
    const fn: Record<Action, () => Promise<ModResult>> = {
      approve: () => approveListing(listingId!),
      hide: () => hideListing(listingId!),
      block: () => blockUser(userId!),
      unblock: () => unblockUser(userId!),
      verify: () => approveBusiness(userId!),
      unverify: () => revokeBusiness(userId!),
    };
    const r = await fn[a]();
    setBusy(false);
    setConfirm(null);
    if (!r.ok) setError(r.error);
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="row mod-actions">
        <span className="fine">{CONFIRM[confirm]}</span>
        <button type="button" className="btn small danger" disabled={busy} onClick={() => run(confirm)}>{t("Jā")}</button>
        <button type="button" className="btn small" onClick={() => setConfirm(null)}>{t("Nē")}</button>
      </div>
    );
  }
  return (
    <div className="row mod-actions">
      {actions.map((a) => (
        <button key={a} type="button" className={`btn small${a === "block" ? " danger" : a === "approve" || a === "verify" ? " primary" : ""}`} disabled={busy} onClick={() => (CONFIRM[a] ? setConfirm(a) : run(a))}>
          {LABEL[a]}
        </button>
      ))}
      {error && <span className="err">{error}</span>}
    </div>
  );
}
