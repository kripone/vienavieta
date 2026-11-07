import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL } from "@/content/legal";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: LEGAL[await getLocale()].about.title };
}

export default function Page() {
  return <LegalPage doc="about" operatorBlock />;
}
