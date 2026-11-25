"use client";
import { useState } from "react";
import { useT } from "@/i18n/client";
import { AI_EXAMPLES, MicIcon } from "./ai-chat";

/** Kartīte „Jautā AI asistentam” sānu kolonnā: atver čatu un uzreiz nosūta jautājumu. */
export function AiCard() {
  const { t } = useT();
  const [q, setQ] = useState("");
  const ask = (text: string) => {
    if (!text.trim()) return;
    window.dispatchEvent(new CustomEvent("vv-ai", { detail: text.trim() }));
    setQ("");
  };
  return (
    <section className="ai-card" aria-label={t("Jautā AI asistentam")}>
      <p className="ai-card-h">
        <span className="ai-ico">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l1.8 4.9L19 9.7l-5.2 1.9L12 16.5l-1.8-4.9L5 9.7l5.2-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>
        </span>
        {t("Jautā AI asistentam")}
      </p>
      <p>{t("Jautā brīvi, tāpat kā cilvēkam: piemēram, kāds dīzeļa universālis pieejams līdz 8000 € vai cik maksā 2 istabu dzīvoklis Purvciemā. Asistents pārzina visus sludinājumus, cenu kritumus un reālos darījumus.")}</p>
      <form className="ai-card-in" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Piem.: labs ģimenes auto līdz 8000 €")} aria-label={t("Tavs jautājums")} maxLength={500} />
        <button type="button" className="ai-card-mic" onClick={() => window.dispatchEvent(new Event("vv-ai-mic"))} aria-label={t("Runāt")} title={t("Runāt")}>
          <MicIcon />
        </button>
        <button type="submit" aria-label={t("Sūtīt")}>➤</button>
      </form>
      <div className="ai-card-ex">
        {AI_EXAMPLES.slice(1).map((h) => (
          <button key={h} type="button" onClick={() => ask(t(h))}>{t(h)}</button>
        ))}
      </div>
    </section>
  );
}
