import { CAR_STRIP, HOME_STRIP, carIll, homeIll } from "@/lib/illustrations";
import { getT } from "@/i18n/server";
import { Ill } from "./ill";

/** Josla ar virsbūvēm (vieglie auto) vai īpašuma veidiem; klikšķis ieslēdz/izslēdz filtru. */
export async function TypeStrip({ mode, flat, counts }: { mode: "car" | "home"; flat: Record<string, string>; counts: Record<string, number> }) {
  const { t: tr, tp } = await getT();
  const key = mode === "car" ? "body" : "ptype";
  const items = mode === "car" ? CAR_STRIP : HOME_STRIP;
  const active = flat[key];
  const href = (t: string) => {
    const p = new URLSearchParams(flat);
    p.delete("page");
    if (active === t) p.delete(key);
    else p.set(key, t);
    return `/?${p}`;
  };
  return (
    <section className="strip" aria-label={mode === "car" ? tr("Virsbūves tips") : tr("Īpašuma veids")}>
      <div className="strip-head">
        <h2>{mode === "car" ? tr("Virsbūves tips") : tr("Īpašuma veids")}</h2>
      </div>
      <div className="strip-row">
        {items.map((t) => (
          <a key={t} className="tcard" href={href(t)} aria-current={active === t ? "true" : undefined}>
            <Ill svg={mode === "car" ? carIll(t) : homeIll(t)} />
            <b>{tr(t)}</b>
            <span className="n">{tp(counts[t] ?? 0, "sludinājums", "sludinājumi")}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
