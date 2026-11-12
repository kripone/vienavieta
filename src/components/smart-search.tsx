"use client";
// Brīvā teksta meklēšana (→ /mekle) un attāluma / brauciena laika zona no adreses (→ /api/zone → parametrs `zone`).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/i18n/client";

const MIN = [5, 10, 15, 20, 30, 45];
const KM = [1, 2, 5, 10, 20, 50];

export function SmartSearch({ flat, action }: { flat: Record<string, string>; action: string }) {
  const { t } = useT();
  const router = useRouter();
  const zl = (flat.zl ?? "").split("|");
  const [addr, setAddr] = useState(flat.zone && zl[3] ? zl[3] : "");
  const [range, setRange] = useState(flat.zone && zl[0] ? `${zl[0]}:${zl[1]}` : "min:15");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function apply(coords?: { lat: number; lon: number }) {
    if (!coords && !addr.trim()) return setError(t("Ieraksti adresi."));
    setBusy(true);
    setError("");
    try {
      const [unit, value] = range.split(":");
      const q = new URLSearchParams({ unit, value, ...(coords ? { lat: String(coords.lat), lon: String(coords.lon) } : { addr: addr.trim() }) });
      const r = await fetch(`/api/zone?${q}`);
      if (r.status === 404) return setError(t("Adresi neatradām. Pamēģini ar ielu un pilsētu, piem. „Brīvības iela 100, Rīga”."));
      if (!r.ok) return setError(t("Neizdevās aprēķināt zonu. Mēģini vēlreiz."));
      const d = (await r.json()) as { zone: string; label: string; approx: boolean };
      const p = new URLSearchParams(Object.entries(flat).filter(([k]) => !["page", "zone", "zl"].includes(k)));
      p.set("zone", d.zone);
      p.set("zl", [unit, value, d.approx ? "1" : "0", (d.label || (coords ? t("mana atrašanās vieta") : addr.trim())).replace(/\|/g, " ").slice(0, 80)].join("|"));
      router.push(`/?${p}`, { scroll: false });
    } catch {
      setError(t("Neizdevās aprēķināt zonu. Mēģini vēlreiz."));
    } finally {
      setBusy(false);
    }
  }
  function here() {
    if (!navigator.geolocation) return setError(t("Pārlūks neatbalsta atrašanās vietas noteikšanu."));
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => apply({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => { setBusy(false); setError(t("Neizdevās noteikt atrašanās vietu. Ieraksti adresi.")); },
      { timeout: 10000 },
    );
  }

  return (
    <div className="smart">
      <form className="smart-text" action={action} method="get" role="search">
        <input name="q" type="search" defaultValue={flat.tq ?? ""} maxLength={200} aria-label={t("Raksti, ko meklē")}
          placeholder={t("Raksti, ko meklē: „dīzeļa universālis līdz 6000 € ar automātu” vai „3 istabu dzīvoklis Rīgas centrā”")} />
        <button className="btn primary">🔎 <span>{t("Meklēt")}</span></button>
      </form>
      <details className="smart-near" open={Boolean(flat.zone && flat.zl)}>
        <summary>📍 {t("Attālums vai brauciena laiks no adreses")}</summary>
        <div className="smart-near-row">
          <input value={addr} onChange={(e) => setAddr(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }}
            placeholder={t("Darba vai mājas adrese, piem. Brīvības iela 100, Rīga")} aria-label={t("Adrese")} maxLength={150} />
          <select value={range} onChange={(e) => setRange(e.target.value)} aria-label={t("Attālums")}>
            <optgroup label={t("Brauciens ar auto")}>{MIN.map((m) => <option key={m} value={`min:${m}`}>{t("līdz {n} min", { n: m })}</option>)}</optgroup>
            <optgroup label={t("Rādiuss")}>{KM.map((k) => <option key={k} value={`km:${k}`}>{t("līdz {n} km", { n: k })}</option>)}</optgroup>
          </select>
          <button type="button" className="btn primary" disabled={busy} onClick={() => apply()}>{t("Rādīt")}</button>
          <button type="button" className="btn" disabled={busy} onClick={here} title={t("Mana atrašanās vieta")}>◎ <span className="hide-sm">{t("Mana atrašanās vieta")}</span></button>
        </div>
        {error && <p className="err">{error}</p>}
      </details>
    </div>
  );
}
