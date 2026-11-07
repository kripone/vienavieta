import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { ProfileForm } from "./profile-form";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = { title: "Mans profils" };

export default async function ProfilePage(props: { searchParams: Promise<{ jauns?: string }> }) {
  const user = await requireUser("/profils");
  const { jauns } = await props.searchParams;

  return (
    <main className="wrap narrow">
      <h1>Mans profils</h1>
      {jauns ? (
        <p className="welcome">Laipni lūgts VienāVietā! Pastāsti, kā tevi uzrunāt, un vari sākt ievietot sludinājumus.</p>
      ) : (
        <p className="lead">Šie dati redzami pircējiem pie taviem sludinājumiem (tālrunis tikai pēc pieprasījuma).</p>
      )}
      <div className="panel">
        <p className="fine">
          E-pasts: <b>{user.email}</b>
          {user.emailVerified ? " · apstiprināts" : ""}
        </p>
        <ProfileForm name={user.name} phone={user.phone ?? ""} sellerType={user.sellerType} companyName={user.companyName ?? ""} />
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <a className="btn" href="/pazinojumi">🔔 Paziņojumi</a>
        <a className="btn" href="/favoriti">♥ Favorīti</a>
        <SignOutButton />
      </div>
    </main>
  );
}
