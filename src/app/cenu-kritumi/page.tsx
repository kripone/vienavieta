import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { langAlternates } from "@/lib/seo";
import { ListingCard } from "@/components/listing-card";
import { recentDrops } from "@/lib/history";
import { alsoAt } from "@/lib/dedupe";
import { priceEvals } from "@/lib/price-eval";
import { vzdBadges } from "@/lib/vzd";
import { formatPrice, timeAgo } from "@/lib/format";

export async function generateMetadata(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { t, locale } = await getT();
  const filtered = Object.keys(await props.searchParams).length > 0;
  return { alternates: langAlternates("/cenu-kritumi", locale), robots: filtered ? { index: false, follow: true } : undefined, title: t("Cenu kritumi"), description: t("Sludinājumi, kuriem pēdējās dienās samazināta cena: auto un nekustamais īpašums.") };
}
export const dynamic = "force-dynamic";

const PERIODS = { "1": "24 stundās", "7": "7 dienās", "30": "30 dienās" } as const;

export default async function DropsPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { t } = await getT();
  const sp = await props.searchParams;
  const kind = sp.k === "auto" ? "vehicle" : sp.k === "ipasumi" ? "property" : undefined;
  const days = sp.d === "1" || sp.d === "30" ? sp.d : "7";
  const rows = await recentDrops({ kind, days: Number(days), limit: 60 }).catch(() => []);
  const [also, evals, vzd] = await Promise.all([
    alsoAt(rows.map((r) => r.card)).catch(() => new Map()),
    priceEvals(rows.map((r) => r.card.id)).catch(() => new Map()),
    vzdBadges(rows.filter((r) => r.card.kind === "property").map((r) => r.card.id)).catch(() => new Map()),
  ]);
  const q = (k?: string, d?: string) => {
    const p = new URLSearchParams();
    if (k) p.set("k", k);
    if (d && d !== "7") p.set("d", d);
    return p.toString() ? `/cenu-kritumi?${p}` : "/cenu-kritumi";
  };
  const k = sp.k === "auto" || sp.k === "ipasumi" ? sp.k : undefined;
  return (
    <main className="wrap">
      <h1>{t("Cenu kritumi")}</h1>
      <p className="lead">{t("Sludinājumi, kuriem cena samazināta {period}. Visu sarakstu var kārtot arī meklēšanā: „Lielākais cenu kritums”.", { period: t(PERIODS[days]) })}</p>
      <nav className="seg mod-tabs" aria-label={t("Sadaļa")}>
        <a href={q(undefined, days)} aria-current={!k ? "page" : undefined}>{t("Visi")}</a>
        <a href={q("auto", days)} aria-current={k === "auto" ? "page" : undefined}>{t("Transports")}</a>
        <a href={q("ipasumi", days)} aria-current={k === "ipasumi" ? "page" : undefined}>{t("Īpašumi")}</a>
      </nav>
      <nav className="seg mod-tabs" aria-label={t("Periods")}>
        {Object.entries(PERIODS).map(([d, label]) => (
          <a key={d} href={q(k, d)} aria-current={days === d ? "page" : undefined}>{t(label)}</a>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="empty">{t("Šajā periodā cenu kritumu nav.")}</p>
      ) : (
        <div className="list">
          {rows.map(({ card, prev, at }) => (
            <div key={card.id} className="drop-item">
              <p className="fine">
                {timeAgo(at, t)}: {formatPrice(prev)} → <b>{formatPrice(card.price)}</b> (−{Math.round(((prev - card.price) / prev) * 100)}%)
              </p>
              <ListingCard l={card} oldPrice={card.firstPrice ?? prev} also={also.get(card.id)} evaluation={evals.get(card.id)} vzd={vzd.get(card.id)} compare />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
