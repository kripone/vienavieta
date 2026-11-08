"use client";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABEL, LOCALE_NAME, type Locale } from "@/i18n/core";
import { useT } from "@/i18n/client";

/**
 * Valodas izvēle: saglabā sīkdatnē "lang" uz gadu. Ja adresē ir valodas prefikss (/en/…),
 * pāriet uz tās pašas lapas adresi izvēlētajā valodā; citādi pārlādē lapu.
 */
export function LangSwitch() {
  const { locale, t } = useT();
  const router = useRouter();
  return (
    <select
      className="lang"
      aria-label={t("Valoda")}
      value={locale}
      onChange={(e) => {
        const next = e.target.value as Locale;
        document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
        const { pathname, search } = window.location;
        const m = pathname.match(/^\/(en|ru|lt)(\/.*)?$/);
        if (m) {
          const rest = m[2] || "/";
          const path = next === "lv" ? rest : rest === "/" ? `/${next}` : `/${next}${rest}`;
          window.location.assign(path + search);
        } else router.refresh();
      }}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l} title={LOCALE_NAME[l]}>{LOCALE_LABEL[l]}</option>
      ))}
    </select>
  );
}
