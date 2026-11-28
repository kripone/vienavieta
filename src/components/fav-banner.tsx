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

/** Viss baneris ir saite: pieteiktam – uz favorītiem, citādi – uz pieteikšanos/reģistrāciju. */
export function FavBanner({ kind, loggedIn }: { kind: "h" | "v"; loggedIn: boolean }) {
  const { t, lp } = useT();
  const alt = t("Saglabā favorītos: piezīmes, statuss, kalendārs un cenu kritumu paziņojumi – viss vienuviet.");
  return (
    <a className={`fav-banner-link fav-banner-link-${kind}`} href={lp(loggedIn ? "/favoriti" : "/ielogoties")} aria-label={alt}>
      <Clip kind={kind} alt={alt} />
    </a>
  );
}
