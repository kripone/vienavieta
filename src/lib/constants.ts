// Kopīgās vērtības: izmanto datubāze, validācija un saskarne.

export const VEHICLE_CLASSES = ["car", "moto", "camper", "van", "truck"] as const;
export type VehicleClass = (typeof VEHICLE_CLASSES)[number];

export const VEHICLE_CLASS_LABEL: Record<VehicleClass, string> = {
  car: "Vieglie auto",
  moto: "Motocikli",
  camper: "Kemperi",
  van: "Furgoni",
  truck: "Kravas auto",
};

export const BODY_TYPES: Record<VehicleClass, readonly string[]> = {
  car: ["Sedans", "Universāls", "Hečbeks", "Apvidus", "Minivens", "Kupeja", "Kabriolets", "Pikaps", "Mikroautobuss"],
  moto: ["Sporta", "Tūrisma", "Kruīzeris", "Enduro", "Naked", "Skuteris"],
  camper: ["Integrētais", "Daļēji integrētais", "Alkova", "Kemperfurgons", "Treileris"],
  van: ["Kravas furgons", "Pasažieru", "Kombi", "Šasija"],
  truck: ["Vilcējs", "Tents", "Refrižerators", "Pašizgāzējs", "Bortu", "Konteinervedējs"],
};

export const FUELS = ["Benzīns", "Dīzelis", "Hibrīds", "Elektro", "Benzīns/gāze"] as const;
export const GEARBOXES = ["Manuāla", "Automāts"] as const;
export const DRIVES = ["Priekšpiedziņa", "Aizmugures", "Pilnpiedziņa"] as const;
export const COLORS = ["Melna", "Balta", "Pelēka", "Sudraba", "Zila", "Sarkana", "Zaļa", "Brūna", "Cita"] as const;
/** Ilustrāciju krāsa pēc sludinājuma krāsas ("Cita" un tukša: tēmas noklusētā). */
export const COLOR_HEX: Partial<Record<(typeof COLORS)[number], string>> = {
  Melna: "#23262d", Balta: "#f7f8fa", Pelēka: "#7d838f", Sudraba: "#c4c9d1", Zila: "#2f5fa8", Sarkana: "#b8323b", Zaļa: "#2f7a4f", Brūna: "#7a5236",
};

/**
 * Virsbūves noteikšana pēc modeļa nosaukuma (ārējiem sludinājumiem, kur virsbūve nav norādīta).
 * Atslēga: modeļa nosaukuma sākums bez atstarpēm un domuzīmēm, mazajiem burtiem.
 */
export const MODEL_BODY_HINTS: Record<string, readonly string[]> = {
  Apvidus: [
    "x1", "x2", "x3", "x4", "x5", "x6", "x7", "ix", "q2", "q3", "q4", "q5", "q7", "q8", "etron", "xc40", "xc60", "xc70", "xc90", "ex30", "ex90",
    "rav4", "chr", "landcruiser", "highlander", "yariscross", "corollacross", "crv", "hrv", "tiguan", "touareg", "troc", "taigo", "id4", "id5",
    "kodiaq", "karoq", "kamiq", "enyaq", "qashqai", "xtrail", "juke", "ariya", "sportage", "sorento", "niro", "ev6", "tucson", "santafe", "kona", "ioniq5",
    "kuga", "puma", "explorer", "ecosport", "ml", "gle", "glc", "gla", "glb", "gls", "gl", "eqc", "rangerover", "discovery", "defender", "evoque",
    "cx3", "cx30", "cx5", "cx60", "outlander", "asx", "eclipsecross", "pajero", "forester", "outback", "xv", "duster", "3008", "5008", "2008",
    "captur", "kadjar", "austral", "c5aircross", "c3aircross", "mokka", "grandland", "crossland", "macan", "cayenne", "model y", "modely", "xceed",
    "vitara", "sx4", "jimny", "ateca", "arona", "tarraco", "formentor", "compass", "renegade", "cherokee", "wrangler", "x-trail",
  ],
  Minivens: ["touran", "sharan", "galaxy", "smax", "cmax", "zafira", "scenic", "grandscenic", "espace", "berlingo", "partner", "rifter", "caddy", "verso", "alhambra", "picasso", "spacetourer", "bclass", "vito", "multivan", "carens"],
  Pikaps: ["hilux", "ranger", "amarok", "l200", "navara", "dmax", "ram", "f150", "tacoma"],
  Mikroautobuss: ["transporter", "caravelle", "transit", "sprinter", "vclass", "trafic", "vivaro", "expert", "jumpy", "proace", "crafter"],
  Kupeja: ["tt", "rcz", "z4", "mx5", "911", "cayman", "boxster", "supra", "gt86", "brz"],
};
/** Modeļa nosaukuma vārdi, kas norāda universāli (Passat Variant, Octavia Combi, A4 Avant …). */
export const WAGON_WORDS = ["variant", "combi", "kombi", "avant", "touring", "universal", "universāls", "estate", "sw", "sportswagon", "tourer", "break", "allroad"] as const;


export const PROPERTY_GROUPS = {
  "Dzīvojamais": ["Dzīvoklis", "Istaba", "Māja", "Vasarnīca", "Lauku īpašums"],
  "Zeme un mežs": ["Zeme", "Mežs"],
  "Komercīpašums": ["Birojs", "Tirdzniecības telpas", "Noliktava", "Ražošanas telpas", "Komercēka"],
  "Garāžas un stāvvietas": ["Garāža", "Stāvvieta"],
} as const;

export const PROPERTY_TYPES = Object.values(PROPERTY_GROUPS).flat();
export type PropertyType = (typeof PROPERTY_TYPES)[number];

/** Kuri lauki attiecas uz katru īpašuma veidu (formā un filtros rāda tikai tos). */
export const PROPERTY_FIELDS: Record<PropertyType, readonly string[]> = {
  "Dzīvoklis": ["rooms", "areaM2", "floor", "floors", "series", "material", "heating", "condition", "builtYear", "amenities"],
  "Istaba": ["areaM2", "floor", "floors", "series", "heating", "amenities"],
  "Māja": ["rooms", "areaM2", "landM2", "floors", "material", "heating", "condition", "builtYear", "amenities"],
  "Vasarnīca": ["rooms", "areaM2", "landM2", "material", "heating", "condition", "builtYear", "amenities"],
  "Lauku īpašums": ["rooms", "areaM2", "landM2", "material", "heating", "condition", "builtYear", "amenities"],
  "Zeme": ["landM2", "purpose"],
  "Mežs": ["landM2"],
  "Birojs": ["areaM2", "floor", "floors", "heating", "condition", "amenities"],
  "Tirdzniecības telpas": ["areaM2", "floor", "heating", "condition", "amenities"],
  "Noliktava": ["areaM2", "landM2", "heating", "condition"],
  "Ražošanas telpas": ["areaM2", "landM2", "heating", "condition"],
  "Komercēka": ["areaM2", "landM2", "floors", "material", "heating", "condition", "builtYear"],
  "Garāža": ["areaM2"],
  "Stāvvieta": [],
};

export const DEALS = ["sell", "rent", "day", "buy"] as const;
export const DEAL_LABEL: Record<(typeof DEALS)[number], string> = {
  sell: "Pārdod",
  rent: "Izīrē",
  day: "Īre uz dienām",
  buy: "Pērk",
};

export const SERIES = ["Lietuviešu", "103. sērija", "104. sērija", "119. sērija", "467. sērija", "602. sērija", "Hruščova laika", "Staļina laika", "Pirmskara", "Mazģimeņu", "Specprojekts", "Jaunais projekts", "Renovēta ēka"] as const;
export const MATERIALS = ["Ķieģeļu", "Paneļu", "Ķieģeļu-paneļu", "Monolīts", "Koka", "Gāzbetona", "Karkasa"] as const;
export const HEATING = ["Centrālā", "Gāzes", "Siltumsūknis", "Malkas", "Granulu", "Elektriskā", "Kombinētā"] as const;
export const CONDITIONS = ["Jauns projekts", "Pēc kapitālā remonta", "Labs", "Apmierinošs", "Nepieciešams remonts", "Nepabeigta būvniecība"] as const;
export const PURPOSES = ["Individuālā apbūve", "Daudzdzīvokļu apbūve", "Lauksaimniecība", "Mežsaimniecība", "Komercapbūve", "Rūpnieciskā apbūve"] as const;
export const AMENITIES = ["Balkons", "Terase", "Lifts", "Stāvvieta", "Mēbelēts", "Dzīvnieki atļauti", "Kamīns", "Pirts", "Signalizācija"] as const;

export const REPORT_REASONS = {
  spam: "Surogātpasts vai reklāma",
  fraud: "Krāpšana vai viltus cena",
  sold: "Jau pārdots vai neaktuāls",
  wrong: "Nepareiza kategorija vai dati",
  dup: "Dublikāts",
  bad: "Aizskarošs saturs",
} as const;

/** Cik dažādu lietotāju sūdzības automātiski paslēpj sludinājumu līdz moderatora pārbaudei. */
export const REPORT_HIDE_THRESHOLD = 3;
/** Cik jaunu sludinājumu viens lietotājs drīkst ievietot diennaktī. */
export const DAILY_LISTING_LIMIT = 5;
export const MAX_PHOTOS = 12;

export const COUNTRIES = ["LV", "LT"] as const;
export type Country = (typeof COUNTRIES)[number];
export const COUNTRY_LABEL: Record<Country, string> = { LV: "Latvija", LT: "Lietuva" };

/** Saglabāto meklēšanu paziņojumu biežums. */
export const NOTIFY_FREQUENCIES = ["hourly", "daily"] as const;
export type NotifyFrequency = (typeof NOTIFY_FREQUENCIES)[number];
export const NOTIFY_FREQUENCY_LABEL: Record<NotifyFrequency, string> = { hourly: "Uzreiz (reizi stundā)", daily: "Reizi dienā" };
/** Cik meklēšanas viens lietotājs drīkst saglabāt. */
export const MAX_SAVED_SEARCHES = 20;
/** Cik e-pastu viena paziņojumu kārta drīkst nosūtīt (Brevo bezmaksas plānā 300 dienā). */
export const MAX_EMAILS_PER_RUN = 100;

/**
 * Ārējie sludinājumi: tikai oficiālās RSS plūsmas (portāls pats tās publicē).
 * Ņemam tikai faktus (marka, gads, cena, platība, vieta) un saiti; bez bildēm un apraksta teksta.
 */
export const SS_FEEDS = [
  { url: "https://www.ss.com/lv/transport/cars/rss/", kind: "vehicle", vehicleClass: "car" },
  { url: "https://www.ss.com/lv/transport/moto-transport/rss/", kind: "vehicle", vehicleClass: "moto" },
  { url: "https://www.ss.com/lv/real-estate/flats/rss/", kind: "property", propertyType: "Dzīvoklis" },
  { url: "https://www.ss.com/lv/real-estate/flats/riga/rss/", kind: "property", propertyType: "Dzīvoklis" },
  { url: "https://www.ss.com/lv/real-estate/homes-summer-residences/rss/", kind: "property", propertyType: "Māja" },
  { url: "https://www.ss.com/lv/real-estate/plots-and-lands/rss/", kind: "property", propertyType: "Zeme" },
] as const;
/** Ārējie sludinājumi tiek paslēpti, ja nav atjaunoti tik dienas (RSS nerāda, kad oriģināls izdzēsts). */
export const EXTERNAL_TTL_DAYS = 21;
/** Avotu nosaukumi kartītēs. */
export const SOURCE_LABEL: Record<string, string> = {
  own: "VienāVietā", "ss.com": "ss.com", "reklama.lv": "reklama.lv", "mm.lv": "mm.lv", "city24.lv": "city24.lv",
  "auto24.lv": "auto24.lv", "autoplius.lt": "autoplius.lt", "aruodas.lt": "aruodas.lt",
};
