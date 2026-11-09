"use client";
// Markas un modeļa izvēle novērtējuma formai (katalogs no /api/catalog).
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";

type Make = { id: number; name: string; popular: boolean; models: { id: number; name: string }[] };

export function VehiclePicker({ make, model }: { make?: number; model?: number }) {
  const { t } = useT();
  const [makes, setMakes] = useState<Make[]>([]);
  const [mk, setMk] = useState(make ? String(make) : "");
  const [md, setMd] = useState(model ? String(model) : "");
  useEffect(() => {
    fetch("/api/catalog?class=car").then((r) => r.json()).then((d: Make[]) => setMakes(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  const models = makes.find((m) => String(m.id) === mk)?.models ?? [];
  const popular = makes.filter((m) => m.popular);
  return (
    <>
      <label className="field">
        <span>{t("Marka")} *</span>
        <select name="make" required value={mk} onChange={(e) => { setMk(e.target.value); setMd(""); }}>
          <option value="">{t("Izvēlies")}</option>
          {popular.length > 0 && <optgroup label={t("Populārākās")}>{popular.map((m) => <option key={`p${m.id}`} value={m.id}>{m.name}</option>)}</optgroup>}
          <optgroup label={t("Visas")}>{makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>
        </select>
      </label>
      <label className="field">
        <span>{t("Modelis")} *</span>
        <select name="model" required value={md} onChange={(e) => setMd(e.target.value)} disabled={!models.length}>
          <option value="">{t("Izvēlies")}</option>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
    </>
  );
}
