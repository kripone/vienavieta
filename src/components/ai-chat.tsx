"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { trTitle } from "@/i18n/content";
import type { AssistantAnswer } from "@/lib/ai-chat";

type Msg = { role: "user" | "model"; text: string; results?: AssistantAnswer["results"]; total?: number; moreUrl?: string | null; appraisalUrl?: string | null };

/** Mikrofona ikona (čats un kartīte „Jautā AI asistentam”). */
export const MicIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
);

/** Jautājumu piemēri (čatā un kartītē „Jautā AI asistentam”). */
export const AI_EXAMPLES = [
  "Labs ģimenes auto līdz 8000 €",
  "2 istabu dzīvoklis Rīgā līdz 90 000 €",
  "Par cik pārdoti dzīvokļi Brīvības ielā 100B, Rīgā?",
  "Kas šonedēļ kļuvis lētāks?",
];

const fmtPrice = (n: number | null) => (n == null ? "" : `${n.toLocaleString("lv-LV")} €`);

export function AiChat() {
  const { t, lp, locale } = useT();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const toggleMicRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMicOk(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined");
  }, []);

  // atvēršana no citurienes (kartīte „Jautā AI asistentam”): window.dispatchEvent(new CustomEvent("vv-ai", { detail: "jautājums" }))
  const pending = useRef<string | null>(null);
  useEffect(() => {
    const onOpen = (e: Event) => {
      const q = (e as CustomEvent<string | undefined>).detail;
      setOpen(true);
      if (q) pending.current = q;
    };
    // „vv-ai-mic”: atver čatu un uzreiz sāk klausīties (mikrofona poga kartītē)
    const onMic = () => { setOpen(true); setTimeout(() => toggleMicRef.current?.(), 150); };
    window.addEventListener("vv-ai", onOpen);
    window.addEventListener("vv-ai-mic", onMic);
    return () => { window.removeEventListener("vv-ai", onOpen); window.removeEventListener("vv-ai-mic", onMic); };
  }, []);
  useEffect(() => {
    if (open && pending.current) {
      const q = pending.current;
      pending.current = null;
      send(q);
    }
  });

  // telefonā poga ritinot uz leju paslēpjas, uz augšu parādās
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 8) setHidden(y > last && y > 200);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // atvērts čats telefonā aizņem visu ekrānu: lapa zem tā neritinās
  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 560px)").matches) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
        body: JSON.stringify({ message: text, history, lang: locale }),
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
  toggleMicRef.current = () => { if (!listening) toggleMic(); };

  if (!open) {
    return (
      <button className={`ai-pill${hidden ? " away" : ""}`} onClick={() => setOpen(true)} aria-label={t("AI asistents")}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l1.8 4.9L19 9.7l-5.2 1.9L12 16.5l-1.8-4.9L5 9.7l5.2-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>
        <span>{t("Jautā AI")}</span>
      </button>
    );
  }

  return (
    <div className="ai-panel" role="dialog" aria-label={t("AI asistents")}>
      <div className="ai-head">
        <span className="ai-title">
          <span className="ai-ico"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l1.8 4.9L19 9.7l-5.2 1.9L12 16.5l-1.8-4.9L5 9.7l5.2-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg></span>
          <span>
            <b>{t("AI asistents")}</b>
            <small>{t("Atbild par visiem VienāVietā sludinājumiem")}</small>
          </span>
        </span>
        <button className="ai-close" onClick={() => setOpen(false)} aria-label={t("Aizvērt")}>✕</button>
      </div>
      <div className="ai-msgs" ref={listRef}>
        {msgs.length === 0 && (
          <div className="ai-msg model">
            {t("Sveiks! Jautā brīvi, tāpat kā jautātu cilvēkam. Varu atrast sludinājumus, salīdzināt cenas, pateikt, vai cena ir laba, un parādīt reālos darījumus adresē.")}
            <div className="ai-hints">
              {AI_EXAMPLES.map((h) => (
                <button key={h} className="ai-hint" onClick={() => send(t(h))}>
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
                    <a className="ai-r-title" href={r.ext ? r.url : lp(r.url)} {...(r.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{trTitle(r.title, t)}</a>
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
          placeholder={t("Raksti savu jautājumu…")}
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
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
          </button>
        )}
        <button onClick={() => send()} disabled={busy || !input.trim()} aria-label={t("Sūtīt")}>➤</button>
      </div>
    </div>
  );
}
