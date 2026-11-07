import type { Metadata } from "next";
// Burti ir iekļauti projektā (nav atkarīgi no Google Fonts servera)
import "@fontsource/bricolage-grotesque/600.css";
import "@fontsource/bricolage-grotesque/800.css";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";
import { CompareBar } from "@/components/compare";
import { ThemeToggle, themeScript } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { LangSwitch } from "@/components/lang-switch";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getT } from "@/i18n/server";
import { DICTS } from "@/i18n/dicts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { default: "VienāVietā", template: "%s · VienāVietā" },
    description: t("Visi Latvijas sludinājumi vienā meklētājā: transports un nekustamais īpašums."),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { t } = await getT();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <I18nProvider locale={locale} dict={DICTS[locale]}>
        <header className="top">
          <div className="wrap">
            <a href="/" className="logo">
              {t("Vienā")}<b>{t("Vietā")}</b>
            </a>
            <span className="tag">{t("Visi Latvijas sludinājumi vienā meklētājā")}</span>
            <nav className="nav">
              <a href="/tirgus" className="btn" title={t("Tirgus tendences")}>📈 <span className="hide-sm">{t("Tirgus")}</span></a>
              <a href="/cenu-kritumi" className="btn" title={t("Cenu kritumi")}>▼ <span className="hide-sm">{t("Kritumi")}</span></a>
              <a href="/darijumi" className="btn" title={t("Reālās dzīvokļu darījumu cenas (VZD)")}>🏠 <span className="hide-sm">{t("Darījumi")}</span></a>
              <LangSwitch />
              <ThemeToggle />
              <UserMenu />
              <a href="/pievienot" className="btn primary">+ {t("Pievienot")}</a>
            </nav>
          </div>
        </header>
        {children}
        <CompareBar />
        </I18nProvider>
      </body>
    </html>
  );
}
