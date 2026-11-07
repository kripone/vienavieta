"use client";
import { useState } from "react";
import { unsubscribe } from "@/app/pazinojumi/actions";

export function UnsubscribeForm({ k, id, t }: { k: string; id: string; t: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  if (state === "done") return <p className="ok">Gatavs, vairs nesūtīsim. Iestatījumus vari mainīt sadaļā <a href="/pazinojumi">Paziņojumi</a>.</p>;
  return (
    <div className="row">
      <button type="button" className="btn primary" disabled={state === "busy"} onClick={async () => { setState("busy"); const r = await unsubscribe(k, id, t); setState(r.ok ? "done" : "error"); }}>
        Atrakstīties
      </button>
      {state === "error" && <span className="err">Neizdevās. Mēģini vēlreiz.</span>}
    </div>
  );
}
