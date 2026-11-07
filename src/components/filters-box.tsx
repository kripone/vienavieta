"use client";
import { useEffect, useRef } from "react";
import { useT } from "@/i18n/client";

/** Filtru bloks: datorā vienmēr atvērts, telefonā aizvērts, lai uzreiz redzami rezultāti. */
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
      <summary>{t("Filtri")}{active > 0 ? ` (${active})` : ""}</summary>
      {children}
    </details>
  );
}
