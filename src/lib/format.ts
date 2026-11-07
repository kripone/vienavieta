const nf = new Intl.NumberFormat("lv-LV");

export const formatNumber = (n: number) => nf.format(n);
export const formatPrice = (eur: number) => `${nf.format(eur)} €`;

export function timeAgo(date: Date, now = new Date()): string {
  const h = Math.floor((now.getTime() - date.getTime()) / 3_600_000);
  if (h < 1) return "tikko";
  if (h < 24) return `pirms ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "vakar" : `pirms ${d} d.`;
}

/** Latviešu skaitlis + vārds: 1, 21, 31… vienskaitlī (izņemot 11), pārējie daudzskaitlī. */
export function plural(n: number, one: string, many: string) {
  const word = n % 10 === 1 && n % 100 !== 11 ? one : many;
  return `${n.toLocaleString("lv-LV")} ${word}`;
}
