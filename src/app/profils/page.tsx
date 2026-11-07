import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { ProfileForm } from "./profile-form";
import { SignOutButton } from "@/components/sign-out-button";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Mans profils") };
}

export default async function ProfilePage(props: { searchParams: Promise<{ jauns?: string }> }) {
  const { t } = await getT();
  const user = await requireUser("/profils");
  const { jauns } = await props.searchParams;

  return (
    <main className="wrap narrow">
      <h1>{t("Mans profils")}</h1>
      {jauns ? (
        <p className="welcome">{t("Laipni lūgts VienāVietā! Pastāsti, kā tevi uzrunāt, un vari sākt ievietot sludinājumus.")}</p>
      ) : (
        <p className="lead">{t("Šie dati redzami pircējiem pie taviem sludinājumiem (tālrunis tikai pēc pieprasījuma).")}</p>
      )}
      <div className="panel">
        <p className="fine">
          {t("E-pasts:")} <b>{user.email}</b>
          {user.emailVerified ? ` · ${t("apstiprināts")}` : ""}
        </p>
        <ProfileForm name={user.name} phone={user.phone ?? ""} sellerType={user.sellerType} companyName={user.companyName ?? ""} />
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <a className="btn" href="/pazinojumi">{t("🔔 Paziņojumi")}</a>
        <a className="btn" href="/favoriti">{t("♥ Favorīti")}</a>
        <SignOutButton />
      </div>
    </main>
  );
}
