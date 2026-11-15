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
  const [listening, setListening] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMicOk(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined");
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
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

  const micError = (msg: string) => setMsgs((m) => [...m, { role: "model", text: msg }]);

  const toggleMic = async () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      micError(t("Mikrofons nav pieejams — atļauj to pārlūka iestatījumos un pamēģini vēlreiz."));
      return;
    }
    streamRef.current = stream;
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      setListening(false);
      recRef.current = null;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      if (blob.size < 800) return; // pārāk īss/tukšs ieraksts — neko nesūtām
      setBusy(true);
      try {
        const buf = new Uint8Array(await blob.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        const res = await fetch("/api/chat/transcribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ audio: btoa(bin), mimeType: blob.type }),
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok || !data.text) {
          micError(data.error || t("Neizdevās saklausīt — pamēģini vēlreiz."));
        } else {
          setInput(data.text);
          send(data.text);
        }
      } catch {
        micError(t("Savienojuma kļūda — pamēģini vēlreiz."));
      } finally {
        setBusy(false);
      }
    };
    recRef.current = rec;
    setListening(true);
    try { rec.start(250); } catch { setListening(false); recRef.current = null; }
  };

  if (!open) {
    return (
      <button className="ai-fab" onClick={() => setOpen(true)} aria-label={t("AI meklēšanas palīgs")} title={t("AI meklēšanas palīgs")}>
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <path d="M12 2.5c.9 5.4 3 7.6 9.5 9.5-6.5 1.9-8.6 4.1-9.5 9.5-.9-5.4-3-7.6-9.5-9.5 6.5-1.9 8.6-4.1 9.5-9.5Z" fill="#fff" />
          <circle className="eye" cx="10.1" cy="11.2" r="1.05" fill="#6d28d9" />
          <circle className="eye" cx="13.9" cy="11.2" r="1.05" fill="#6d28d9" />
        </svg>
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
                  <div key={r.id} className="ai-result">
                    {r.thumb && <img src={r.thumb} alt="" loading="lazy" />}
                    <a className="ai-r-title" href={r.ext ? r.url : lp(r.url)} {...(r.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{r.title}</a>
                    <span className="ai-r-meta">
                      {r.prevPrice != null && <s className="ai-r-prev">{fmtPrice(r.prevPrice)}</s>}<b>{fmtPrice(r.price)}</b>
                      {r.place ? ` · ${r.place}` : ""}
                    </span>
                    {r.address && (
                      <a className="ai-r-deals" href={lp(`/darijumi?q=${encodeURIComponent(r.address)}`)}>{t("Darījumi adresē")} →</a>
                    )}
                  </div>
                ))}
                {m.moreUrl && m.total != null && m.total > m.results!.length && (
                  <a className="ai-more" href={lp(m.moreUrl)}>{t("Skatīt visus {n} →", { n: m.total })}</a>
                )}
              </div>
            )}
            {m.moreUrl && !m.results?.length && (
              <a className="ai-more ai-more-solo" href={lp(m.moreUrl)}>{t("Skatīt pilnu sarakstu →")}</a>
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
        {micOk && (
          <button
            className={`ai-mic${listening ? " on" : ""}`}
            onClick={toggleMic}
            disabled={busy}
            aria-label={t(listening ? "Apturēt ierakstu" : "Runāt")}
            title={t(listening ? "Apturēt ierakstu" : "Runāt")}
          >
            🎤
          </button>
        )}
        <button onClick={() => send()} disabled={busy || !input.trim()} aria-label={t("Sūtīt")}>➤</button>
      </div>
    </div>
  );
}
