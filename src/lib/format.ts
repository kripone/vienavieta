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
