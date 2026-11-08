import { langAlternates } from "@/lib/seo";
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL } from "@/content/legal";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: LEGAL[locale].about.title, alternates: langAlternates("/par-mums", locale) };
}

export default function Page() {
  return <LegalPage doc="about" operatorBlock />;
}
