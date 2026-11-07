"use client";
import { useState } from "react";
import { Ill } from "./ill";

/**
 * Ārēja sludinājuma sīktēls tieši no avota servera (piem. i.ss.com). Mēs to neglabājam un nelejupielādējam.
 * Ja avots bildi neatdod, rāda mūsu ilustrāciju.
 */
export function ExtThumb({ src, source, fallback }: { src: string; source: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Ill svg={fallback} />;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      <span className="ext-credit">Foto: {source}</span>
    </>
  );
}
