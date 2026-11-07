"use client";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";

type Theme = "system" | "light" | "dark";
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<Theme, string> = { system: "Tēma: kā sistēmā", light: "Tēma: gaišā", dark: "Tēma: tumšā" };
const ICON: Record<Theme, React.ReactNode> = {
  system: <path d="M12 3a9 9 0 1 0 0 18V3z M12 3a9 9 0 0 1 0 18" />,
  light: <><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></>,
  dark: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
};

/** Izpildās <head> pirms lapas zīmēšanas, lai tēma nemirgo. */
export const themeScript = `try{var t=localStorage.getItem("vv-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export function ThemeToggle() {
  const { t: tr } = useT();
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try {
      const t = localStorage.getItem("vv-theme");
      if (t === "light" || t === "dark") setTheme(t);
    } catch {}
  }, []);

  function click() {
    const t = NEXT[theme];
    setTheme(t);
    const r = document.documentElement;
    if (t === "system") r.removeAttribute("data-theme");
    else r.setAttribute("data-theme", t);
    try {
      if (t === "system") localStorage.removeItem("vv-theme");
      else localStorage.setItem("vv-theme", t);
    } catch {}
  }

  return (
    <button type="button" className="btn theme-btn" onClick={click} aria-label={`${tr(LABEL[theme])}. ${tr("Mainīt")}`} title={tr(LABEL[theme])}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICON[theme]}
      </svg>
    </button>
  );
}
