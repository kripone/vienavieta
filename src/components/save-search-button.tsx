"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { saveSearch } from "@/app/pazinojumi/actions";

/** "🔔 Saglabāt meklēšanu": saglabā pašreizējos filtrus un ieslēdz e-pasta paziņojumus. */
export function SaveSearchButton({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [state, setState] = useState<"idle" | "busy" | "saved">("idle");
  const [msg, setMsg] = useState("");

  async function click() {
    const here = `${path}${sp.toString() ? `?${sp}` : ""}`;
    if (!loggedIn) return router.push(`/ielogoties?next=${encodeURIComponent(here)}`);
    setState("busy");
    const r = await saveSearch(Object.fromEntries(sp.entries()));
    if (r.ok) {
      setState("saved");
      setMsg(`Saglabāts: ${r.name}. Paziņosim e-pastā par jauniem sludinājumiem.`);
    } else {
      setState("idle");
      if (r.login) router.push(`/ielogoties?next=${encodeURIComponent(here)}`);
      else setMsg(r.error);
    }
  }

  return (
    <div className="save-search">
      {state === "saved" ? (
        <a className="btn small" href="/pazinojumi">🔔 Saglabāts · iestatījumi</a>
      ) : (
        <button type="button" className="btn small" disabled={state === "busy"} onClick={click}>🔔 Saglabāt meklēšanu</button>
      )}
      {msg && <span className="fine" role="status">{msg}</span>}
    </div>
  );
}
