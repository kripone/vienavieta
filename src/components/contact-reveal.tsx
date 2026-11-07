"use client";
import { useT } from "@/i18n/client";
import { useState } from "react";

export function ContactReveal({ id }: { id: string }) {
  const { t } = useT();
  const [c, setC] = useState<{ phone: string | null; email: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (c)
    return (
      <div className="contact">
        {c.phone && <a href={`tel:${c.phone}`} className="big">{c.phone}</a>}
        {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
      </div>
    );
  return (
    <>
      <button
        type="button"
        className="btn primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await fetch(`/api/listings/${id}/contact`, { method: "POST" });
          setBusy(false);
          if (r.ok) setC(await r.json());
          else setErr(t("Kontaktus neizdevās ielādēt."));
        }}
      >
        {busy ? t("Ielādē…") : t("Rādīt tālruni")}
      </button>
      {err && <span className="err">{err}</span>}
    </>
  );
}
