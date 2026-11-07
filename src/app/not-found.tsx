import { getT } from "@/i18n/server";
export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="wrap">
      <h1>{t("Lapa nav atrasta")}</h1>
      <p className="lead">
        {t("Iespējams, sludinājums ir noņemts.")} <a href="/">{t("Atgriezties sākumlapā")}</a>
      </p>
    </main>
  );
}
