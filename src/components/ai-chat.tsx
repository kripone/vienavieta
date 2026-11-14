"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import type { AssistantAnswer } from "@/lib/ai-chat";

type Msg = { role: "user" | "model"; text: string; results?: AssistantAnswer["results"]; total?: number; moreUrl?: string | null; appraisalUrl?: string | null };

const fmtPrice = (n: number | null) => (n == null ? "" : `${n.toLocaleString("lv-LV")} €`);

export function AiChat() {
  const { t, lp } = useT();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const history = msgs.slice(-8).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = (await res.json()) as AssistantAnswer & { error?: string };
      if (!res.ok) {
        setMsgs((m) => [...m, { role: "model", text: data.error || t("Kaut kas nogāja greizi — pamēģini vēlreiz.") }]);
      } else {
        setMsgs((m) => [...m, { role: "model", text: data.reply, results: data.results, total: data.total, moreUrl: data.moreUrl, appraisalUrl: data.appraisalUrl }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "model", text: t("Savienojuma kļūda — pamēģini vēlreiz.") }]);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="ai-fab" onClick={() => setOpen(true)} aria-label={t("AI meklēšanas palīgs")} title={t("AI meklēšanas palīgs")}>
        ✨
      </button>
    );
  }

  return (
    <div className="ai-panel" role="dialog" aria-label={t("AI meklēšanas palīgs")}>
      <div className="ai-head">
        <span>✨ {t("AI palīgs")}</span>
        <button className="ai-close" onClick={() => setOpen(false)} aria-label={t("Aizvērt")}>✕</button>
      </div>
      <div className="ai-msgs" ref={listRef}>
        {msgs.length === 0 && (
          <div className="ai-msg model">
            {t("Sveiki! Pastāsti, ko meklē — piemēram:")}
            <div className="ai-hints">
              {["Dīzeļa universāls līdz 8000 € Rīgā", "2 istabu dzīvoklis īrē Jūrmalā", "Elektro auto līdz 20000"].map((h) => (
                <button key={h} className="ai-hint" onClick={() => { setInput(t(h)); }}>
                  {t(h)}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            <div>{m.text}</div>
            {m.appraisalUrl && (
              <a className="ai-appraisal" href={lp(m.appraisalUrl)}>{t("Novērtēt bez maksas")} →</a>
            )}
            {!!m.results?.length && (
              <div className="ai-results">
                {m.total != null && <div className="ai-total">{t("Atrasti {n} sludinājumi", { n: m.total })}</div>}
                {m.results.map((r) => (
                  <a key={r.id} className="ai-result" href={r.ext ? r.url : lp(r.url)} {...(r.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {r.thumb && <img src={r.thumb} alt="" loading="lazy" />}
                    <span className="ai-r-title">{r.title}</span>
                    <span className="ai-r-meta">
                      <b>{fmtPrice(r.price)}</b>
                      {r.place ? ` · ${r.place}` : ""}
                    </span>
                  </a>
                ))}
                {m.moreUrl && m.total != null && m.total > m.results!.length && (
                  <a className="ai-more" href={lp(m.moreUrl)}>{t("Skatīt visus {n} →", { n: m.total })}</a>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="ai-msg model ai-typing">{t("Meklēju")}…</div>}
      </div>
      <div className="ai-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("Ko meklējam?")}
          maxLength={500}
          autoFocus
        />
        <button onClick={send} disabled={busy || !input.trim()} aria-label={t("Sūtīt")}>➤</button>
      </div>
    </div>
  );
}
