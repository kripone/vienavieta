"use client";
// Lapas kļūda: draudzīgs paziņojums un ziņojums kļūdu žurnālā.
import { useEffect } from "react";
import { useT } from "@/i18n/client";
import { reportClientError } from "@/components/error-reporter";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useT();
  useEffect(() => { reportClientError(error.message || "Lapas kļūda", error.stack, error.digest); }, [error]);
  return (
    <main className="wrap narrow">
      <h1>{t("Kaut kas nogāja greizi")}</h1>
      <p className="lead">{t("Kļūda jau ir pierakstīta, un mēs to izlabosim. Pamēģini vēlreiz vai atgriezies sākumlapā.")}</p>
      <div className="row">
        <button type="button" className="btn primary" onClick={reset}>{t("Mēģināt vēlreiz")}</button>
        <a className="btn" href="/">{t("Uz sākumlapu")}</a>
      </div>
    </main>
  );
}
