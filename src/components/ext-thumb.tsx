"use client";
import { useState } from "react";
import { Ill } from "./ill";
import { listingIll } from "@/lib/illustrations";

/** Ilustrācijas izvēlei vajadzīgie lauki (SVG aprēķina pārlūkā – neliekam ~3 KB virkni katras kartītes datos). */
export type IllFor = Parameters<typeof listingIll>[0];

/**
 * Ārēja sludinājuma sīktēls tieši no avota servera (piem. i.ss.com). Mēs to neglabājam un nelejupielādējam.
 * Rezerves ķēde pret karsto saišu bloķēšanu: src → fallbackSrc (ja dots) → mūsu ilustrācija.
 */
export function ExtThumb({ src, fallbackSrc, source, ill, alt = "", priority }: { src: string; fallbackSrc?: string | null; source: string; ill: IllFor; alt?: string; priority?: boolean }) {
  const candidates = [src, ...(fallbackSrc && fallbackSrc !== src ? [fallbackSrc] : [])];
  const [idx, setIdx] = useState(0);
  if (idx >= candidates.length) return <Ill svg={listingIll(ill)} />;
  return (
    <>
      {/* izplūdis fons tai pašai bildei: stāvas bildes lielajās kartītēs rāda veselas (CSS .ext-bg) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ext-bg" src={candidates[idx]} alt="" aria-hidden="true" loading={priority ? "eager" : "lazy"} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ext-main" src={candidates[idx]} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} onError={() => setIdx((i) => i + 1)} />
      {source && <span className="ext-credit">Foto: {source}</span>}
    </>
  );
}
