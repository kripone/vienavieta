"use client";
import { useT } from "@/i18n/client";
import { useState } from "react";
import { VIEW_COOKIE, type ListView } from "@/lib/constants";

/** Slēdzis „Režģis / Saraksts” virs rezultātiem (datorā). Izvēli atceras sīkdatnē. */
export function ViewToggle({ initial }: { initial: ListView }) {
  const { t } = useT();
  const [view, setView] = useState<ListView>(initial);

  function pick(v: ListView) {
    setView(v);
    document.cookie = `${VIEW_COOKIE}=${v}; path=/; max-age=31536000; samesite=lax`;
    document.querySelectorAll(".list.results-list").forEach((el) => el.classList.toggle("grid", v === "grid"));
  }

  return (
    <div className="view-toggle" role="group" aria-label={t("Skats")}>
      <button type="button" aria-pressed={view === "grid"} onClick={() => pick("grid")}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>
        {t("Režģis")}
      </button>
      <button type="button" aria-pressed={view === "list"} onClick={() => pick("list")}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        {t("Saraksts")}
      </button>
    </div>
  );
}
