"use client";
// Favorītu reklāmas baneris sludinājuma lapā zem kalkulatora: datorā vertikālais, telefonā horizontālais.
// Oriģināli GIF (līdz 5 MB) pārvērsti par MP4 (~30–100 KB, public/banners); video ielādējas tikai, kad baneris tuvojas ekrānam.
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";

/** Izmēri (platums × augstums) aspect-ratio rezervei, lai lapa nelēkā (CLS). LT vertikālais ir garāks. */
const SIZE: Record<string, [number, number]> = { h: [360, 120], v: [360, 720], "v-lt": [360, 1080] };

function Clip({ kind, alt }: { kind: "h" | "v"; alt: string }) {
  const { locale } = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const base = `/banners/fav-${kind}-${locale}`;
  const [w, h] = SIZE[`${kind}-${locale}`] ?? SIZE[kind];
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      className={`fav-banner fav-banner-${kind}`}
      style={{ aspectRatio: `${w} / ${h}` }}
      poster={`${base}.webp`}
      src={on ? `${base}.mp4` : undefined}
      autoPlay muted loop playsInline preload="none"
      aria-label={alt}
    />
  );
}

export function FavBanner({ kind }: { kind: "h" | "v" }) {
  const { t } = useT();
  return <Clip kind={kind} alt={t("Saglabā favorītos: piezīmes, statuss, kalendārs un cenu kritumu paziņojumi – viss vienuviet.")} />;
}
