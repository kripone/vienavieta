import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { DEALER_FEED } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { requireUser } from "@/lib/session";
import type { FeedResult } from "@/lib/importers/dealer-feed";
import { AddFeedForm, FeedButtons } from "./feed-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Sludinājumu imports"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const { t } = await getT();
  const user = await requireUser("/importi");
  const feeds = await db.select().from(schema.dealerFeeds).where(eq(schema.dealerFeeds.userId, user.id)).orderBy(desc(schema.dealerFeeds.createdAt));
  const isDealer = user.sellerType === "dealer";
  return (
    <main className="wrap narrow">
      <h1>{t("Sludinājumu imports")}</h1>
      <p className="lead">{t("Saloni un aģentūras var pievienot savu sludinājumu plūsmu. Mēs to nolasām ik {h} stundas: jauni sludinājumi parādās, mainītās cenas atjaunojas, noņemtie pazūd.", { h: DEALER_FEED.EVERY_HOURS })}</p>
      {!isDealer ? (
        <div className="notice">
          {t("Imports pieejams tikai saloniem un aģentūrām. Profilā norādi, ka esi salons vai aģentūra.")} <a href="/profils">{t("Mans profils")}</a>
        </div>
      ) : (
        <>
          {feeds.length < DEALER_FEED.MAX_FEEDS_PER_USER && <AddFeedForm />}
          {feeds.map((f) => {
            const r = f.lastResult as FeedResult | null;
            return (
              <section key={f.id} className="panel stack">
                <b className="break">{f.url}</b>
                <span className="fine">
                  {f.kind === "property" ? t("Nekustamais īpašums") : t("Transports")} ·{" "}
                  {f.lastRunAt ? t("Pēdējais imports {when}", { when: timeAgo(f.lastRunAt, t) }) : t("Imports notiek…")}
                </span>
                {r && (
                  <p>
                    {t("Plūsmā: {n} · jauni: {c} · atjaunoti: {u} · noņemti: {r} · izlaisti: {s}", { n: r.items, c: r.created, u: r.updated, r: r.removed, s: r.skipped })}
                  </p>
                )}
                {r && r.errors.length > 0 && (
                  <ul className="fine err-list">
                    {r.errors.slice(0, 10).map((e, i) => <li key={i}>{t(e)}</li>)}
                  </ul>
                )}
                <FeedButtons id={f.id} />
              </section>
            );
          })}
          <section className="panel stack">
            <h2>{t("Kādu plūsmu var pievienot")}</h2>
            <ul>
              <li>{t("Facebook vai Google auto katalogs (XML vai CSV): to pašu, ko salons jau sūta uz Facebook Marketplace.")}</li>
              <li>{t("Jebkurš XML vai JSON ar sludinājumiem (lauki make, model, year, price, mileage, image…).")}</li>
              <li>{t("CSV vai Excel saglabāts kā CSV: kolonnas kā paraugā.")} <a href="/importi/paraugs.csv">{t("Lejupielādēt CSV paraugu")}</a></li>
            </ul>
            <p className="fine">{t("Līdz {n} sludinājumiem plūsmā, līdz {p} bildēm katram. Bildes rādām no jūsu servera. Sludinājumi saņem jūsu profila tālruni un e-pastu.", { n: DEALER_FEED.MAX_ITEMS, p: DEALER_FEED.MAX_PHOTOS })}</p>
          </section>
        </>
      )}
    </main>
  );
}
