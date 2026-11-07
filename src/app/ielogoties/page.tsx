import { getT } from "@/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { enabledSocial } from "@/lib/auth";
import { getCurrentUser, safeNext } from "@/lib/session";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Ielogoties") };
}

const ERRORS: Record<string, string> = {
  INVALID_TOKEN: "Pieteikšanās saite nav derīga. Pieprasi jaunu.",
  EXPIRED_TOKEN: "Pieteikšanās saite ir novecojusi. Pieprasi jaunu.",
  ATTEMPTS_EXCEEDED: "Šī saite jau ir izmantota. Pieprasi jaunu.",
  new_user_signup_disabled: "Reģistrācija pašlaik nav pieejama.",
};

export default async function LoginPage(props: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { t } = await getT();
  const { next, error } = await props.searchParams;
  const target = safeNext(next);
  if (await getCurrentUser()) redirect(target);

  return (
    <main className="wrap narrow">
      <h1>{t("Ielogoties vai reģistrēties")}</h1>
      <p className="lead">{t("Konts vajadzīgs, lai ievietotu sludinājumus, saglabātu favorītus un rakstītu pārdevējiem.")}</p>
      {error && <p className="alert">{t(ERRORS[error] ?? "Pieteikties neizdevās. Mēģini vēlreiz.")}</p>}
      <LoginForm next={target} social={enabledSocial} />
      <p className="fine">
        Turpinot tu piekrīti portāla lietošanas noteikumiem un privātuma politikai. Mēs nekad nerādām tavu e-pastu
        citiem lietotājiem.
      </p>
    </main>
  );
}
