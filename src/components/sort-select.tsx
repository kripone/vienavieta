"use client";
import { useT } from "@/i18n/client";
import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const { t } = useT();
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <select
      aria-label={t("Kārtot")}
      value={value}
      onChange={(e) => {
        const p = new URLSearchParams(sp.toString());
        if (e.target.value === "new") p.delete("sort");
        else p.set("sort", e.target.value);
        p.delete("page");
        router.push(p.toString() ? `/?${p}` : "/", { scroll: false });
      }}
    >
      <option value="new">{t("Jaunākie")}</option>
      <option value="cheap">{t("Lētākie")}</option>
      <option value="dear">{t("Dārgākie")}</option>
      <option value="drop">{t("Lielākais cenu kritums")}</option>
      <option value="old">{t("Visilgāk tirgū")}</option>
    </select>
  );
}
