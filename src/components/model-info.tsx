// Modeļa paaudzes (ar facelift gadu) un fakti: SEO modeļa lapā pilna tabula, sludinājumā – šī auto paaudze.
import { getT } from "@/i18n/server";
import { trTitle } from "@/i18n/content";
import { gensForYear, modelInfo, type Gen } from "@/content/models";
import { MODEL_CHECKS } from "@/content/model-checks";

export async function ModelInfo({ make, model, year }: { make: string; model: string; year?: number | null }) {
  const info = modelInfo(make, model);
  if (!info) return null;
  const { t, locale } = await getT();
  const name = `${make} ${trTitle(model, t)}`;
  const label = (code: string) => {
    const m = code.match(/^(\d+)\. paaudze$/);
    return m ? t("{n}. paaudze", { n: m[1] }) : code;
  };
  const years = (g: Gen) => `${g[1]}–${g[2] ?? t("šobrīd")}`;
  const facts = info.facts[locale] ?? info.facts.lv;
  const checks = MODEL_CHECKS[`${make}|${model}`]?.[locale] ?? [];
  const checkBlock = checks.length > 0 && (
    <>
      <h3>{t("Uz ko pievērst uzmanību, pērkot lietotu")}</h3>
      <ul>{checks.map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="fine">{t("Tās ir biežāk zināmās vājās vietas, nevis konkrētā auto diagnoze – pirms pirkuma pārbaudi auto servisā.")}</p>
    </>
  );

  if (year) {
    const gens = gensForYear(info, year);
    if (!gens.length) return null;
    const g = gens[gens.length - 1];
    const fl = g[3];
    const flNote = fl && gens.length === 1
      ? year > fl
        ? t("pēc facelift ({y})", { y: fl })
        : year < fl
          ? t("pirms facelift ({y})", { y: fl })
          : t("facelift gadā ({y}) – pārbaudi, kura versija", { y: fl })
      : null;
    return (
      <section className="model-info">
        <h2>{t("Par modeli {name}", { name })}</h2>
        <p>
          {gens.length > 1
            ? t("Šī gada auto var būt {a} vai {b} paaudze – pārbaudi pēc izskata vai VIN.", { a: `${label(gens[0][0])} (${years(gens[0])})`, b: `${label(g[0])} (${years(g)})` })
            : `${t("Paaudze: {g} ({y})", { g: label(g[0]), y: years(g) })}${flNote ? `, ${flNote}` : ""}.`}
        </p>
        <ul>{facts.map((f) => <li key={f}>{f}</li>)}</ul>
        {checkBlock}
      </section>
    );
  }

  return (
    <section className="model-info">
      <h2>{t("Par modeli {name}", { name })}</h2>
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
      <ul>{facts.map((f) => <li key={f}>{f}</li>)}</ul>
      {checkBlock}
      <p className="fine">{t("Gadi ir aptuveni: ražošanas sākums un facelift dažādos tirgos var atšķirties par gadu.")}</p>
    </section>
  );
}
