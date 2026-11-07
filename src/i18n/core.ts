// Tulkojumi: atslēga ir latviešu teksts (tas pats, kas saskarnē), vērtība — tulkojums.
// Ja tulkojuma nav, rāda latvisko tekstu. Vārdu formas skaitļiem: vērtība ar Intl.PluralRules kategorijām.
export const LOCALES = ["lv", "en", "ru", "lt"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_LABEL: Record<Locale, string> = { lv: "LV", en: "EN", ru: "RU", lt: "LT" };
export const LOCALE_NAME: Record<Locale, string> = { lv: "Latviešu", en: "English", ru: "Русский", lt: "Lietuvių" };
export const INTL_LOCALE: Record<Locale, string> = { lv: "lv-LV", en: "en-GB", ru: "ru-RU", lt: "lt-LT" };

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>>;
export type Dict = Record<string, string | PluralForms>;
export type Vars = Record<string, string | number | null | undefined>;

const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? "" : String(vars[k]))) : s);

export function makeT(locale: Locale, dict: Dict) {
  const nf = new Intl.NumberFormat(INTL_LOCALE[locale]);
  const pr = new Intl.PluralRules(INTL_LOCALE[locale]);
  /** t("Meklēt"), t("Lapa {n} no {m}", { n, m }) */
  const t = (key: string, vars?: Vars) => {
    const v = dict[key];
    return fill(typeof v === "string" ? v : v && typeof v === "object" ? (v.one ?? key) : key, vars);
  };
  /** Skaitlis ar vārdu: tp(5, "sludinājums", "sludinājumi") → "5 sludinājumi" / "5 listings" / "5 объявлений" */
  const tp = (n: number, one: string, many: string) => {
    const v = dict[one];
    let word: string;
    if (v && typeof v === "object") word = v[pr.select(n)] ?? v.other ?? v.many ?? one;
    else word = n % 10 === 1 && n % 100 !== 11 ? (typeof v === "string" ? v : one) : typeof dict[many] === "string" ? (dict[many] as string) : many;
    return `${nf.format(n)} ${word}`;
  };
  return { t, tp, locale };
}
export type T = ReturnType<typeof makeT>["t"];
export type TP = ReturnType<typeof makeT>["tp"];
