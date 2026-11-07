"use client";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABEL, LOCALE_NAME, type Locale } from "@/i18n/core";
import { useT } from "@/i18n/client";

/** Valodas izvēle: saglabā sīkdatnē "lang" uz gadu un pārlādē lapu. */
export function LangSwitch() {
  const { locale, t } = useT();
  const router = useRouter();
  return (
    <select
      className="lang"
      aria-label={t("Valoda")}
      value={locale}
      onChange={(e) => {
        document.cookie = `lang=${e.target.value as Locale}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l} title={LOCALE_NAME[l]}>{LOCALE_LABEL[l]}</option>
      ))}
    </select>
  );
}
