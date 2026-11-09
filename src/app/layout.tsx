import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
import { InstallBanner, PwaRegister } from "@/components/pwa";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getT } from "@/i18n/server";
import { DICTS } from "@/i18n/dicts";
import { LEGAL } from "@/content/legal";
import { OPERATOR } from "@/lib/constants";

const OG_LOCALE = { lv: "lv_LV", en: "en_GB", ru: "ru_RU", lt: "lt_LT" } as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  return {
    title: { default: "VienāVietā", template: "%s · VienāVietā" },
    description: t("Visi Latvijas sludinājumi vienā meklētājā: transports un nekustamais īpašums."),
    metadataBase: new URL((process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")),
    applicationName: "VienāVietā",
    openGraph: { siteName: "VienāVietā", type: "website", locale: OG_LOCALE[locale], images: [{ url: "/og.png", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image" },
    appleWebApp: { capable: true, title: "VienāVietā", statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#9e3039" },
    { media: "(prefers-color-scheme: dark)", color: "#12141a" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { t, lp, prefix } = await getT();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <I18nProvider locale={locale} dict={DICTS[locale]} prefix={prefix}>
        <header className="top">
          <div className="wrap">
            <a href={lp("/")} className="logo">
              {t("Vienā")}<b>{t("Vietā")}</b>
            </a>
            <span className="tag">{t("Visi Latvijas sludinājumi vienā meklētājā")}</span>
            <nav className="nav">
              <a href={lp("/tirgus")} className="btn" title={t("Tirgus tendences")}>📈 <span className="hide-sm">{t("Tirgus")}</span></a>
              <a href={lp("/cenu-kritumi")} className="btn" title={t("Cenu kritumi")}>▼ <span className="hide-sm">{t("Kritumi")}</span></a>
              <a href={lp("/darijumi")} className="btn" title={t("Reālās dzīvokļu darījumu cenas (VZD)")}>🏠 <span className="hide-sm">{t("Darījumi")}</span></a>
              <LangSwitch />
              <ThemeToggle />
              <UserMenu />
              <a href="/pievienot" className="btn primary">+ {t("Pievienot")}</a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="foot">
          <div className="wrap">
            <span>© {new Date().getFullYear()} VienāVietā{OPERATOR.name ? ` · ${OPERATOR.name}` : ""}</span>
            <nav className="foot-cats" aria-label={t("Kategorijas")}>
              <a href={lp("/auto")}>{t("Auto")}</a>
              <a href={lp("/moto")}>{t("Moto")}</a>
              <a href={lp("/ipasumi/dzivokli")}>{t("Dzīvokļi")}</a>
              <a href={lp("/ipasumi/dzivokli-ire")}>{t("Dzīvokļu īre")}</a>
              <a href={lp("/ipasumi/majas")}>{t("Mājas")}</a>
              <a href={lp("/ipasumi/vasarnicas")}>{t("Vasarnīcas")}</a>
              <a href={lp("/ipasumi/zeme")}>{t("Zeme")}</a>
              <a href={lp("/ipasumi")}>{t("Visi īpašumi")}</a>
            </nav>
            <nav aria-label={LEGAL[locale].footer.about}>
              <a href={lp("/par-mums")}>{LEGAL[locale].footer.about}</a>
              <a href={lp("/noteikumi")}>{LEGAL[locale].footer.terms}</a>
              <a href={lp("/privatums")}>{LEGAL[locale].footer.privacy}</a>
              <a href={lp("/par-mums#avoti")}>{LEGAL[locale].footer.sources}</a>
            </nav>
          </div>
        </footer>
        <CompareBar />
        <PwaRegister />
        <InstallBanner />
        </I18nProvider>
        {/* Apmeklējumu statistika bez sīkdatnēm (Cloudflare Web Analytics); ieslēdz ar CF_ANALYTICS_TOKEN */}
        {process.env.CF_ANALYTICS_TOKEN && (
          <Script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: process.env.CF_ANALYTICS_TOKEN, spa: true })} strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
