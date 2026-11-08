// Kopīgā SEO lapu loģika (/auto, /moto, /ipasumi): filtri no adreses + metadati.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { SearchView, type SP } from "@/components/search-view";
import { formatPrice } from "./format";
import { parseSearch, priceSummary } from "./search";
import { langAlternates, type Landing } from "./seo";
import type { Locale, T } from "@/i18n/core";

type Props = { params: Promise<{ slug?: string[] }>; searchParams: Promise<SP> };

const pageOf = (sp: SP) => {
  const n = Number(typeof sp.page === "string" ? sp.page : 1);
  return Number.isInteger(n) && n > 1 && n <= 1000 ? n : 1;
};

export function landingRoute(resolve: (parts: string[], tr: { t: T; locale: Locale }) => Promise<Landing | null>) {
  async function load(props: Props) {
    const { slug = [] } = await props.params;
    const parts = slug.map((p) => decodeURIComponent(p).toLowerCase());
    const { t, locale } = await getT();
    const landing = await resolve(parts, { t, locale }).catch(() => null);
    if (!landing) notFound();
    return landing;
  }

  async function generateMetadata(props: Props): Promise<Metadata> {
    const landing = await load(props);
    const sp = await props.searchParams;
    const page = pageOf(sp);
    const { t, tp, locale } = await getT();
    const sum = await priceSummary(parseSearch(landing.raw)).catch(() => null);
    const stats = sum && sum.n ? ` ${tp(sum.n, "sludinājums", "sludinājumi")}${sum.median ? `, ${t("cenas mediāna {p}", { p: formatPrice(sum.median) })}` : ""}.` : "";
    const title = `${landing.title}${page > 1 ? ` – ${t("{n}. lapa", { n: page })}` : ""}`;
    const description = `${landing.about}${stats} ${t("Salīdzini cenas, skaties cenu vēsturi un saņem paziņojumus par jauniem sludinājumiem.")}`;
    return {
      title,
      description,
      alternates: (() => {
        const a = langAlternates(landing.path, locale);
        return page > 1 ? { canonical: `${a.canonical}?page=${page}` } : a;
      })(),
      // tukšas lapas meklētājiem nerādām
      robots: sum && sum.n === 0 ? { index: false, follow: true } : undefined,
      openGraph: { title, description, url: langAlternates(landing.path, locale).canonical, images: [{ url: "/og.png", width: 1200, height: 630 }] },
    };
  }

  async function Page(props: Props) {
    const landing = await load(props);
    const sp = await props.searchParams;
    const raw: SP = { ...landing.raw };
    const page = pageOf(sp);
    if (page > 1) raw.page = String(page);
    if (typeof sp.sort === "string") raw.sort = sp.sort;
    return <SearchView raw={raw} landing={landing} />;
  }

  return { generateMetadata, Page };
}
