"use client";
import { useState } from "react";
import { useT } from "@/i18n/client";
import { unsubscribe } from "@/app/pazinojumi/actions";

export function UnsubscribeForm({ k, id, t: tok }: { k: string; id: string; t: string }) {
  const { t } = useT();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  if (state === "done") return <p className="ok">{t("Gatavs, vairs nesūtīsim. Iestatījumus vari mainīt sadaļā")} <a href="/pazinojumi">{t("Paziņojumi")}</a>.</p>;
  return (
    <div className="row">
      <button type="button" className="btn primary" disabled={state === "busy"} onClick={async () => { setState("busy"); const r = await unsubscribe(k, id, tok); setState(r.ok ? "done" : "error"); }}>
        {t("Atrakstīties")}
      </button>
      {state === "error" && <span className="err">{t("Neizdevās. Mēģini vēlreiz.")}</span>}
    </div>
  );
}
