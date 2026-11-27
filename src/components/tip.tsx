"use client";
// Īsa pamācība (1–3 soļi) lapas kontekstā: parādās vienreiz, pēc „Sapratu” vairs nerādās (atcerēts pārlūkā).
// Teksti ir latviski atslēgas (tulkojumi src/i18n/{en,ru,lt}.ts).
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";

export type TipStep = { icon: string; title: string; text: string };

const KEY = (id: string) => `vv-tip:${id}`;

export function Tip({ id, steps }: { id: string; steps: TipStep[] }) {
  const { t } = useT();
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY(id))) setShow(true);
    } catch {
      // bez pārlūka atmiņas (privātais režīms) pamācību nerādām, lai tā neparādās katru reizi
    }
  }, [id]);
  if (!show || !steps.length) return null;
  const close = () => {
    try { localStorage.setItem(KEY(id), "1"); } catch {}
    setShow(false);
  };
  const s = steps[i];
  const last = i === steps.length - 1;
  return (
    <aside className="tip" role="note" aria-label={t("Padoms")}>
      <span className="tip-ico" aria-hidden="true">{s.icon}</span>
      <div className="tip-body">
        <b>{t(s.title)}</b>
        <p>{t(s.text)}</p>
        <div className="tip-nav">
          {steps.length > 1 && (
            <span className="tip-dots" aria-label={t("{a} no {b}", { a: i + 1, b: steps.length })}>
              {steps.map((_, k) => <i key={k} className={k === i ? "on" : undefined} />)}
            </span>
          )}
          {last ? (
            <button type="button" className="btn small primary" onClick={close}>{t("Skaidrs")}</button>
          ) : (
            <button type="button" className="btn small primary" onClick={() => setI(i + 1)}>{t("Tālāk")}</button>
          )}
        </div>
      </div>
      <button type="button" className="tip-x" onClick={close} aria-label={t("Aizvērt")}>×</button>
    </aside>
  );
}
