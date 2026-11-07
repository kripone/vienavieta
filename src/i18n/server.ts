import { cookies } from "next/headers";
import { cache } from "react";
import { LOCALES, makeT, type Dict, type Locale } from "./core";
import { DICTS } from "./dicts";

export const LOCALE_COOKIE = "lang";

/** Lietotāja valoda no sīkdatnes (noklusējums: latviešu). */
export const getLocale = cache(async (): Promise<Locale> => {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(v ?? "") ? (v as Locale) : "lv";
});

/** Servera komponentiem: const { t, tp } = await getT(); */
export async function getT() {
  const locale = await getLocale();
  return makeT(locale, DICTS[locale] as Dict);
}
