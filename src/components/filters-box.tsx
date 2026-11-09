"use client";
import { useEffect, useRef } from "react";
import { useT } from "@/i18n/client";

/** Filtru bloks: datorā vienmēr atvērts, telefonā aizvērts, lai uzreiz redzami rezultāti.
 *  Telefonā virsraksts izskatās kā poga ar ikonu un norādi „Atvērt” / „Aizvērt”, lai būtu skaidrs, ka tas jāspiež. */
export function FiltersBox({ active, children }: { active: number; children: React.ReactNode }) {
  const { t } = useT();
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const sync = () => { if (ref.current && mq.matches) ref.current.open = true; };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return (
    <details ref={ref} className="filters-box">
      <summary>
        <svg className="fb-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
          <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
        </svg>
        <span className="fb-label">{t("Filtri")}</span>
        {active > 0 && <span className="fb-count">{active}</span>}
        <span className="fb-hint fb-open">{t("Atvērt")} ▾</span>
        <span className="fb-hint fb-close">{t("Aizvērt")} ▴</span>
      </summary>
      {children}
    </details>
  );
}
