"use client";

import { useEffect, useState } from "react";

/**
 * Mobilā izvēlne: datorā bērni rādās inline (display:contents), telefonā
 * tie aizveras zem ☰ pogas pilnekrāna panelī.
 */
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="mm">
      <button type="button" className="btn mm-burger" aria-label="Izvēlne" aria-expanded={open} onClick={() => setOpen(true)}>
        ☰
      </button>
      <div
        className="mm-panel"
        data-open={open}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <button type="button" className="btn mm-close" aria-label="Aizvērt izvēlni" onClick={() => setOpen(false)}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
