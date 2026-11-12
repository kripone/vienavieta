"use client";
// Privāta piezīme un statuss pie favorīta (saglabājas pats, redz tikai lietotājs).
import { useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { FAVORITE_NOTE_MAX, FAVORITE_STAGE_LABEL, FAVORITE_STAGES } from "@/lib/constants";
import { saveFavoriteNote } from "@/app/favoriti/actions";

export function FavNote({ listingId, note, stage }: { listingId: string; note: string | null; stage: string | null }) {
  const { t } = useT();
  const [text, setText] = useState(note ?? "");
  const [st, setSt] = useState(stage ?? "");
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

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
          placeholder={t("Piem.: zvanīju svētdien, skate līdz decembrim, var nedaudz kaulēties")}
          onChange={(e) => { setText(e.target.value); save(e.target.value, st, 900); }} />
      </label>
      <span className="fav-state fine" aria-live="polite">{state === "saving" ? t("Saglabā…") : state === "saved" ? `✓ ${t("Saglabāts")}` : state === "error" ? t("Neizdevās saglabāt") : ""}</span>
    </div>
  );
}
