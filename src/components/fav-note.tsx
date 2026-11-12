"use client";
// Privāta piezīme un statuss pie favorīta (saglabājas pats, redz tikai lietotājs).
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { INTL_LOCALE } from "@/i18n/core";
import { FAVORITE_NOTE_MAX, FAVORITE_STAGE_LABEL, FAVORITE_STAGES } from "@/lib/constants";
import { googleCalendarUrl, icsFile, parseNoteDate, type NoteDate } from "@/lib/note-date";
import { saveFavoriteNote } from "@/app/favoriti/actions";

export function FavNote({ listingId, title, note, stage }: { listingId: string; title: string; note: string | null; stage: string | null }) {
  const { t, locale } = useT();
  const [text, setText] = useState(note ?? "");
  const [st, setSt] = useState(stage ?? "");
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // diena un laiks piezīmē → piedāvājums pievienot kalendāram (aprēķina pārlūkā, lai sakristu ar lietotāja laika joslu)
  const [when, setWhen] = useState<NoteDate | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setWhen(st === "rejected" ? null : parseNoteDate(text)), 400);
    return () => clearTimeout(id);
  }, [text, st]);
  const evTitle = `${t("Apskate")}: ${title}`;
  const evDetails = `${text.trim()}\n${typeof location === "undefined" ? "" : location.origin}/sludinajumi/${listingId}`;
  function downloadIcs() {
    if (!when) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([icsFile(when, evTitle, evDetails, listingId)], { type: "text/calendar" }));
    a.download = "apskate.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  function save(nextText: string, nextStage: string, delay: number) {
    clearTimeout(timer.current);
    setState("saving");
    timer.current = setTimeout(async () => {
      const r = await saveFavoriteNote(listingId, nextText, nextStage).catch(() => ({ ok: false }));
      setState(r.ok ? "saved" : "error");
    }, delay);
  }
  return (
    <div className={`fav-note stage-${st || "none"}`}>
      <label className="fav-stage">
        <span>{t("Statuss")}</span>
        <select value={st} onChange={(e) => { setSt(e.target.value); save(text, e.target.value, 0); }}>
          <option value="">—</option>
          {FAVORITE_STAGES.map((s) => <option key={s} value={s}>{t(FAVORITE_STAGE_LABEL[s])}</option>)}
        </select>
      </label>
      <label className="fav-text">
        <span>📝 {t("Mana piezīme (redzi tikai tu)")}</span>
        <textarea value={text} rows={text.length > 80 || text.includes("\n") ? 3 : 2} maxLength={FAVORITE_NOTE_MAX}
          placeholder={t("Piem.: jātiekas sestdien 14:00, var nedaudz kaulēties")}
          onChange={(e) => { setText(e.target.value); save(e.target.value, st, 900); }} />
      </label>
      {when && (
        <div className="fav-cal">
          <span>📅 <b>{when.start.toLocaleDateString(INTL_LOCALE[locale], { weekday: "long", day: "numeric", month: "long" })}{when.allDay ? "" : `, ${when.start.toLocaleTimeString(INTL_LOCALE[locale], { hour: "2-digit", minute: "2-digit" })}`}</b></span>
          <span className="fav-cal-btns">
            <a className="btn small" href={googleCalendarUrl(when, evTitle, evDetails)} target="_blank" rel="noopener noreferrer">{t("Pievienot Google kalendāram")}</a>
            <button type="button" className="btn small" onClick={downloadIcs}>{t("Apple / Outlook (.ics)")}</button>
          </span>
        </div>
      )}
      <span className="fav-state fine" aria-live="polite">{state === "saving" ? t("Saglabā…") : state === "saved" ? `✓ ${t("Saglabāts")}` : state === "error" ? t("Neizdevās saglabāt") : ""}</span>
    </div>
  );
}
