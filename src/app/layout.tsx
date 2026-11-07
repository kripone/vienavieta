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

export const metadata: Metadata = {
  title: { default: "VienāVietā", template: "%s · VienāVietā" },
  description: "Visi Latvijas sludinājumi vienā meklētājā: transports un nekustamais īpašums.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lv" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <header className="top">
          <div className="wrap">
            <a href="/" className="logo">
              Vienā<b>Vietā</b>
            </a>
            <span className="tag">Visi Latvijas sludinājumi vienā meklētājā</span>
            <nav className="nav">
              <a href="/tirgus" className="btn" title="Tirgus tendences">📈 <span className="hide-sm">Tirgus</span></a>
              <a href="/cenu-kritumi" className="btn" title="Cenu kritumi">▼ <span className="hide-sm">Kritumi</span></a>
              <a href="/darijumi" className="btn" title="Reālās dzīvokļu darījumu cenas (VZD)">🏠 <span className="hide-sm">Darījumi</span></a>
              <ThemeToggle />
              <UserMenu />
              <a href="/pievienot" className="btn primary">+ Pievienot</a>
            </nav>
          </div>
        </header>
        {children}
        <CompareBar />
      </body>
    </html>
  );
}
