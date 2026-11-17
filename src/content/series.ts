// Dzīvokļu māju sērijas (/serijas un filtra paskaidrojums): ko nozīmē ss.com kategorijas visās valodās.
// Gadi un skaitļi ir aptuveni (tipiskie); konkrētajai mājai var atšķirties, tāpēc tekstā "parasti".
import type { Locale } from "@/i18n/core";
import type { SERIES } from "@/lib/constants";

type Series = (typeof SERIES)[number];
type Info = { era: string; text: string };
type Doc = {
  title: string;
  description: string;
  intro: string;
  tipH: string;
  tip: string;
  groups: { pre: string; soviet: string; new: string };
  colSeries: string; colEra: string; colN: string; colM2: string; colFloors: string;
  statsNote: string;
  facts: string; // {n}, {a}, {x}, {b}, {y}
  more: string;
  items: Record<Series, Info>;
};

export const SERIES_DOC: Record<Locale, Doc> = {
  lv: {
    title: "Dzīvokļu māju sērijas Latvijā",
    description: "Ko nozīmē 103., 104., 119., 467., 602. sērija, lietuviešu projekts, hruščovka, Staļina laika un pirmskara māja: gadi, stāvi, griesti, virtuves un cenas par m².",
    intro: "Sludinājumos māju sērija ir kategorija, ko pirms 20 gadiem ieviesa ss.com, un pārējie portāli to pārņēma. Tā apvieno ļoti dažādas mājas, tāpēc zemāk īsi aprakstīts, ko katra kategorija parasti nozīmē, un pie katras – cik šobrīd maksā kvadrātmetrs mūsu sludinājumos.",
    tipH: "Sērija nav viss",
    tip: "Pircējam svarīgāka ir konkrētās mājas un dzīvokļa situācija: stāvu skaits un vai ir lifts, vai māja siltināta, plānojums, griestu augstums un stāvoklis. Viena sērija var būt gan 5, gan 9 stāvus augsta, un \"Pirmskara\" vai \"Renovēta ēka\" var būt gan koka, gan ķieģeļu māja. Izmanto filtrus \"Stāvs\", \"Mājas tips\" un \"Stāvoklis\" kopā ar sēriju.",
    groups: { pre: "Pirms 1940", soviet: "Padomju laiks", new: "Jaunās, renovētās un citas" },
    colSeries: "Sērija", colEra: "Parasti būvēta", colN: "Pārdošanā", colM2: "€/m² (mediāna)", colFloors: "Biežākais stāvu skaits",
    statsNote: "Skaitļi no aktīvajiem dzīvokļu pārdošanas sludinājumiem Latvijā; viens dzīvoklis vairākos portālos skaitās vienreiz. Tās ir piedāvājuma cenas.",
    facts: "{n} dzīvokļi pārdošanā ar norādītu sēriju; dārgākais kvadrātmetrs: {a} ({x} €/m²), lētākais: {b} ({y} €/m²).",
    more: "Skatīt sludinājumus",
    items: {
      "Pirmskara": { era: "līdz 1940", text: "Mājas, kas celtas līdz Otrajam pasaules karam: jūgendstila un eklektikas nami, Ulmaņlaiku ķieģeļu mājas un koka mājas. Parasti augsti griesti (3 m un vairāk), biezas sienas, bieži bez lifta. Kategorija ir ļoti plaša – koka un ķieģeļu mājas atšķiras krasi, tāpēc skaties \"Mājas tips\"." },
      "Staļina laika": { era: "~1945–1958", text: "Pēckara ķieģeļu mājas, parasti 2–6 stāvi (ārpus Rīgas bieži nelielas 2–3 stāvu mājas). Augsti griesti (ap 3 m), lielas istabas, biezas sienas; lifts ne vienmēr." },
      "Hruščova laika": { era: "~1958–1965", text: "\"Hruščovkas\": parasti 4–5 stāvi, ķieģeļu vai paneļu, bez lifta. Zemāki griesti (ap 2,5 m), maza virtuve un bieži apvienota vannas istaba." },
      "103. sērija": { era: "~1960–1990", text: "Parasti 5 vai 9 stāvi, ķieģeļu vai paneļu. Nelielas virtuves (ap 6–7 m²); daļā plānojumu istabas ir caurstaigājamas. 9 stāvu mājās ir lifts." },
      "104. sērija": { era: "~1960–1990", text: "Biežāk 5 vai 9 stāvi, bet ir arī zemākas mājas. Pārsvarā ķieģeļu, istabas parasti izolētas, virtuve nedaudz lielāka nekā 103. sērijai." },
      "119. sērija": { era: "~1975–1992", text: "Paneļu mājas, parasti 9 stāvi (ir arī 5 un 12). Lifts, lodžija, lielākas virtuves (ap 8–9 m²) un izolētas istabas." },
      "467. sērija": { era: "~1960–1990", text: "Paneļu mājas, parasti 5 vai 9 stāvi. Kompakti dzīvokļi ar nelielu virtuvi (ap 6 m²)." },
      "602. sērija": { era: "~1970–1992", text: "Augstākās padomju mājas: parasti 9–16 stāvi, paneļu vai ķieģeļu, ar liftu. Lielāki logi un plašāki dzīvokļi nekā vecākajās sērijās." },
      "Lietuviešu": { era: "~1970–1992", text: "\"Lietuviešu projekts\": parasti 5 vai 9 stāvi, paneļu vai ķieģeļu. Salīdzinoši plaša virtuve, bieži atsevišķa vannas istaba un tualete." },
      "Mazģimeņu": { era: "~1970–1992", text: "Mazģimeņu mājas ar daudziem nelieliem 1–2 istabu dzīvokļiem (bieži 20–35 m²) un garu gaiteni stāvā." },
      "Čehu projekts": { era: "~1970–1990", text: "Čehoslovākijas projekta mājas, bieži 9–12 stāvus augstas. Bieži plašāki plānojumi nekā vairumam padomju sēriju: lielāka virtuve, atsevišķa vannas istaba un tualete." },
      "Specprojekts": { era: "padomju laiks", text: "Individuāli projektētas padomju mājas – ļoti dažādas, tāpēc stāvus, liftu un materiālu skaties konkrētajā sludinājumā." },
      "Jaunais projekts": { era: "pēc 1991", text: "Pēc neatkarības atjaunošanas (pārsvarā pēc 2000. gada) celtas mājas: parasti ar liftu, labāku siltumizolāciju un jaunāku inženiertīklu." },
      "Renovēta ēka": { era: "dažādi", text: "Vecāka (bieži pirmskara) māja pēc pilnas pārbūves. Kategorija nesaka, kad māja celta – tikai to, ka tā atjaunota." },
      "Privātmāja": { era: "dažādi", text: "Dzīvoklis privātmājā (divu vai dažu dzīvokļu mājā), nevis sērijveida daudzdzīvokļu ēkā." },
    },
  },
  en: {
    title: "Apartment building series in Latvia",
    description: "What series 103, 104, 119, 467, 602, the Lithuanian project, Khrushchev-era, Stalin-era and pre-war buildings mean: years, storeys, ceilings, kitchens and prices per m².",
    intro: "In Latvian listings, the building \"series\" is a category introduced by ss.com some 20 years ago and copied by other portals. It lumps very different buildings together, so below is a short description of what each category usually means, plus the current price per square metre in our listings.",
    tipH: "Series isn't everything",
    tip: "What matters more to a buyer is the actual building and flat: the number of storeys and whether there is a lift, insulation, layout, ceiling height and condition. One series can be 5 or 9 storeys tall, and \"Pre-war\" or \"Renovated building\" can be wooden or brick. Use the \"Floor\", \"Building type\" and \"Condition\" filters together with the series.",
    groups: { pre: "Before 1940", soviet: "Soviet era", new: "New, renovated and other" },
    colSeries: "Series", colEra: "Usually built", colN: "For sale", colM2: "€/m² (median)", colFloors: "Most common storeys",
    statsNote: "Figures from active flat-for-sale listings in Latvia; a flat listed on several portals counts once. These are asking prices.",
    facts: "{n} flats for sale with a series given; most expensive per m²: {a} (€{x}/m²), cheapest: {b} (€{y}/m²).",
    more: "See listings",
    items: {
      "Pirmskara": { era: "before 1940", text: "Buildings from before WWII: Art Nouveau and eclectic houses, brick buildings from the Ulmanis era and wooden houses. Usually high ceilings (3 m+), thick walls, often no lift. The category is very broad – wooden and brick houses differ a lot, so check \"Building type\"." },
      "Staļina laika": { era: "~1945–1958", text: "Post-war brick buildings, usually 2–6 storeys (outside Riga often small 2–3 storey houses). High ceilings (about 3 m), large rooms, thick walls; not always a lift." },
      "Hruščova laika": { era: "~1958–1965", text: "\"Khrushchyovkas\": usually 4–5 storeys, brick or panel, no lift. Lower ceilings (about 2.5 m), small kitchen and often a combined bathroom." },
      "103. sērija": { era: "~1960–1990", text: "Usually 5 or 9 storeys, brick or panel. Small kitchens (about 6–7 m²); some layouts have walk-through rooms. 9-storey buildings have a lift." },
      "104. sērija": { era: "~1960–1990", text: "Mostly 5 or 9 storeys, but lower buildings exist too. Mainly brick, rooms usually separate, kitchen slightly larger than in series 103." },
      "119. sērija": { era: "~1975–1992", text: "Panel buildings, usually 9 storeys (also 5 and 12). Lift, loggia, larger kitchens (about 8–9 m²) and separate rooms." },
      "467. sērija": { era: "~1960–1990", text: "Panel buildings, usually 5 or 9 storeys. Compact flats with a small kitchen (about 6 m²)." },
      "602. sērija": { era: "~1970–1992", text: "The tallest Soviet buildings: usually 9–16 storeys, panel or brick, with a lift. Bigger windows and roomier flats than older series." },
      "Lietuviešu": { era: "~1970–1992", text: "\"Lithuanian project\": usually 5 or 9 storeys, panel or brick. A relatively large kitchen, often a separate bathroom and toilet." },
      "Mazģimeņu": { era: "~1970–1992", text: "Small-family buildings with many small 1–2 room flats (often 20–35 m²) along a long corridor." },
      "Čehu projekts": { era: "~1970–1990", text: "Czechoslovak-designed buildings, often 9–12 storeys tall. Often roomier layouts than most Soviet series: larger kitchen, separate bathroom and toilet." },
      "Specprojekts": { era: "Soviet era", text: "Individually designed Soviet buildings – very varied, so check storeys, lift and material in the listing itself." },
      "Jaunais projekts": { era: "after 1991", text: "Built after independence was restored (mostly after 2000): usually with a lift, better insulation and newer utilities." },
      "Renovēta ēka": { era: "varies", text: "An older (often pre-war) building after a full reconstruction. The category doesn't say when it was built – only that it was renovated." },
      "Privātmāja": { era: "varies", text: "A flat in a private house (a building with two or a few flats) rather than a standard apartment block." },
    },
  },
  ru: {
    title: "Серии домов в Латвии",
    description: "Что означают 103, 104, 119, 467, 602 серия, литовский проект, хрущёвка, сталинка и довоенный дом: годы, этажи, потолки, кухни и цены за м².",
    intro: "Серия дома в объявлениях — это категория, которую около 20 лет назад ввёл ss.com, а остальные порталы переняли. Она объединяет очень разные дома, поэтому ниже кратко описано, что обычно означает каждая категория, и сколько сейчас стоит квадратный метр в наших объявлениях.",
    tipH: "Серия — это не всё",
    tip: "Покупателю важнее конкретный дом и квартира: этажность и наличие лифта, утепление, планировка, высота потолков и состояние. Одна серия бывает и 5, и 9 этажей, а «Довоенный» или «Реновированный дом» может быть и деревянным, и кирпичным. Используйте фильтры «Этаж», «Тип дома» и «Состояние» вместе с серией.",
    groups: { pre: "До 1940", soviet: "Советское время", new: "Новые, реновированные и другие" },
    colSeries: "Серия", colEra: "Обычно построен", colN: "В продаже", colM2: "€/м² (медиана)", colFloors: "Чаще всего этажей",
    statsNote: "Данные активных объявлений о продаже квартир в Латвии; квартира на нескольких порталах считается один раз. Это цены предложения.",
    facts: "{n} квартир в продаже с указанной серией; самый дорогой м²: {a} ({x} €/м²), самый дешёвый: {b} ({y} €/м²).",
    more: "Смотреть объявления",
    items: {
      "Pirmskara": { era: "до 1940", text: "Дома, построенные до Второй мировой войны: дома в стиле модерн и эклектики, кирпичные дома времён Улманиса и деревянные дома. Обычно высокие потолки (от 3 м), толстые стены, часто без лифта. Категория очень широкая — деревянные и кирпичные дома сильно отличаются, смотрите «Тип дома»." },
      "Staļina laika": { era: "~1945–1958", text: "Послевоенные кирпичные дома, обычно 2–6 этажей (за пределами Риги часто небольшие 2–3 этажные дома). Высокие потолки (около 3 м), большие комнаты, толстые стены; лифт не всегда." },
      "Hruščova laika": { era: "~1958–1965", text: "«Хрущёвки»: обычно 4–5 этажей, кирпич или панель, без лифта. Низкие потолки (около 2,5 м), маленькая кухня, часто совмещённый санузел." },
      "103. sērija": { era: "~1960–1990", text: "Обычно 5 или 9 этажей, кирпич или панель. Небольшие кухни (около 6–7 м²); в части планировок проходные комнаты. В 9-этажных домах есть лифт." },
      "104. sērija": { era: "~1960–1990", text: "Чаще 5 или 9 этажей, но бывают и ниже. В основном кирпичные, комнаты обычно раздельные, кухня немного больше, чем в 103 серии." },
      "119. sērija": { era: "~1975–1992", text: "Панельные дома, обычно 9 этажей (бывают 5 и 12). Лифт, лоджия, большие кухни (около 8–9 м²) и раздельные комнаты." },
      "467. sērija": { era: "~1960–1990", text: "Панельные дома, обычно 5 или 9 этажей. Компактные квартиры с небольшой кухней (около 6 м²)." },
      "602. sērija": { era: "~1970–1992", text: "Самые высокие советские дома: обычно 9–16 этажей, панель или кирпич, с лифтом. Большие окна и более просторные квартиры, чем в старых сериях." },
      "Lietuviešu": { era: "~1970–1992", text: "«Литовский проект»: обычно 5 или 9 этажей, панель или кирпич. Сравнительно большая кухня, часто раздельный санузел." },
      "Mazģimeņu": { era: "~1970–1992", text: "Малосемейки: много небольших 1–2 комнатных квартир (часто 20–35 м²) вдоль длинного коридора." },
      "Čehu projekts": { era: "~1970–1990", text: "Дома чешского (чехословацкого) проекта, часто 9–12 этажей. Часто более просторные планировки, чем в большинстве советских серий: большая кухня, раздельный санузел." },
      "Specprojekts": { era: "советское время", text: "Советские дома по индивидуальному проекту — очень разные, поэтому этажность, лифт и материал смотрите в самом объявлении." },
      "Jaunais projekts": { era: "после 1991", text: "Дома, построенные после восстановления независимости (в основном после 2000 года): обычно с лифтом, лучшей теплоизоляцией и новыми коммуникациями." },
      "Renovēta ēka": { era: "по-разному", text: "Старый (часто довоенный) дом после полной реконструкции. Категория не говорит, когда дом построен, — только что он обновлён." },
      "Privātmāja": { era: "по-разному", text: "Квартира в частном доме (на две или несколько квартир), а не в типовом многоквартирном доме." },
    },
  },
  lt: {
    title: "Daugiabučių serijos Latvijoje",
    description: "Ką reiškia 103, 104, 119, 467, 602 serija, lietuviškas projektas, chruščiovka, Stalino laikų ir prieškario namas: metai, aukštai, lubos, virtuvės ir kainos už m².",
    intro: "Latvijos skelbimuose namo „serija“ yra kategorija, kurią prieš maždaug 20 metų įvedė ss.com, o kiti portalai perėmė. Ji sujungia labai skirtingus namus, todėl žemiau trumpai aprašyta, ką kiekviena kategorija paprastai reiškia, ir kiek dabar kainuoja kvadratinis metras mūsų skelbimuose.",
    tipH: "Serija – ne viskas",
    tip: "Pirkėjui svarbiau konkretus namas ir butas: aukštų skaičius ir ar yra liftas, apšiltinimas, išplanavimas, lubų aukštis ir būklė. Ta pati serija gali būti ir 5, ir 9 aukštų, o „Prieškarinis“ ar „Renovuotas pastatas“ gali būti ir medinis, ir mūrinis. Naudok filtrus „Aukštas“, „Namo tipas“ ir „Būklė“ kartu su serija.",
    groups: { pre: "Iki 1940", soviet: "Sovietmetis", new: "Nauji, renovuoti ir kiti" },
    colSeries: "Serija", colEra: "Paprastai pastatytas", colN: "Parduodama", colM2: "€/m² (mediana)", colFloors: "Dažniausiai aukštų",
    statsNote: "Duomenys iš aktyvių butų pardavimo skelbimų Latvijoje; butas keliuose portaluose skaičiuojamas vieną kartą. Tai pasiūlos kainos.",
    facts: "{n} parduodamų butų su nurodyta serija; brangiausias m²: {a} ({x} €/m²), pigiausias: {b} ({y} €/m²).",
    more: "Žiūrėti skelbimus",
    items: {
      "Pirmskara": { era: "iki 1940", text: "Namai, pastatyti iki Antrojo pasaulinio karo: moderno ir eklektikos pastatai, Ulmanio laikų mūriniai namai ir mediniai namai. Paprastai aukštos lubos (3 m ir daugiau), storos sienos, dažnai be lifto. Kategorija labai plati – mediniai ir mūriniai namai labai skiriasi, todėl žiūrėk „Namo tipas“." },
      "Staļina laika": { era: "~1945–1958", text: "Pokario mūriniai namai, paprastai 2–6 aukštų (už Rygos dažnai nedideli 2–3 aukštų namai). Aukštos lubos (apie 3 m), didelės patalpos, storos sienos; liftas ne visada." },
      "Hruščova laika": { era: "~1958–1965", text: "„Chruščiovkos“: paprastai 4–5 aukštų, mūrinės arba blokinės, be lifto. Žemesnės lubos (apie 2,5 m), maža virtuvė ir dažnai sujungtas vonios kambarys." },
      "103. sērija": { era: "~1960–1990", text: "Paprastai 5 arba 9 aukštų, mūriniai arba blokiniai. Nedidelės virtuvės (apie 6–7 m²); dalyje išplanavimų pereinami kambariai. 9 aukštų namuose yra liftas." },
      "104. sērija": { era: "~1960–1990", text: "Dažniausiai 5 arba 9 aukštų, bet yra ir žemesnių. Daugiausia mūriniai, kambariai paprastai atskiri, virtuvė šiek tiek didesnė nei 103 serijoje." },
      "119. sērija": { era: "~1975–1992", text: "Blokiniai namai, paprastai 9 aukštų (būna 5 ir 12). Liftas, lodžija, didesnės virtuvės (apie 8–9 m²) ir atskiri kambariai." },
      "467. sērija": { era: "~1960–1990", text: "Blokiniai namai, paprastai 5 arba 9 aukštų. Kompaktiški butai su nedidele virtuve (apie 6 m²)." },
      "602. sērija": { era: "~1970–1992", text: "Aukščiausi sovietiniai namai: paprastai 9–16 aukštų, blokiniai arba mūriniai, su liftu. Didesni langai ir erdvesni butai nei senesnėse serijose." },
      "Lietuviešu": { era: "~1970–1992", text: "„Lietuviškas projektas“: paprastai 5 arba 9 aukštų, blokiniai arba mūriniai. Gana didelė virtuvė, dažnai atskiras vonios kambarys ir tualetas." },
      "Mazģimeņu": { era: "~1970–1992", text: "Mažašeimiai namai su daug mažų 1–2 kambarių butų (dažnai 20–35 m²) ilgame koridoriuje." },
      "Čehu projekts": { era: "~1970–1990", text: "Čekoslovakiško projekto namai, dažnai 9–12 aukštų. Dažnai erdvesni išplanavimai nei daugumoje sovietinių serijų: didesnė virtuvė, atskiras vonios kambarys ir tualetas." },
      "Specprojekts": { era: "sovietmetis", text: "Pagal individualų projektą statyti sovietiniai namai – labai įvairūs, todėl aukštus, liftą ir medžiagą žiūrėk pačiame skelbime." },
      "Jaunais projekts": { era: "po 1991", text: "Pastatyti atkūrus nepriklausomybę (daugiausia po 2000 m.): paprastai su liftu, geresne šilumine izoliacija ir naujesnėmis komunikacijomis." },
      "Renovēta ēka": { era: "įvairiai", text: "Senesnis (dažnai prieškario) namas po visiškos rekonstrukcijos. Kategorija nesako, kada namas pastatytas, – tik kad jis atnaujintas." },
      "Privātmāja": { era: "įvairiai", text: "Butas privačiame name (dviejų ar kelių butų name), o ne tipiniame daugiabutyje." },
    },
  },
};

/** Enkurs lapā /serijas: "103. sērija" → "103-serija", "Staļina laika" → "stalina-laika". */
export const seriesAnchor = (s: string) =>
  s.toLocaleLowerCase("lv").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
