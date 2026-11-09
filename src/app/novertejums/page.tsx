// „Cik vērts?”: aptuvena auto vai dzīvokļa cena no sludinājumiem un VZD darījumiem (src/lib/valuation.ts).
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { langAlternates } from "@/lib/seo";
import { formatNumber, formatPrice } from "@/lib/format";
import { regionOptions } from "@/lib/listings";
import { valueFlat, valueVehicle } from "@/lib/valuation";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { VehiclePicker } from "./vehicle-picker";

export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;
const int = (v: string | undefined, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null;
};

export async function generateMetadata(props: { searchParams: Promise<SP> }): Promise<Metadata> {
  const { t, locale } = await getT();
  const sp = await props.searchParams;
  const filtered = Object.keys(sp).some((k) => k !== "veids");
  return {
    title: t("Cik vērts mans auto vai dzīvoklis?"),
    description: t("Bezmaksas novērtējums: tipiskā cena no tūkstošiem sludinājumu un reālajiem dzīvokļu darījumiem Latvijā."),
    alternates: langAlternates("/novertejums", locale),
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ValuationPage(props: { searchParams: Promise<SP> }) {
  const { t, tp, lp } = await getT();
  const sp = await props.searchParams;
  const kind = sp.veids === "dzivoklis" ? "flat" : "car";
  const year = new Date().getFullYear();

  // auto
  const make = int(sp.make, 1, 1e7), model = int(sp.model, 1, 1e7), y = int(sp.gads, 1950, year + 1), km = int(sp.km, 0, 2_000_000);
  const car = kind === "car" && model && y ? await valueVehicle(model, y, km).catch(() => null) : undefined;
  const modelName = kind === "car" && model ? (await db.select({ m: schema.models.name, mk: schema.makes.name }).from(schema.models).innerJoin(schema.makes, eq(schema.makes.id, schema.models.makeId)).where(eq(schema.models.id, model)))[0] : null;

  // dzīvoklis
  const place = int(sp.vieta, 1, 1e7), area = int(sp.platiba, 8, 1000), rooms = int(sp.istabas, 1, 10), address = (sp.adrese ?? "").trim().slice(0, 120);
  const flat = kind === "flat" && place && area ? await valueFlat(place, area, rooms, address || null).catch(() => null) : undefined;
  const regions = kind === "flat" ? (await regionOptions()).filter((r) => r.country === "LV") : [];

  const carSearch = car && make && model ? lp(`/?cat=vehicle&vc=car&make=${make}&model=${model}&ymin=${car.yearFrom}&ymax=${car.yearTo}`) : null;
  const flatSearch = flat?.asking && place ? lp(`/?cat=property&ptype=${encodeURIComponent("Dzīvoklis")}&deal=sell&loc=p:${place}&amin=${Math.floor(area! * 0.6)}&amax=${Math.ceil(area! * 1.4)}`) : null;

  return (
    <main className="wrap mid valuation">
      <h1>{t("Cik vērts mans auto vai dzīvoklis?")}</h1>
      <p className="lead">{t("Aptuvenā cena pēc līdzīgiem sludinājumiem visos portālos un dzīvokļiem arī pēc reālajiem darījumiem tajā pašā mājā.")}</p>
      <nav className="seg" aria-label={t("Ko novērtēt")}>
        <a href={lp("/novertejums")} aria-current={kind === "car" ? "page" : undefined}>🚗 {t("Auto")}</a>
        <a href={lp("/novertejums?veids=dzivoklis")} aria-current={kind === "flat" ? "page" : undefined}>🏠 {t("Dzīvoklis")}</a>
      </nav>

      {kind === "car" ? (
        <form className="panel val-form" action={lp("/novertejums")}>
          <div className="grid2">
            <VehiclePicker make={make ?? undefined} model={model ?? undefined} />
            <label className="field"><span>{t("Gads")} *</span><input name="gads" type="number" inputMode="numeric" required min={1950} max={year + 1} defaultValue={y ?? ""} /></label>
            <label className="field"><span>{t("Nobraukums, km")}</span><input name="km" type="number" inputMode="numeric" min={0} max={2000000} defaultValue={km ?? ""} /></label>
          </div>
          <button className="btn primary">{t("Novērtēt")}</button>
        </form>
      ) : (
        <form className="panel val-form" action={lp("/novertejums")}>
          <input type="hidden" name="veids" value="dzivoklis" />
          <div className="grid2">
            <label className="field"><span>{t("Vieta")} *</span>
              <select name="vieta" required defaultValue={place ?? ""}>
                <option value="">{t("Izvēlies")}</option>
                {regions.map((r) => (
                  <optgroup key={r.regionId} label={r.region}>
                    {r.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="field"><span>{t("Platība, m²")} *</span><input name="platiba" type="number" inputMode="numeric" required min={8} max={1000} defaultValue={area ?? ""} /></label>
            <label className="field"><span>{t("Istabas")}</span><input name="istabas" type="number" inputMode="numeric" min={1} max={10} defaultValue={rooms ?? ""} /></label>
            <label className="field"><span>{t("Adrese (reālajiem darījumiem mājā)")}</span><input name="adrese" placeholder={t("Piem. Kalna iela 13A")} defaultValue={address} /></label>
          </div>
          <button className="btn primary">{t("Novērtēt")}</button>
        </form>
      )}

      {car !== undefined && (
        <section className="val-result">
          {car ? (
            <>
              <h2>{modelName ? `${modelName.mk} ${t(modelName.m)}, ${y}` : t("Rezultāts")}</h2>
              <div className="val-hero">
                <span className="fine">{t("Tipiskā cena")}</span>
                <b>{formatPrice(car.median)}</b>
                <span>{t("Lielākā daļa līdzīgu auto: {a} – {b}", { a: formatPrice(car.p25), b: formatPrice(car.p75) })}</span>
              </div>
              <p className="fine">
                {t("Pēc {n} sludinājumiem: {y1}–{y2}. g.", { n: car.n, y1: car.yearFrom, y2: car.yearTo })}
                {car.kmFiltered ? ` ${t("ar līdzīgu nobraukumu")}.` : km ? ` ${t("Līdzīga nobraukuma auto par maz, tāpēc nobraukums nav ņemts vērā.")}` : ""}
                {" "}{t("Tās ir sludinājumu cenas; darījuma cena parasti ir nedaudz zemāka. Stāvoklis, komplektācija un vēsture cenu var mainīt.")}
              </p>
              {carSearch && <a className="btn" href={carSearch}>{t("Skatīt līdzīgos sludinājumus")} →</a>}
            </>
          ) : (
            <div className="notice">{t("Šim modelim un gadam pagaidām par maz sludinājumu (vajag vismaz 5), lai novērtētu.")}</div>
          )}
        </section>
      )}

      {flat !== undefined && (
        <section className="val-result">
          {flat && (flat.asking || flat.deals) ? (
            <>
              <h2>{t("Dzīvoklis {a} m²", { a: area! })}{rooms ? `, ${t("{n} ist.", { n: rooms })}` : ""}</h2>
              <div className="val-cards">
                {flat.asking && (
                  <div className="val-hero">
                    <span className="fine">{t("Pēc sludinājumiem")} · {flat.asking.name}</span>
                    <b>{formatPrice(Math.round((flat.asking.median * area!) / 100) * 100)}</b>
                    <span>{formatNumber(flat.asking.median)} €/m² · {t("Lielākā daļa: {a} – {b}", { a: formatPrice(Math.round((flat.asking.p25 * area!) / 100) * 100), b: formatPrice(Math.round((flat.asking.p75 * area!) / 100) * 100) })}</span>
                    <span className="fine">{tp(flat.asking.n, "līdzīgs sludinājums", "līdzīgi sludinājumi")}</span>
                  </div>
                )}
                {flat.deals && (
                  <div className="val-hero">
                    <span className="fine">{t("Reālie darījumi mājā")} · {flat.deals.address}</span>
                    <b>{formatPrice(Math.round((flat.deals.median * area!) / 100) * 100)}</b>
                    <span>{formatNumber(flat.deals.median)} €/m² · {flat.deals.recent ? t("pēdējos 3 gados") : t("kopš 2016")}</span>
                    <span className="fine">{tp(flat.deals.n, "darījums", "darījumi")}</span>
                  </div>
                )}
              </div>
              <p className="fine">{t("Sludinājumu cenas parasti ir augstākas nekā darījumu cenas. Stāvs, stāvoklis, remonts un mājas sērija cenu var būtiski mainīt.")}{flat.deals ? ` ${t("Darījumu dati: Valsts zemes dienests (data.gov.lv, CC BY 4.0).")}` : ""}</p>
              {address && !flat.deals && <p className="fine">{t("Šai adresei darījumu neatradām. Pārbaudi adresi lapā")} <a href={lp("/darijumi")}>{t("Darījumu cenas")}</a>.</p>}
              {flatSearch && <a className="btn" href={flatSearch}>{t("Skatīt līdzīgos sludinājumus")} →</a>}
            </>
          ) : (
            <div className="notice">{t("Šajā vietā pagaidām par maz līdzīgu sludinājumu, lai novērtētu. Pamēģini norādīt adresi vai tuvāko pilsētu.")}</div>
          )}
        </section>
      )}
    </main>
  );
}
