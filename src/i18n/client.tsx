"use client";
import { createContext, useContext, useMemo } from "react";
import { makeT, type Dict, type Locale } from "./core";

const Ctx = createContext<{ locale: Locale; dict: Dict }>({ locale: "lv", dict: {} });

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, dict }), [locale, dict]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Klienta komponentiem: const { t, tp, locale } = useT(); */
export function useT() {
  const { locale, dict } = useContext(Ctx);
  return useMemo(() => makeT(locale, dict), [locale, dict]);
}
