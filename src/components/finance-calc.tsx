"use client";
// Līzinga (transports) un hipotēkas (pārdodami īpašumi) kalkulators sludinājuma lapā.
// Anuitātes maksājums; likmes un termiņi ir noklusējumi no FINANCE (constants.ts), lietotājs tos maina.
// Tikai aptuvens aprēķins: nav bankas piedāvājums, dati netiek sūtīti uz serveri.
import { useState } from "react";
import { useT } from "@/i18n/client";
import { FINANCE } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

/** Mēneša maksājums: aizdevums `loan`, gada likme `ratePct`, `n` mēneši, atlikusī vērtība `balloon` (maksā beigās). */
export function monthlyPayment(loan: number, ratePct: number, n: number, balloon = 0): number {
  if (loan <= 0 || n <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return (loan - balloon) / n;
  const pv = loan - balloon / Math.pow(1 + r, n);
  return (pv * r) / (1 - Math.pow(1 + r, -n));
}

const dec = (n: number) => String(n).replace(".", ","); // latviski decimālkomats
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);

export function FinanceCalc({ price, kind }: { price: number; kind: "lease" | "mortgage" }) {
  const { t } = useT();
  const lease = kind === "lease";
  const d = lease ? FINANCE.lease : FINANCE.mortgage;
  const [downPct, setDownPct] = useState<string>(String(d.downPct));
  const [term, setTerm] = useState<number>(lease ? FINANCE.lease.months : FINANCE.mortgage.years);
  const [rate, setRate] = useState<string>(dec(lease ? FINANCE.lease.ratePct : Math.round((FINANCE.EURIBOR_6M + FINANCE.mortgage.marginPct) * 100) / 100));
  const [balloonPct, setBalloonPct] = useState<string>(String(FINANCE.lease.balloonPct));

  const dp = clamp(Number(downPct.replace(",", ".")), 0, 90);
  const rp = clamp(Number(rate.replace(",", ".")), 0, 30);
  const bp = lease ? clamp(Number(balloonPct.replace(",", ".")), 0, 60) : 0;
  const down = Math.round((price * dp) / 100);
  const loan = price - down;
  const n = lease ? term : term * 12;
  const balloon = Math.round((price * bp) / 100);
  const pay = monthlyPayment(loan, rp, n, Math.min(balloon, loan));
  const total = pay * n + Math.min(balloon, loan);
  const interest = Math.max(0, total - loan);

  return (
    <section className="fin-calc" id="kalkulators">
      <h2>{lease ? t("Līzinga kalkulators") : t("Hipotēkas kalkulators")}</h2>
      <div className="fin-box">
        <div className="fin-fields">
          <label className="field">
            {t("Pirmā iemaksa, %")}
            <input inputMode="decimal" value={downPct} onChange={(e) => setDownPct(e.target.value)} />
            <span className="fine">{formatPrice(down)}</span>
          </label>
          <label className="field">
            {lease ? t("Termiņš, mēneši") : t("Termiņš, gadi")}
            <select value={term} onChange={(e) => setTerm(Number(e.target.value))}>
              {d.termOptions.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label className="field">
            {t("Gada procentu likme, %")}
            <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
            {!lease && <span className="fine">{t("EURIBOR 6 mēn. {e}% + bankas marža {m}%", { e: String(FINANCE.EURIBOR_6M).replace(".", ","), m: String(FINANCE.mortgage.marginPct).replace(".", ",") })}</span>}
          </label>
          {lease && (
            <label className="field">
              {t("Atlikusī vērtība, %")}
              <input inputMode="decimal" value={balloonPct} onChange={(e) => setBalloonPct(e.target.value)} />
              <span className="fine">{balloon ? formatPrice(balloon) : t("nav")}</span>
            </label>
          )}
        </div>
        <div className="fin-result" aria-live="polite">
          <span className="fine">{t("Mēneša maksājums")}</span>
          <b>{formatPrice(Math.round(pay))}</b>
          <dl>
            <div><dt>{lease ? t("Līzinga summa") : t("Kredīta summa")}</dt><dd>{formatPrice(loan)}</dd></div>
            <div><dt>{t("Procentos kopā")}</dt><dd>{formatPrice(Math.round(interest))}</dd></div>
            <div><dt>{t("Kopā samaksāsi")}</dt><dd>{formatPrice(Math.round(total + down))}</dd></div>
            {lease && balloon > 0 && <div><dt>{t("Beigās jāsamaksā")}</dt><dd>{formatPrice(Math.min(balloon, loan))}</dd></div>}
          </dl>
        </div>
      </div>
      <p className="fine">
        {t("Aptuvens aprēķins ar anuitātes maksājumiem, nav bankas piedāvājums. Reālā likme un nosacījumi atkarīgi no bankas vai līzinga devēja un tavas maksātspējas.")}
        {!lease && ` ${t("Bankas parasti prasa pirmo iemaksu vismaz 10–15%.")}`}
      </p>
    </section>
  );
}
