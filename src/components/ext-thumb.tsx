"use client";
import { useState } from "react";
import { Ill } from "./ill";

/**
 * Ārēja sludinājuma sīktēls tieši no avota servera (piem. i.ss.com). Mēs to neglabājam un nelejupielādējam.
 * Rezerves ķēde pret karsto saišu bloķēšanu: src → fallbackSrc (ja dots) → mūsu ilustrācija.
 */
export function ExtThumb({ src, fallbackSrc, source, fallback, alt = "" }: { src: string; fallbackSrc?: string | null; source: string; fallback: string; alt?: string }) {
  const candidates = [src, ...(fallbackSrc && fallbackSrc !== src ? [fallbackSrc] : [])];
  const [idx, setIdx] = useState(0);
  if (idx >= candidates.length) return <Ill svg={fallback} />;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={candidates[idx]} alt={alt} loading="lazy" onError={() => setIdx((i) => i + 1)} />
      {source && <span className="ext-credit">Foto: {source}</span>}
    </>
  );
}
