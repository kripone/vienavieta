// SEO lapu papildu saites: cenu sliekšņi, degviela, virsbūve, pilsētas (transports); istabas un apkaimes (īpašumi).
// Rāda tikai tās, kurās ir sludinājumi, lai meklētāji un lietotāji neietu uz tukšām lapām.
import { getT } from "@/i18n/server";
import { BODY_TYPES, FUELS, SEO_COMBO_MIN, SEO_PRICE_STEPS, SEO_ROOMS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { parseSearch, seoLinkCounts } from "@/lib/search";
import { bodySlug, fuelSlug, getCatalog, priceSlug, regionName, roomsLabel, roomsSlug, type Landing } from "@/lib/seo";

type Item = { slug: string; label: string; n: number };
type Group = { title: string; items: Item[] };

export async function SeoMoreLinks({ more }: { more: NonNullable<Landing["more"]> }) {
  const { t, lp, locale } = await getT();
  const s = parseSearch(more.raw);
  const groups: Group[] = [];
  const counts = (by: Parameters<typeof seoLinkCounts>[1], steps?: readonly number[]) => seoLinkCounts(s, by, steps).catch(() => []);
  // kombinētām lapām (marka + filtrs, pilsēta + istabas) vajag vairāk sludinājumu, lai lapa nebūtu tukša
  const min = more.kind === "vehicle" && more.level !== "root" ? SEO_COMBO_MIN : 3;

  if (more.kind === "vehicle") {
    const cat = await getCatalog();
    const [price, fuel, body, region] = await Promise.all([
      more.level !== "model" ? counts("price", SEO_PRICE_STEPS) : [],
      more.vc === "car" ? counts("fuel") : [],
      more.level !== "model" ? counts("body") : [],
      more.level !== "model" ? counts("region") : [],
    ]);
    const n = (rows: { key: string; n: number }[], k: string) => rows.find((r) => r.key === k)?.n ?? 0;
    if (price.length) {
      // tikai sliekšņi, kas pievieno sludinājumus salīdzinājumā ar iepriekšējo
      const items = SEO_PRICE_STEPS.map((p) => ({ slug: priceSlug(p), label: t("līdz {p}", { p: formatPrice(p) }), n: n(price, String(p)) }))
        .filter((x, i, all) => x.n >= min && (i === 0 || x.n > all[i - 1].n));
      groups.push({ title: t("Pēc cenas"), items });
    }
    if (fuel.length) groups.push({ title: t("Pēc degvielas"), items: FUELS.map((f) => ({ slug: fuelSlug(f), label: t(f), n: n(fuel, f) })).filter((x) => x.n >= min) });
    if (body.length) groups.push({ title: t("Pēc virsbūves"), items: BODY_TYPES[more.vc].map((b) => ({ slug: bodySlug(b), label: t(b), n: n(body, b) })).filter((x) => x.n >= min) });
    if (region.length) {
      const items = region.map((r) => ({ r, reg: cat.regions.find((x) => String(x.id) === r.key) }))
        .filter((x) => x.reg && x.r.n >= min).slice(0, 24)
        .map((x) => ({ slug: x.reg!.slug, label: regionName(x.reg!.name, locale), n: x.r.n }));
      groups.push({ title: t("Pēc pilsētas vai novada"), items });
    }
  } else {
    const cat = await getCatalog();
    const flats = more.type === "Dzīvoklis";
    const areas = more.regionId != null ? cat.areas.filter((a) => a.regionId === more.regionId) : [];
    const [rooms, area] = await Promise.all([flats ? counts("rooms") : [], areas.length ? counts("area") : []]);
    if (rooms.length) {
      groups.push({ title: t("Pēc istabu skaita"), items: SEO_ROOMS.map((r) => ({ slug: roomsSlug(r), label: roomsLabel(r, t), n: rooms.find((x) => x.key === String(r))?.n ?? 0 })).filter((x) => x.n >= min) });
    }
    if (area.length) {
      const items = area.map((r) => ({ r, a: areas.find((x) => String(x.id) === r.key) })).filter((x) => x.a && x.r.n >= min)
        .map((x) => ({ slug: x.a!.slug, label: x.a!.name, n: x.r.n })).sort((a, b) => a.label.localeCompare(b.label, "lv"));
      groups.push({ title: t("Apkaimes"), items });
    }
  }
  const shown = groups.filter((g) => g.items.length > 1 || (g.items.length === 1 && g.items[0].slug === more.current));
  if (!shown.length) return null;
  return (
    <>
      {shown.map((g) => (
        <div key={g.title} className="seo-group">
          <h2>{g.title}</h2>
          <ul className="seo-links">
            {g.items.map((x) => (
              <li key={x.slug}>
                {x.slug === more.current ? <b aria-current="page">{x.label}</b> : <a href={lp(`${more.base}/${x.slug}`)}>{x.label}</a>} <span className="fine">{x.n}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
