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
  Kupeja: ["tt", "rcz", "z4", "mx5", "911", "cayman", "boxster", "supra", "gt86", "brz", "mustang", "camaro", "challenger"],
  Kabriolets: ["eos", "beetlecabrio", "slk", "slc", "sl", "z3", "miata", "spider", "cabrio", "cabriolet", "roadster"],
  // Tālāk: biežākā virsbūve populārajiem modeļiem Latvijas tirgū (ja sludinājumā nav norādīts citādi)
  Hečbeks: [
    "golf", "polo", "up", "id3", "fabia", "citigo", "scala", "rapid", "ibiza", "leon", "mii", "a1", "a3", "1", "118", "116", "120", "i3",
    "yaris", "auris", "aygo", "iq", "prius", "corolla", "jazz", "civic", "fit", "i10", "i20", "i30", "ioniq", "picanto", "rio", "ceed", "venga",
    "micra", "note", "leaf", "almera", "fiesta", "focus", "ka", "kuga2", "astra", "corsa", "adam", "karl", "clio", "megane", "zoe", "twingo",
    "208", "207", "206", "308", "307", "107", "108", "c1", "c2", "c3", "c4", "ds3", "punto", "500", "panda", "tipo", "bravo", "swift", "baleno",
    "alto", "splash", "colt", "spacestar", "mazda2", "2", "3", "mazda3", "sandero", "logan", "mini", "cooper", "one", "smart", "fortwo", "aclass", "a",
    "v40", "c30",
  ],
  Sedans: [
    "passat", "jetta", "arteon", "octavia", "superb", "a4", "a5", "a6", "a7", "a8", "3", "320", "318", "316", "330", "335", "325", "520", "525", "530",
    "535", "540", "730", "740", "750", "5", "7", "cclass", "eclass", "sclass", "c", "e", "s", "c200", "c220", "c180", "e200", "e220", "e250",
    "e300", "e350", "s350", "s500", "cla", "camry", "avensis", "corollasedan", "accord", "elantra", "sonata", "optima", "k5", "mondeo", "fusion",
    "vectra", "laguna", "talisman", "fluence", "407", "508", "c5", "s40", "s60", "s80", "s90", "xf", "xe", "xj", "is", "gs", "es", "ls", "mazda6",
    "6", "legacy", "impreza", "lancer", "galant", "primera", "teana", "maxima", "altima", "model s", "models", "model3", "panamera", "ghibli", "quattroporte",
    "insignia",
  ],
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

/** SEO lapu adreses (/ipasumi/<slug>) un daudzskaitļa nosaukumi virsrakstiem. */
export const PROPERTY_SLUG: Record<PropertyType, string> = {
  "Dzīvoklis": "dzivokli", "Istaba": "istabas", "Māja": "majas", "Vasarnīca": "vasarnicas", "Lauku īpašums": "lauku-ipasumi",
  "Zeme": "zeme", "Mežs": "mezi", "Birojs": "biroji", "Tirdzniecības telpas": "tirdzniecibas-telpas", "Noliktava": "noliktavas",
  "Ražošanas telpas": "razosanas-telpas", "Komercēka": "komercekas", "Garāža": "garazas", "Stāvvieta": "stavvietas",
};
export const PROPERTY_PLURAL: Record<PropertyType, string> = {
  "Dzīvoklis": "Dzīvokļi", "Istaba": "Istabas", "Māja": "Mājas", "Vasarnīca": "Vasarnīcas un dārza mājas", "Lauku īpašums": "Lauku īpašumi",
  "Zeme": "Zemes gabali", "Mežs": "Meža īpašumi", "Birojs": "Biroji", "Tirdzniecības telpas": "Tirdzniecības telpas", "Noliktava": "Noliktavas",
  "Ražošanas telpas": "Ražošanas telpas", "Komercēka": "Komercēkas", "Garāža": "Garāžas", "Stāvvieta": "Stāvvietas",
};
/** SEO lapu adreses transportam (citas klases pagaidām tikai meklēšanā). */
export const VEHICLE_SLUG: Partial<Record<VehicleClass, string>> = { car: "auto", moto: "moto" };

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
/**
 * ss.com sarakstu lapas (lietotājs 2026-11-07 apstiprināja jurista atzinumu, sk. CLAUDE.md).
 * Ņemam tikai faktus no sarakstu tabulas un saiti; sludinājuma lapas, bildes un aprakstus neatveram.
 */
export const SS_SECTIONS = [
  { key: "ss2:cars", url: "https://www.ss.com/lv/transport/cars/", kind: "vehicle", vehicleClass: "car" },
  { key: "ss2:moto", url: "https://www.ss.com/lv/transport/moto-transport/motorcycles/", kind: "vehicle", vehicleClass: "moto" },
  { key: "ss2:flats", url: "https://www.ss.com/lv/real-estate/flats/", kind: "property", propertyType: "Dzīvoklis" },
  { key: "ss2:homes", url: "https://www.ss.com/lv/real-estate/homes-summer-residences/", kind: "property", propertyType: "Māja" },
  { key: "ss2:land", url: "https://www.ss.com/lv/real-estate/plots-and-lands/", kind: "property", propertyType: "Zeme" },
  // komercīpašumi, meži, garāžas (2026-11-08). alt = rezerves adreses, ja pirmā nerāda sarakstu
  { key: "ss2:wood", url: "https://www.ss.com/lv/real-estate/wood/all/", alt: ["https://www.ss.com/lv/real-estate/wood/all-regions/", "https://www.ss.com/lv/real-estate/wood/"], kind: "property", propertyType: "Mežs" },
  { key: "ss2:offices", url: "https://www.ss.com/lv/real-estate/offices/all/", alt: ["https://www.ss.com/lv/real-estate/offices/", "https://www.ss.com/lv/real-estate/premises/offices/all/"], kind: "property", propertyType: "Birojs" },
  { key: "ss2:shops", url: "https://www.ss.com/lv/real-estate/premises/shops/all/", alt: ["https://www.ss.com/lv/real-estate/premises/shops/"], kind: "property", propertyType: "Tirdzniecības telpas" },
  { key: "ss2:storage", url: "https://www.ss.com/lv/real-estate/premises/storehouses-and-storages/all/", alt: ["https://www.ss.com/lv/real-estate/premises/storehouses-and-storages/"], kind: "property", propertyType: "Noliktava" },
  { key: "ss2:garages", url: "https://www.ss.com/lv/real-estate/premises/garages/all/", alt: ["https://www.ss.com/lv/real-estate/premises/garages/"], kind: "property", propertyType: "Garāža" },
] as const;
/** Pauze starp pieprasījumiem uz ss.com (ms) un ātrās kārtas lapu skaits katrā sadaļā. */
export const SS_REQUEST_DELAY_MS = 2000;
export const SS_QUICK_PAGES = 3;
/** Cik bieži ātrā kārta (jaunie sludinājumi) un pilnā kārta (visas lapas, izdzēsto paslēpšana). */
export const SS_QUICK_EVERY_MIN = 15;
export const SS_FULL_EVERY_HOURS = 24;
/** Ārējie sludinājumi tiek paslēpti, ja nav redzēti tik dienas (drošībai, ja pilnā kārta ilgi neizdodas). */
export const EXTERNAL_TTL_DAYS = 21;
/** Avotu nosaukumi kartītēs. */
export const SOURCE_LABEL: Record<string, string> = {
  own: "VienāVietā", "ss.com": "ss.com", "reklama.lv": "reklama.lv", "mm.lv": "mm.lv", "city24.lv": "city24.lv",
  "auto24.lv": "auto24.lv", "autoplius.lt": "autoplius.lt", "aruodas.lt": "aruodas.lt",
};

/** Cenas novērtējums pret līdzīgiem: zem GOOD — "Laba cena", virs HIGH — "Virs tirgus"; vajag vismaz MIN līdzīgus. */
export const PRICE_EVAL = { GOOD: 0.88, HIGH: 1.15, MIN: 3, YEARS: 2 } as const;
/** Cik sludinājumus var salīdzināt vienlaikus. */
export const MAX_COMPARE = 4;

/** ss.com transporta sludinājumu lapas pilsētai: cik minūtē un pauze starp pieprasījumiem. */
export const SS_DETAIL_PER_MIN = 24;
export const SS_DETAIL_DELAY_MS = 2000;
/** Lapas, kas atvērtas pirms šī laika, atver vēlreiz (tad vēl nenolasījām ātrumkārbu, krāsu un aprīkojumu). */
export const SS_DETAILS_V2_AT = new Date("2026-11-07T21:45:00Z");

/** Salonu sludinājumu plūsmas (src/lib/importers/dealer-feed.ts). */
export const DEALER_FEED = { MAX_FEEDS_PER_USER: 3, MAX_ITEMS: 1000, MAX_BYTES: 15_000_000, MAX_PHOTOS: 20, EVERY_HOURS: 6 } as const;

/**
 * Portāla uzturētājs (juridiskās lapas un kājene). null = vēl nav izlemts, lapās rāda "tiks norādīts".
 * Aizpildīt pirms publiskas palaišanas.
 */
export const OPERATOR: { name: string | null; regNo: string | null; address: string | null; email: string | null; since: string } = {
  name: null,
  regNo: null,
  address: null,
  email: "info@vienavieta.lv",
  since: "2026-11-08",
};
