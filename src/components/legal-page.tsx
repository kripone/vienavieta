import { LEGAL, type LegalDoc } from "@/content/legal";
import { DAILY_LISTING_LIMIT, OPERATOR, REPORT_HIDE_THRESHOLD } from "@/lib/constants";
import { getLocale } from "@/i18n/server";
import { INTL_LOCALE } from "@/i18n/core";

/** Juridiskā lapa ar uzturētāja datiem vietturu vietā (src/content/legal.ts). */
export async function LegalPage({ doc, operatorBlock }: { doc: "privacy" | "terms" | "about"; operatorBlock?: boolean }) {
  const locale = await getLocale();
  const L = LEGAL[locale];
  const d: LegalDoc = L[doc];
  const vals: Record<string, string> = {
    operator: OPERATOR.name ?? `[${L.placeholder}]`,
    email: OPERATOR.email ?? `[${L.placeholder}]`,
    address: OPERATOR.address ?? `[${L.placeholder}]`,
    regno: OPERATOR.regNo ?? `[${L.placeholder}]`,
    limit: String(DAILY_LISTING_LIMIT),
    reports: String(REPORT_HIDE_THRESHOLD),
  };
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (_, k) => vals[k] ?? `{${k}}`);
  const since = new Date(OPERATOR.since + "T12:00:00Z").toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" });
  return (
    <main className="wrap narrow legal">
      <h1>{d.title}</h1>
      <p className="lead">{fill(d.intro)}</p>
      {doc !== "about" && <p className="fine">{L.updated} {since}</p>}
      {d.sections.map((s) => (
        <section key={s.h} id={s.h === "Datu avoti" || s.h === "Data sources" || s.h === "Источники данных" || s.h === "Duomenų šaltiniai" ? "avoti" : undefined}>
          <h2>{s.h}</h2>
          {s.p.map((p, i) => <p key={i}>{fill(p)}</p>)}
        </section>
      ))}
      {operatorBlock && (
        <section>
          <h2>{L.operatorH}</h2>
          <dl className="params">
            {L.operatorRows.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{fill(v)}</dd></div>
            ))}
          </dl>
        </section>
      )}
    </main>
  );
}
