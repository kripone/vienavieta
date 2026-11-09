import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { ListingCard } from "@/components/listing-card";
import { OwnerActions } from "@/components/owner-actions";
import { userListings } from "@/lib/listings";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Mani sludinājumi") };
}

export default async function MyListingsPage() {
  const { t } = await getT();
  const user = await requireUser("/mani-sludinajumi");
  const rows = await userListings(user.id);
  return (
    <main className="wrap">
      <div className="row between">
        <h1>{t("Mani sludinājumi")}</h1>
        <div className="row">
          {(user.sellerType === "dealer" || user.sellerType === "agency") && <a className="btn" href="/importi">{t("Sludinājumu imports (fails vai plūsma)")}</a>}
          <a className="btn primary" href="/pievienot">{t("+ Pievienot sludinājumu")}</a>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="notice">{t("Tev vēl nav sludinājumu.")}</div>
      ) : (
        <div className="list">
          {rows.map((l) => (
            <ListingCard key={l.id} l={l} showStatus actions={<OwnerActions id={l.id} status={l.status} compact />} />
          ))}
        </div>
      )}
    </main>
  );
}
