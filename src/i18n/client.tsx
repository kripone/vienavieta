"use client";
import { createContext, useContext, useMemo } from "react";
import { makeT, type Dict, type Locale } from "./core";

const Ctx = createContext<{ locale: Locale; dict: Dict; prefix: string }>({ locale: "lv", dict: {}, prefix: "" });

export function I18nProvider({ locale, dict, prefix = "", children }: { locale: Locale; dict: Dict; prefix?: string; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, dict, prefix }), [locale, dict, prefix]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Klienta komponentiem: const { t, tp, locale } = useT(); */
export function useT() {
  const { locale, dict, prefix } = useContext(Ctx);
  return useMemo(() => ({ ...makeT(locale, dict), prefix, lp: (p: string) => (prefix ? (p === "/" ? prefix : `${prefix}${p}`) : p) }), [locale, dict, prefix]);
}
