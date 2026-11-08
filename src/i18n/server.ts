import { cookies, headers } from "next/headers";
import { cache } from "react";
import { LOCALES, makeT, type Dict, type Locale } from "./core";
import { DICTS } from "./dicts";

export const LOCALE_COOKIE = "lang";
/** Galvene, ko src/proxy.ts pieliek adresēm ar valodas prefiksu (/en/…, /ru/…, /lt/…). */
export const URL_LOCALE_HEADER = "x-url-locale";

/** Valoda no adreses prefiksa (tikai en/ru/lt; latviešu valodai prefiksa nav). */
export const getUrlLocale = cache(async (): Promise<Locale | null> => {
  const v = (await headers()).get(URL_LOCALE_HEADER);
  return v && v !== "lv" && (LOCALES as readonly string[]).includes(v) ? (v as Locale) : null;
});

/** Lietotāja valoda: adreses prefikss → sīkdatne → latviešu. */
export const getLocale = cache(async (): Promise<Locale> => {
  const fromUrl = await getUrlLocale();
  if (fromUrl) return fromUrl;
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(v ?? "") ? (v as Locale) : "lv";
});

/** Adreses prefikss pašreizējai lapai ("" vai "/en"); iekšējās saites to saglabā, lai meklētāji atrastu tulkotās lapas. */
export async function getPrefix() {
  const l = await getUrlLocale();
  return l ? `/${l}` : "";
}

export const withPrefix = (prefix: string, path: string) => (prefix ? (path === "/" ? prefix : `${prefix}${path}`) : path);

/** Servera komponentiem: const { t, tp, lp } = await getT(); lp("/auto") → "/en/auto" angļu adresē. */
export async function getT() {
  const locale = await getLocale();
  const prefix = await getPrefix();
  return { ...makeT(locale, DICTS[locale] as Dict), prefix, lp: (p: string) => withPrefix(prefix, p) };
}
