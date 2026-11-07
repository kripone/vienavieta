import type { Metadata } from "next";
import { dealsByAddress } from "@/lib/vzd";
import { formatNumber, formatPrice, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Dzīvokļu darījumu cenas", description: "Par cik dzīvokļi patiešām pārdoti konkrētā mājā: Valsts zemes dienesta darījumu dati kopš 2016. gada." };
export const dynamic = "force-dynamic";

const fmtDay = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("lv-LV", { month: "short", year: "numeric", timeZone: "Europe/Riga" });

/** "Kalna iela 13A, Rīga" → "Kalna" (meklēšanai sludinājumu adresēs, kur ielas tips nav rakstīts) */
const streetOf = (address: string) => address.split(",")[0].replace(/\s+\d.*$/, "").replace(/\s+(iela|gatve|prospekts|bulvāris|šoseja|laukums|aleja|dambis|krastmala|ceļš)$/i, "").trim() || null;

export default async function DealsPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { q: raw } = await props.searchParams;
  const q = (raw ?? "").trim().slice(0, 120);
  const res = q ? await dealsByAddress(q).catch(() => ({ houses: [], suggestions: [] })) : null;
  return (
    <main className="wrap">
      <h1>Dzīvokļu darījumu cenas</h1>
      <p className="lead">Ieraksti mājas adresi, un redzēsi, par cik tajā patiešām pārdoti dzīvokļi. Dati ir no zemesgrāmatā reģistrētajiem pirkuma darījumiem kopš 2016. gada.</p>
      <form className="lookup" action="/darijumi">
        <input name="q" required defaultValue={q} placeholder="Piem. Kalna iela 13A, Rīga" aria-label="Adrese" />
        <button className="btn primary">Meklēt</button>
      </form>
      {res && res.houses.length === 0 && (
        <div className="notice">
          {/\d/.test(q) ? "Šai adresei darījumu nav atrasts." : "Ieraksti ielu kopā ar mājas numuru, piem. „Brīvības iela 100”."}
          {res.suggestions.length > 0 && (
            <>
              <p>Varbūt domāji:</p>
              <ul className="sugg">
                {res.suggestions.map((a) => (
                  <li key={a}><a className="btn small" href={`/darijumi?q=${encodeURIComponent(a)}`}>{a}</a></li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {res?.houses.map((h) => (
        <section key={h.address} className="house">
          <h2>{h.address}</h2>
          <p className="fine">
            {[h.builtYear ? `Būvēta ${h.builtYear}` : null, h.material].filter(Boolean).join(" · ")}
          </p>
          <div className="stat-row">
            {h.median != null && (
              <div className="stat"><b>{formatNumber(h.median)} €/m²</b><span>vidēji {h.medianRecent ? "pēdējos 3 gados" : "kopš 2016"} ({h.medianN})</span></div>
            )}
            <div className="stat"><b>{plural(h.deals.length, "darījums", "darījumi")}</b><span>kopš 2016</span></div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Datums</th><th>Stāvs</th><th>Istabas</th><th>Platība</th><th>Cena</th><th>€/m²</th></tr>
              </thead>
              <tbody>
                {h.deals.slice(0, 60).map((d, i) => (
                  <tr key={i}>
                    <td>{fmtDay(d.day)}</td>
                    <td>{d.floor != null ? `${d.floor}${d.floors ? "/" + d.floors : ""}` : "—"}</td>
                    <td>{d.rooms ?? "—"}</td>
                    <td>{Number(d.areaM2)} m²</td>
                    <td>{formatPrice(d.amount)}</td>
                    <td>{formatNumber(Math.round(d.amount / Number(d.areaM2)))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {streetOf(h.address) && (
            <p><a href={`/?cat=property&ptype=Dz%C4%ABvoklis&q=${encodeURIComponent(streetOf(h.address)!)}`}>Pārdošanā esošie dzīvokļi {streetOf(h.address)} ielā →</a></p>
          )}
        </section>
      ))}
      <p className="fine">
        Dati: Valsts zemes dienests, NĪTIS (<a href="https://data.gov.lv/dati/lv/dataset/darijumi-ar-telpu-grupam" target="_blank" rel="noopener noreferrer">data.gov.lv</a>, CC BY 4.0). Tikai veseli dzīvokļi; atjaunots reizi mēnesī. Zemesgrāmatā reģistrētā summa var atšķirties no tirgus vērtības.
      </p>
    </main>
  );
}
