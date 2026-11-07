import type { Metadata } from "next";
import { BarList, ColumnChart, ScatterChart, TrendChart } from "@/components/charts";
import { MarketSelect } from "@/components/market-form";
import { DEAL_LABEL } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import {
  makesWithListings, marketTotals, modelsWithListings, priceByYear, priceVsMileage, propertyByPlace, propertyByRegion, segmentTrend, topMakes,
} from "@/lib/market";

export const metadata: Metadata = { title: "Tirgus tendences", description: "Auto un nekustamā īpašuma cenas Latvijā: mediānas pa modeļiem, gadiem un reģioniem." };
export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;
const PTYPES = ["Dzīvoklis", "Māja", "Zeme"] as const;
const int = (v?: string) => (v && /^\d{1,7}$/.test(v) ? Number(v) : undefined);

export default async function MarketPage(props: { searchParams: Promise<SP> }) {
  const sp = await props.searchParams;
  const tab = sp.t === "ipasumi" ? "ipasumi" : "auto";
  const params = Object.fromEntries(Object.entries(sp).filter(([, v]) => typeof v === "string" && v)) as Record<string, string>;
  const totals = await marketTotals().catch(() => ({}) as Awaited<ReturnType<typeof marketTotals>>);
  const t = (k: string) => (totals[k] ? totals[k].own + totals[k].ext : 0);
  return (
    <main className="wrap">
      <h1>Tirgus tendences</h1>
      <p className="lead">Aprēķināts no visiem aktīvajiem sludinājumiem (VienāVietā un ss.com); viens objekts vairākos portālos skaitās vienreiz.</p>
      <div className="stat-row">
        <div className="stat"><b>{formatNumber(t("vehicle"))}</b><span>transporta sludinājumi</span></div>
        <div className="stat"><b>{formatNumber(t("property"))}</b><span>īpašumu sludinājumi</span></div>
      </div>
      <nav className="seg mod-tabs" aria-label="Sadaļa">
        <a href="/tirgus" aria-current={tab === "auto" ? "page" : undefined}>Transports</a>
        <a href="/tirgus?t=ipasumi" aria-current={tab === "ipasumi" ? "page" : undefined}>Īpašumi</a>
      </nav>
      {tab === "auto" ? <Vehicles sp={sp} params={params} /> : <Property sp={sp} params={params} />}
    </main>
  );
}

async function Vehicles({ sp, params }: { sp: SP; params: Record<string, string> }) {
  const vc = sp.vc === "moto" ? "moto" : "car";
  const makeId = int(sp.make);
  const modelId = int(sp.model);
  const [makes, models] = await Promise.all([makesWithListings(vc), makeId ? modelsWithListings(makeId) : Promise.resolve([])]);
  const make = makes.find((m) => m.id === makeId);
  const model = models.find((m) => m.id === modelId);
  const color = "var(--car)";

  return (
    <>
      <div className="market-form">
        <MarketSelect label="Veids" name="vc" value={vc} params={params} reset={["make", "model"]} options={[{ value: "car", label: "Vieglie auto" }, { value: "moto", label: "Motocikli" }]} />
        <MarketSelect label="Marka" name="make" value={make ? String(make.id) : ""} params={params} reset={["model"]} options={[{ value: "", label: "Visas markas" }, ...makes.map((m) => ({ value: String(m.id), label: `${m.name} (${m.n})` }))]} />
        {make && (
          <MarketSelect label="Modelis" name="model" value={model ? String(model.id) : ""} params={params} options={[{ value: "", label: "Visi modeļi" }, ...models.map((m) => ({ value: String(m.id), label: `${m.name} (${m.n})` }))]} />
        )}
      </div>

      {!make && <TopMakes vc={vc} params={params} />}

      {make && !model && (
        <div className="market-grid">
          <BarList
            title={`${make.name}: mediānas cena pa modeļiem`}
            data={models.slice(0, 20).map((m) => ({ label: m.name, value: m.median, n: m.n, key: m.id }))}
            hrefFor={(d) => `/tirgus?${new URLSearchParams({ ...params, model: String(d.key) })}`}
            color={color}
          />
        </div>
      )}

      {make && model && <ModelView vc={vc} make={make} model={model} />}
    </>
  );
}

async function TopMakes({ vc, params }: { vc: string; params: Record<string, string> }) {
  const top = await topMakes(vc, 20);
  return (
    <div className="market-grid">
      <BarList
        title="Populārākās markas: mediānas cena (un sludinājumu skaits)"
        data={top.map((m) => ({ label: m.name, value: m.median, n: m.n, key: m.id }))}
        hrefFor={(d) => `/tirgus?${new URLSearchParams({ ...params, make: String(d.key) })}`}
      />
    </div>
  );
}

async function ModelView({ vc, make, model }: { vc: string; make: { id: number; name: string }; model: { id: number; name: string; n: number; median: number } }) {
  const [years, dots, trend] = await Promise.all([priceByYear(make.id, model.id), priceVsMileage(make.id, model.id), segmentTrend(`${vc}:${make.id}:${model.id}`).catch(() => [])]);
  const name = `${make.name} ${model.name}`;
  return (
    <>
      <div className="stat-row">
        <div className="stat"><b>{formatNumber(model.median)} €</b><span>{name}: mediānas cena</span></div>
        <div className="stat"><b>{formatNumber(model.n)}</b><span>aktīvi sludinājumi</span></div>
        <a className="btn primary" href={`/?${new URLSearchParams({ cat: "vehicle", vc, make: String(make.id), model: String(model.id) })}`}>Skatīt sludinājumus →</a>
      </div>
      <div className="market-grid">
        <ColumnChart title={`${name}: mediānas cena pa izlaiduma gadiem`} data={years.map((y) => ({ label: String(y.year), value: y.median, n: y.n }))} xLabel="Gads" />
        <ScatterChart title={`${name}: cena pret nobraukumu (punkts = sludinājums)`} points={dots} />
        <TrendChart title={`${name}: mediānas cena laikā`} points={trend} />
      </div>
    </>
  );
}

async function Property({ sp, params }: { sp: SP; params: Record<string, string> }) {
  const ptype = (PTYPES as readonly string[]).includes(sp.ptype ?? "") ? sp.ptype! : "Dzīvoklis";
  const deal = sp.deal === "rent" ? "rent" : "sell";
  const regionId = int(sp.region);
  const regions = await propertyByRegion(ptype, deal);
  const region = regions.find((r) => r.regionId === regionId);
  const unit = ptype === "Zeme" ? "€/m² zemes" : "€/m²";
  const color = "var(--home)";
  const [places, trend] = region
    ? await Promise.all([propertyByPlace(region.regionId, ptype, deal), segmentTrend(`prop:${ptype}:${region.regionId}:${deal}`).catch(() => [])])
    : [[], []];
  return (
    <>
      <div className="market-form">
        <MarketSelect label="Veids" name="ptype" value={ptype} params={params} reset={["region"]} options={PTYPES.map((p) => ({ value: p, label: p }))} />
        <MarketSelect label="Darījums" name="deal" value={deal} params={params} reset={["region"]} options={[{ value: "sell", label: DEAL_LABEL.sell }, { value: "rent", label: DEAL_LABEL.rent }]} />
        <MarketSelect label="Reģions" name="region" value={region ? String(region.regionId) : ""} params={params} options={[{ value: "", label: "Visi reģioni" }, ...regions.map((r) => ({ value: String(r.regionId), label: `${r.region} (${r.n})` }))]} />
      </div>
      {!regions.length && <div className="notice">Šim veidam un darījumam vēl par maz sludinājumu ar platību.</div>}
      <div className="market-grid">
        {!region && regions.length > 0 && (
          <BarList
            title={`${ptype}, ${DEAL_LABEL[deal].toLowerCase()}: mediānas cena par m² pa reģioniem`}
            data={regions.slice(0, 25).map((r) => ({ label: r.region, value: r.median, n: r.n, key: r.regionId }))}
            unit={unit}
            color={color}
            hrefFor={(d) => `/tirgus?${new URLSearchParams({ ...params, region: String(d.key) })}`}
          />
        )}
        {region && (
          <>
            <BarList title={`${region.region}: mediānas cena par m² pa vietām`} data={places.slice(0, 30).map((p) => ({ label: p.place, value: p.median, n: p.n }))} unit={unit} color={color} />
            <TrendChart title={`${region.region}, ${ptype.toLowerCase()}: cena par m² laikā`} points={trend} unit={unit} color={color} />
          </>
        )}
      </div>
    </>
  );
}
