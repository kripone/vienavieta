// Modeļa paaudzes (ar facelift gadu), fakti, vājās vietas un markas komplektācijas:
// SEO modeļa lapā pilna tabula, sludinājumā – šī auto paaudze un komplektācija.
import { getT } from "@/i18n/server";
import { trTitle } from "@/i18n/content";
import { gensForYear, modelInfo, type Gen } from "@/content/models";
import { MODEL_CHECKS } from "@/content/model-checks";
import { TRIM_INFO } from "@/content/trims";

export async function ModelInfo({ make, model, year, trim }: { make: string; model: string; year?: number | null; trim?: string | null }) {
  const info = modelInfo(make, model);
  const trims = TRIM_INFO[make];
  if (!info && !trims) return null;
  const { t, locale } = await getT();
  const name = `${make} ${trTitle(model, t)}`;
  const label = (code: string) => {
    const m = code.match(/^(\d+)\. paaudze$/);
    return m ? t("{n}. paaudze", { n: m[1] }) : code;
  };
  const years = (g: Gen) => `${g[1]}–${g[2] ?? t("šobrīd")}`;
  const facts = info ? info.facts[locale] ?? info.facts.lv : [];
  const checks = MODEL_CHECKS[`${make}|${model}`]?.[locale] ?? [];
  const checkBlock = checks.length > 0 && (
    <>
      <h3>{t("Uz ko pievērst uzmanību, pērkot lietotu")}</h3>
      <ul>{checks.map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="fine">{t("Tās ir biežāk zināmās vājās vietas, nevis konkrētā auto diagnoze – pirms pirkuma pārbaudi auto servisā.")}</p>
    </>
  );
  // sludinājumā: tikai šī auto komplektācija; modeļa lapā: visas markas komplektācijas
  const trimRows = trims ? Object.entries(trims).filter(([n]) => (year !== undefined ? n === trim : true)) : [];
  const trimBlock = trimRows.length > 0 && (
    <>
      <h3>{year !== undefined ? t("Komplektācija: {t}", { t: trimRows[0][0] }) : t("{make} komplektācijas", { make })}</h3>
      {year !== undefined ? (
        <p>{trimRows[0][1][locale] ?? trimRows[0][1].lv}</p>
      ) : (
        <ul>{trimRows.map(([n, dsc]) => <li key={n}><b>{n}</b> – {dsc[locale] ?? dsc.lv}</li>)}</ul>
      )}
    </>
  );

  if (year !== undefined) {
    const gens = info && year ? gensForYear(info, year) : [];
    if (!gens.length && !trimBlock) return null;
    const g = gens[gens.length - 1];
    const fl = g?.[3];
    const flNote = g && fl && gens.length === 1
      ? year! > fl
        ? t("pēc facelift ({y})", { y: fl })
        : year! < fl
          ? t("pirms facelift ({y})", { y: fl })
          : t("facelift gadā ({y}) – pārbaudi, kura versija", { y: fl })
      : null;
    return (
      <section className="model-info">
        <h2>{t("Par modeli {name}", { name })}</h2>
        {g && (
          <>
            <p>
              {gens.length > 1
                ? t("Šī gada auto var būt {a} vai {b} paaudze – pārbaudi pēc izskata vai VIN.", { a: `${label(gens[0][0])} (${years(gens[0])})`, b: `${label(g[0])} (${years(g)})` })
                : `${t("Paaudze: {g} ({y})", { g: label(g[0]), y: years(g) })}${flNote ? `, ${flNote}` : ""}.`}
            </p>
            <ul>{facts.map((f) => <li key={f}>{f}</li>)}</ul>
          </>
        )}
        {trimBlock}
        {g && checkBlock}
      </section>
    );
  }

  return (
    <section className="model-info">
      <h2>{t("Par modeli {name}", { name })}</h2>
      {info && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>{t("Paaudze")}</th><th>{t("Ražota")}</th><th>{t("Facelift")}</th></tr>
            </thead>
            <tbody>
              {[...info.gens].reverse().map((g) => (
                <tr key={g[0]}><td>{label(g[0])}</td><td>{years(g)}</td><td>{g[3] ?? "–"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {facts.length > 0 && <ul>{facts.map((f) => <li key={f}>{f}</li>)}</ul>}
      {checkBlock}
      {trimBlock}
      {info && <p className="fine">{t("Gadi ir aptuveni: ražošanas sākums un facelift dažādos tirgos var atšķirties par gadu.")}</p>}
    </section>
  );
}
