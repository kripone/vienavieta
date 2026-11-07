"use client";
import { useRouter } from "next/navigation";

type Opt = { value: string; label: string };

/** Izvēlnes tirgus lapā: maiņa uzreiz atver jauno skatu (saite paliek dalāma). */
export function MarketSelect({ name, value, options, params, reset = [], label }: { name: string; value: string; options: Opt[]; params: Record<string, string>; reset?: string[]; label: string }) {
  const router = useRouter();
  return (
    <label className="field">
      {label}
      <select
        value={value}
        onChange={(e) => {
          const p = new URLSearchParams(params);
          for (const k of reset) p.delete(k);
          if (e.target.value) p.set(name, e.target.value);
          else p.delete(name);
          router.push(`/tirgus?${p}`);
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
