"use client";
import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <select
      aria-label="Kārtot"
      value={value}
      onChange={(e) => {
        const p = new URLSearchParams(sp.toString());
        if (e.target.value === "new") p.delete("sort");
        else p.set("sort", e.target.value);
        p.delete("page");
        router.push(p.toString() ? `/?${p}` : "/", { scroll: false });
      }}
    >
      <option value="new">Jaunākie</option>
      <option value="cheap">Lētākie</option>
      <option value="dear">Dārgākie</option>
      <option value="drop">Lielākais cenu kritums</option>
      <option value="old">Visilgāk tirgū</option>
    </select>
  );
}
