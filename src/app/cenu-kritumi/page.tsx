import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { langAlternates } from "@/lib/seo";
import { ListingCard, priceUnit } from "@/components/listing-card";
import { changeCounts, recentChanges } from "@/lib/history";
import { CHANGES_PER_PAGE } from "@/lib/constants";
import { alsoAt } from "@/lib/dedupe";
import { priceEvals } from "@/lib/price-eval";
import { vzdBadges } from "@/lib/vzd";
import { formatPrice, timeAgo } from "@/lib/format";
import { soft } from "@/lib/errors";

export async function generateMetadata(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { t, locale } = await getT();
  const filtered = Object.keys(await props.searchParams).length > 0;
  return { alternates: langAlternates("/cenu-kritumi", locale), robots: filtered ? { index: false, follow: true } : undefined, title: t("Cenu kritumi"), description: t("Sludinājumi, kuriem pēdējās dienās samazināta cena: auto un nekustamais īpašums.") };
}
export const dynamic = "force-dynamic";

const PERIODS = { "1": "24 stundās", "7": "7 dienās", "30": "30 dienās" } as const;
/** Cilnes (URL parametrs tab): jaunākie kritumi, lielākie kritumi, cenu kāpumi */
const TABS = { jaunakie: "Jaunākie", kritumi: "Lielākais kritums", kapumi: "Cenu kāpumi" } as const;
type Tab = keyof typeof TABS;

export default async function DropsPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { t } = await getT();
  const sp = await props.searchParams;
  const kind = sp.k === "auto" ? "vehicle" : sp.k === "ipasumi" ? "property" : undefined;
  const days = sp.d === "1" || sp.d === "30" ? sp.d : "7";
  const tab: Tab = sp.tab === "kritumi" || sp.tab === "kapumi" ? sp.tab : "jaunakie";
  const up = tab === "kapumi";
  const page = Math.max(1, Math.min(200, Number(sp.p) || 1));
  const [rows, counts] = await Promise.all([
    recentChanges({ kind, days: Number(days), limit: CHANGES_PER_PAGE, offset: (page - 1) * CHANGES_PER_PAGE, dir: up ? "up" : "down", order: tab === "jaunakie" ? "time" : "pct" }).catch(soft("cenu-kritumi", [])),
    changeCounts({ kind, days: Number(days) }).catch(soft("cenu-kritumi", null)),
  ]);
  const [also, evals, vzd] = await Promise.all([
    alsoAt(rows.map((r) => r.card)).catch(soft("cenu-kritumi", new Map())),
    priceEvals(rows.map((r) => r.card.id)).catch(soft("cenu-kritumi", new Map())),
    vzdBadges(rows.filter((r) => r.card.kind === "property").map((r) => r.card.id)).catch(soft("cenu-kritumi", new Map())),
  ]);
  const k = sp.k === "auto" || sp.k === "ipasumi" ? sp.k : undefined;
  const q = (o: { k?: string; d?: string; tab?: Tab; p?: number }) => {
    const p = new URLSearchParams();
    if (o.p && o.p > 1) p.set("p", String(o.p));
    if (o.tab && o.tab !== "jaunakie") p.set("tab", o.tab);
    if (o.k) p.set("k", o.k);
    if (o.d && o.d !== "7") p.set("d", o.d);
    return p.toString() ? `/cenu-kritumi?${p}` : "/cenu-kritumi";
  };
  const count = (x: Tab) => (counts ? (x === "kapumi" ? counts.up : counts.down) : null);
  const money = (v: number, deal: string | null) => `${formatPrice(v)}${priceUnit(deal, t)}`;
  return (
    <main className="wrap">
      <h1>{t(up ? "Cenu kāpumi" : "Cenu kritumi")}</h1>
      <p className="lead">
        {up
          ? t("Sludinājumi, kuriem cena paaugstināta {period}.", { period: t(PERIODS[days]) })
          : t("Sludinājumi, kuriem cena samazināta {period}. Visu sarakstu var kārtot arī meklēšanā: „Lielākais cenu kritums”.", { period: t(PERIODS[days]) })}
      </p>
      <nav className="seg mod-tabs" aria-label={t("Skats")}>
        {(Object.keys(TABS) as Tab[]).map((x) => (
          <a key={x} href={q({ k, d: days, tab: x })} aria-current={tab === x ? "page" : undefined}>
            {t(TABS[x])}{count(x) != null ? ` (${count(x)})` : ""}
          </a>
        ))}
      </nav>
      <nav className="seg mod-tabs" aria-label={t("Sadaļa")}>
        <a href={q({ d: days, tab })} aria-current={!k ? "page" : undefined}>{t("Visi")}</a>
        <a href={q({ k: "auto", d: days, tab })} aria-current={k === "auto" ? "page" : undefined}>{t("Transports")}</a>
        <a href={q({ k: "ipasumi", d: days, tab })} aria-current={k === "ipasumi" ? "page" : undefined}>{t("Īpašumi")}</a>
      </nav>
      <nav className="seg mod-tabs" aria-label={t("Periods")}>
        {Object.entries(PERIODS).map(([d, label]) => (
          <a key={d} href={q({ k, d, tab })} aria-current={days === d ? "page" : undefined}>{t(label)}</a>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="empty">{t(up ? "Šajā periodā cenu kāpumu nav." : "Šajā periodā cenu kritumu nav.")}</p>
      ) : (
        <div className="list">
          {rows.map(({ card, prev, at, diff, pct }) => (
            <div key={card.id} className="drop-item">
              <p className="fine">
                {timeAgo(at, t)}: {money(prev, card.deal)} → <b>{money(card.price, card.deal)}</b> ({diff > 0 ? "+" : "−"}{formatPrice(Math.abs(diff))}, {pct > 0 ? "+" : "−"}{Math.abs(pct)}%)
              </p>
              <ListingCard l={card} oldPrice={prev} also={also.get(card.id)} evaluation={evals.get(card.id)} vzd={vzd.get(card.id)} compare />
            </div>
          ))}
        </div>
      )}
      {(() => {
        const total = count(tab) ?? 0;
        const pages = Math.ceil(total / CHANGES_PER_PAGE);
        if (pages <= 1) return null;
        return (
          <nav className="pager" aria-label={t("Lapas")}>
            {page > 1 && <a href={q({ k, d: days, tab, p: page - 1 })}>{t("‹ Iepriekšējā")}</a>}
            <span>{t("{n}. lapa no {m}", { n: page, m: pages })}</span>
            {page < pages && <a href={q({ k, d: days, tab, p: page + 1 })}>{t("Nākamā ›")}</a>}
          </nav>
        );
      })()}
    </main>
  );
}
