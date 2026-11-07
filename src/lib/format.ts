const nf = new Intl.NumberFormat("lv-LV");

export const formatNumber = (n: number) => nf.format(n);
export const formatPrice = (eur: number) => `${nf.format(eur)} €`;

type Tr = (key: string, vars?: Record<string, string | number>) => string;
const lvT: Tr = (k, v) => (v ? k.replace(/\{(\w+)\}/g, (_, x) => String(v[x])) : k);

/** "tikko", "pirms 3 h", "vakar", "pirms 5 d." (t — tulkošanas funkcija no src/i18n) */
export function timeAgo(date: Date, t: Tr = lvT, now = new Date()): string {
  const h = Math.floor((now.getTime() - date.getTime()) / 3_600_000);
  if (h < 1) return t("tikko");
  if (h < 24) return t("pirms {h} h", { h });
  const d = Math.floor(h / 24);
  return d === 1 ? t("vakar") : t("pirms {d} d.", { d });
}

/** Latviešu skaitlis + vārds: 1, 21, 31… vienskaitlī (izņemot 11), pārējie daudzskaitlī. */
export function plural(n: number, one: string, many: string) {
  const word = n % 10 === 1 && n % 100 !== 11 ? one : many;
  return `${n.toLocaleString("lv-LV")} ${word}`;
}
