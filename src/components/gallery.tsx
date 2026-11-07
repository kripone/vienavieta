"use client";
import { useState } from "react";

type Photo = { id: string; url: string; thumbUrl: string };

export function Gallery({ photos, title, placeholder }: { photos: Photo[]; title: string; placeholder: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) return <div className="gal-main empty"><span>{placeholder}</span></div>;
  const n = photos.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);
  return (
    <div className="gal" onKeyDown={(e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}>
      <div className="gal-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[i].url} alt={`${title}, bilde ${i + 1} no ${n}`} />
        {n > 1 && (
          <>
            <button type="button" className="gal-nav prev" onClick={() => go(-1)} aria-label="Iepriekšējā bilde">‹</button>
            <button type="button" className="gal-nav next" onClick={() => go(1)} aria-label="Nākamā bilde">›</button>
            <span className="gal-count">{i + 1} / {n}</span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="gal-strip">
          {photos.map((p, j) => (
            <button type="button" key={p.id} aria-current={j === i} onClick={() => setI(j)} aria-label={`Bilde ${j + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbUrl} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
