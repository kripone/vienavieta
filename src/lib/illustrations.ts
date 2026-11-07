// Ilustrācijas sludinājumiem bez bildēm un veidu joslām (no prototipa).
// Visas ir nemainīgas SVG virknes; krāsas nāk no CSS mainīgajiem --ill-*, tāpēc strādā abās tēmās.
// Lieto ar <Ill svg={...} />, sk. src/components/ill.tsx.

import { COLOR_HEX, MODEL_BODY_HINTS, WAGON_WORDS } from "./constants";

type Shape = { b: string; g: string[]; w: number[]; r: number; cy: number; x?: string };

const CAR_SHAPES: Record<string, Shape> = {
  "Sedans":{b:"M12,80 C12,68 16,61 28,59 L70,53 C84,41 96,33 112,31 L150,31 C162,32 172,41 184,51 L216,55 C226,57 230,63 230,72 L230,80 Z",g:["M78,53 C90,43 100,37 114,36 L126,36 L126,53 Z","M131,36 L148,36 C158,37 166,44 174,52 L131,53 Z"],w:[58,186],r:15,cy:80},
  "Universāls":{b:"M12,80 C12,68 16,61 28,59 L70,53 C84,41 96,32 112,30 L206,30 C214,31 218,37 220,47 L224,57 C228,61 230,66 230,74 L230,80 Z",g:["M78,53 C90,43 100,36 114,35 L130,35 L130,53 Z","M135,35 L170,35 L170,53 L135,53 Z","M175,35 L204,35 C208,36 211,41 212,49 L212,53 L175,53 Z"],w:[58,190],r:15,cy:80},
  "Hečbeks":{b:"M22,80 C22,68 26,61 38,59 L76,53 C90,41 102,33 118,31 L176,31 C186,32 192,39 196,49 L202,61 C204,67 204,72 204,80 Z",g:["M84,53 C96,43 106,37 120,36 L140,36 L140,53 Z","M145,36 L174,36 C181,37 186,43 189,53 L145,53 Z"],w:[64,172],r:15,cy:80},
  "Apvidus":{b:"M10,82 L10,62 C10,54 16,50 28,49 L64,46 C78,32 92,22 110,20 L200,20 C210,21 216,28 220,40 L226,52 C230,56 232,62 232,70 L232,82 Z",g:["M72,46 C84,34 96,27 112,26 L134,26 L134,46 Z","M139,26 L176,26 L176,46 L139,46 Z","M181,26 L198,26 C204,27 208,33 211,42 L211,46 L181,46 Z"],w:[58,190],r:17,cy:82},
  "Kupeja":{b:"M12,80 C12,69 16,63 28,61 L76,55 C94,43 110,36 128,35 L150,35 C170,37 190,47 210,57 C224,59 230,65 230,72 L230,80 Z",g:["M86,55 C100,46 112,41 128,40 L140,40 L140,55 Z","M145,40 L152,40 C166,42 178,48 190,56 L145,56 Z"],w:[60,188],r:15,cy:80},
  "Kabriolets":{b:"M12,80 C12,69 16,63 28,61 L84,56 L97,44 L101,44 L93,56 L182,56 C200,56 212,57 220,59 C227,61 230,66 230,72 L230,80 Z",g:["M146,56 C147,50 158,47 172,48 C182,49 188,52 191,56 Z"],w:[60,188],r:15,cy:80},
  "Minivens":{b:"M12,80 L12,64 C12,56 18,52 30,50 L50,48 C62,34 74,24 92,20 L212,20 C222,21 226,28 227,40 L228,70 L228,80 Z",g:["M58,48 C68,36 78,28 94,26 L110,26 L110,48 Z","M115,26 L160,26 L160,48 L115,48 Z","M165,26 L208,26 C214,27 217,32 218,40 L218,48 L165,48 Z"],w:[56,192],r:15,cy:80},
  "Pikaps":{b:"M10,82 L10,62 C10,54 16,50 28,49 L60,46 C72,32 84,24 100,22 L140,22 C146,22 148,26 148,32 L148,50 L232,50 L232,82 Z",g:["M68,46 C78,34 88,28 102,27 L118,27 L118,46 Z","M123,27 L140,27 C143,27 144,30 144,34 L144,46 L123,46 Z"],w:[58,192],r:17,cy:82,x:"M152,50 L152,80"},
  "Mikroautobuss":{b:"M14,82 L14,56 C14,48 18,44 26,42 L36,20 C38,14 42,12 50,12 L222,12 C228,12 230,16 230,22 L230,82 Z",g:["M40,40 L48,20 C49,18 51,17 54,17 L76,17 L76,40 Z","M82,17 L126,17 L126,40 L82,40 Z","M132,17 L176,17 L176,40 L132,40 Z","M182,17 L222,17 L222,40 L182,40 Z"],w:[56,196],r:16,cy:82}
};
Object.assign(CAR_SHAPES,{
  "Furgons":{b:"M14,82 L14,56 C14,48 18,44 26,42 L36,20 C38,14 42,12 50,12 L222,12 C228,12 230,16 230,22 L230,82 Z",g:["M40,40 L48,20 C49,18 51,17 54,17 L76,17 L76,40 Z"],w:[56,196],r:16,cy:82,x:"M84,14 L84,80 M150,14 L150,80"},
  "Kemperis":{b:"M10,82 L10,58 C10,50 14,46 22,45 L34,26 C36,22 40,20 46,20 L52,20 L52,10 C52,6 56,4 62,4 L226,4 C230,4 232,8 232,12 L232,82 Z",g:["M38,44 L48,26 L66,26 L66,44 Z","M110,26 L140,26 L140,40 L110,40 Z","M170,26 L204,26 L204,40 L170,40 Z","M60,8 L84,8 L84,16 L60,16 Z"],w:[52,192],r:16,cy:82,x:"M152,24 L152,80"},
  "Kravas":{b:"M8,82 L8,40 C8,32 12,28 20,28 L28,10 C29,6 33,4 38,4 L64,4 C68,4 70,8 70,12 L70,82 Z M76,2 L234,2 L234,72 L76,72 Z",g:["M24,30 L32,12 C33,10 35,9 38,9 L62,9 L62,30 Z"],w:[40,170,202],r:16,cy:84,x:"M70,76 L234,76"}
});

/** Krāsa ilustrācijai: tikai mūsu pašu hex vērtības (nekad lietotāja teksts SVG iekšā). */
const fillFor = (color?: string | null) => {
  const hex = color ? COLOR_HEX[color as keyof typeof COLOR_HEX] : undefined;
  return hex ? ` style="fill:${hex}"` : "";
};

export function carIll(body?: string | null, color?: string | null) {
  const s = CAR_SHAPES[body ?? ""] ?? CAR_SHAPES["Sedans"];
  const wheels = s.w.map((x) => `<circle class="it" cx="${x}" cy="${s.cy}" r="${s.r}"/><circle class="ir" cx="${x}" cy="${s.cy}" r="${s.r * 0.58}"/><circle class="it" cx="${x}" cy="${s.cy}" r="${s.r * 0.18}"/>`).join("");
  return `<svg class="ill" viewBox="0 0 240 104" aria-hidden="true"><ellipse class="ish" cx="122" cy="${s.cy + s.r - 1}" rx="112" ry="5"/><path class="ib" d="${s.b}"${fillFor(color)}/>${s.g.map((d) => `<path class="ig" d="${d}"/>`).join("")}${s.x ? `<path class="il" d="${s.x}"/>` : ""}<path class="il" d="M18,${s.cy - 12} l10,0"/>${wheels}</svg>`;
}

const HOME_ILL: Record<string, string> = {
  "Dzīvoklis":`<rect class="hw" x="78" y="12" width="84" height="82"/>${[0,1,2,3,4,5].map(r=>[0,1,2,3].map(c=>`<rect class="hg" x="${86+c*19}" y="${19+r*12.5}" width="11" height="8"/>`).join("")).join("")}`,
  "Māja":`<rect class="hc" x="146" y="22" width="10" height="20"/><path class="hr" d="M58,52 L120,16 L182,52 Z"/><rect class="hw" x="70" y="50" width="100" height="44"/><rect class="hg" x="84" y="60" width="20" height="16"/><rect class="hg" x="136" y="60" width="20" height="16"/><rect class="hd" x="112" y="66" width="16" height="28"/>`,
  "Vasarnīca":`<path class="ht" d="M40,94 L52,52 L64,94 Z M30,94 L44,62 L58,94 Z"/><path class="hr" d="M92,58 L134,30 L176,58 Z"/><rect class="hw" x="100" y="56" width="68" height="38"/><rect class="hg" x="110" y="64" width="16" height="13"/><rect class="hd" x="140" y="68" width="14" height="26"/><path class="ht" d="M190,94 L204,48 L218,94 Z"/>`,
  "Zeme":`<path class="hgr" d="M20,94 L60,60 L220,60 L220,94 Z"/><path class="il" d="M70,66 L40,94 M110,64 L96,94 M150,64 L152,94 M190,64 L206,94"/><path class="hp" d="M140,18 C128,18 120,27 120,38 C120,52 140,62 140,62 C140,62 160,52 160,38 C160,27 152,18 140,18 Z"/><circle class="hw" cx="140" cy="38" r="7"/>`,
  "Mežs":`<path class="ht" d="M60,94 L84,24 L108,94 Z M100,94 L124,14 L148,94 Z M140,94 L164,30 L188,94 Z M34,94 L52,48 L70,94 Z M176,94 L196,54 L216,94 Z"/>`,
  "Birojs":`<rect class="hw" x="64" y="46" width="50" height="48"/><rect class="hg" x="96" y="8" width="56" height="86"/>${[0,1,2,3,4,5,6].map(r=>`<path class="hl2" d="M96,${20+r*11} L152,${20+r*11}"/>`).join("")}<rect class="hw" x="156" y="40" width="30" height="54"/>${[0,1,2].map(r=>`<rect class="hg" x="72" y="${54+r*13}" width="34" height="6"/>`).join("")}`,
  "Tirdzniecības telpas":`<rect class="hw" x="50" y="30" width="140" height="64"/><path class="hr" d="M44,30 L196,30 L190,46 L50,46 Z"/><path class="hs" d="M64,30 L62,46 M84,30 L84,46 M104,30 L106,46 M124,30 L128,46 M144,30 L150,46 M164,30 L172,46"/><rect class="hg" x="62" y="56" width="62" height="38"/><rect class="hd" x="136" y="56" width="40" height="38"/>`,
  "Noliktava":`<path class="hw" d="M24,94 L24,44 Q120,10 216,44 L216,94 Z"/><rect class="hd" x="44" y="58" width="44" height="36"/><rect class="hd" x="100" y="58" width="44" height="36"/><rect class="hd" x="156" y="58" width="44" height="36"/><path class="hl2" d="M44,66 L88,66 M44,74 L88,74 M44,82 L88,82 M100,66 L144,66 M100,74 L144,74 M100,82 L144,82 M156,66 L200,66 M156,74 L200,74 M156,82 L200,82"/>`,
  "Garāža":`<path class="hr" d="M60,40 L120,22 L180,40 Z"/><rect class="hw" x="66" y="40" width="108" height="54"/><rect class="hd" x="82" y="52" width="76" height="42"/><path class="hl2" d="M82,60 L158,60 M82,68 L158,68 M82,76 L158,76 M82,84 L158,84"/>`
};
const HOME_MAP: Record<string, string> = {"Istaba":"Dzīvoklis","Lauku īpašums":"Vasarnīca","Komercēka":"Birojs","Ražošanas telpas":"Noliktava","Stāvvieta":"Garāža"};

export function homeIll(t?: string | null) {
  const k = t && HOME_ILL[t] ? t : (t && HOME_MAP[t]) || "Māja";
  return `<svg class="ill" viewBox="0 0 240 104" aria-hidden="true"><path class="hgr0" d="M8,94 L232,94"/>${HOME_ILL[k]}</svg>`;
}

export function motoIll(color?: string | null) {
  const w = (x: number) =>`<circle class="it" cx="${x}" cy="76" r="21"/><circle class="ir" cx="${x}" cy="76" r="13"/><circle class="it" cx="${x}" cy="76" r="3.5"/>`;
  return `<svg class="ill" viewBox="0 0 240 104" aria-hidden="true"><ellipse class="ish" cx="120" cy="97" rx="96" ry="4"/>${w(60)}${w(182)}<path class="il" style="stroke-width:5" d="M60,76 L84,34 M182,76 L150,50 L104,54"/><rect class="ig" x="98" y="52" width="38" height="22" rx="5"/><path class="ib"${fillFor(color)} d="M88,44 C94,30 118,27 134,33 L150,40 L180,40 C186,40 190,44 188,49 L148,52 L98,54 Z"/><path class="il" style="stroke-width:4" d="M78,30 L96,24"/><circle class="ig" cx="84" cy="36" r="5"/><path class="il" style="stroke-width:4" d="M124,72 L176,64"/></svg>`}

/** Ilustrācija transportlīdzeklim pēc veida un virsbūves. */
export function vehicleIll(vehicleClass?: string | null, body?: string | null, color?: string | null) {
  const vc = vehicleClass || "car";
  if (vc === "moto") return motoIll(color);
  if (vc === "camper") return carIll(body === "Kemperfurgons" ? "Mikroautobuss" : "Kemperis", color);
  if (vc === "van") return carIll(body === "Pasažieru" || body === "Kombi" ? "Mikroautobuss" : "Furgons", color);
  if (vc === "truck") return carIll("Kravas", color);
  return carIll(body, color);
}

/** Ilustrācija jebkuram sludinājumam. */
export function listingIll(l: { kind: string; vehicleClass?: string | null; body?: string | null; color?: string | null; propertyType?: string | null }) {
  return l.kind === "vehicle" ? vehicleIll(l.vehicleClass, l.body, l.color) : homeIll(l.propertyType);
}

const VC_ICON: Record<string, string> = {
  car:'<path d="M6,20 L6,15 Q7,12 11,11 L16,6 Q18,5 21,5 L31,5 Q34,5 36,8 L39,11 Q43,12 43,16 L43,20 Z"/><circle cx="14" cy="20" r="3.5"/><circle cx="35" cy="20" r="3.5"/>',
  moto:'<circle cx="11" cy="20" r="6"/><circle cx="37" cy="20" r="6"/><path d="M11,20 L20,11 L30,11 L37,20 M24,11 L20,20 L30,20 M30,11 L33,6 L37,6"/>',
  camper:'<path d="M4,21 L4,8 Q4,5 7,5 L40,5 Q44,5 44,9 L44,21 Z M4,12 L44,12 M28,8 L36,8"/><circle cx="13" cy="22" r="3.5"/><circle cx="36" cy="22" r="3.5"/>',
  van:'<path d="M4,21 L4,11 L10,5 L42,5 Q44,5 44,7 L44,21 Z M4,12 L13,12 L13,5"/><circle cx="12" cy="22" r="3.5"/><circle cx="36" cy="22" r="3.5"/>',
  truck:'<path d="M3,21 L3,11 L7,6 L15,6 L15,21 Z M17,3 L45,3 L45,19 L17,19 Z"/><circle cx="9" cy="22" r="3"/><circle cx="31" cy="22" r="3"/><circle cx="39" cy="22" r="3"/>'
};

/** Maza transporta veida ikona (līnijas, krāsa no currentColor). */
export const vcIcon = (vc: string) => `<svg viewBox="0 0 48 28" aria-hidden="true">${VC_ICON[vc] ?? VC_ICON.car}</svg>`;

/** Josla auto sadaļā (virsbūves ar ilustrācijām) un īpašumu sadaļā (veidi). */
export const CAR_STRIP = ["Sedans", "Universāls", "Hečbeks", "Apvidus", "Kupeja", "Kabriolets", "Minivens", "Pikaps", "Mikroautobuss"] as const;
export const HOME_STRIP = ["Dzīvoklis", "Māja", "Vasarnīca", "Zeme", "Mežs", "Birojs", "Tirdzniecības telpas", "Noliktava", "Garāža"] as const;

/** Virsbūve pēc modeļa nosaukuma (ārējiem sludinājumiem); null, ja nevar noteikt. */
export function inferBody(model?: string | null): string | null {
  if (!model) return null;
  const words = model.toLowerCase().split(/[\s/()-]+/);
  if (words.some((w) => (WAGON_WORDS as readonly string[]).includes(w))) return "Universāls";
  const key = model.toLowerCase().replace(/[\s\-().]/g, "");
  for (const [body, list] of Object.entries(MODEL_BODY_HINTS)) {
    if (list.some((m) => key === m.replace(/[\s-]/g, "") || (m.length >= 3 && key.startsWith(m.replace(/[\s-]/g, ""))))) return body;
  }
  return null;
}
