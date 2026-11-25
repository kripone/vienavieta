// Īsi apkaimju apraksti 4 valodās: SEO apkaimes lapā (/ipasumi/<veids>/<pilsēta>/<apkaime>) un īpašuma sludinājumā.
// Tikai vispārzināmi fakti (atrašanās, apbūves veids, transports); cenas rāda lapa no mūsu datiem.
// Atslēga: "<pilsēta>|<apkaime>" kā `places`/`regions` nosaukumos.
import type { Locale } from "@/i18n/core";

export const AREA_INFO: Record<string, Record<Locale, string>> = {
  "Rīga|Centrs": {
    lv: "Rīgas centrs ap Brīvības ielu un bulvāru loku: jūgendstila un eklektikas nami, liela daļa UNESCO Pasaules mantojuma teritorijā. Daudz pirmskara dzīvokļu ar augstiem griestiem; pakalpojumi un sabiedriskais transports tuvu, stāvvietu maz.",
    en: "Central Riga around Brīvības iela and the boulevard ring: Art Nouveau and eclectic buildings, much of it within the UNESCO World Heritage area. Many pre-war flats with high ceilings; services and public transport close by, parking scarce.",
    ru: "Центр Риги вокруг улицы Бривибас и кольца бульваров: дома в стиле модерн и эклектики, большая часть — в зоне Всемирного наследия ЮНЕСКО. Много довоенных квартир с высокими потолками; рядом сервисы и транспорт, парковки мало.",
    lt: "Rygos centras aplink Brīvības gatvę ir bulvarų žiedą: jugendo ir eklektikos pastatai, didelė dalis – UNESCO pasaulio paveldo teritorijoje. Daug prieškarinių butų aukštomis lubomis; paslaugos ir transportas arti, parkavimo mažai.",
  },
  "Rīga|Vecrīga": {
    lv: "Rīgas vēsturiskais kodols UNESCO Pasaules mantojuma sarakstā: viduslaiku ielas, gājēju zona un sena apbūve ar stingriem pārbūves noteikumiem. Auto piekļuve ierobežota.",
    en: "Riga's historic core on the UNESCO World Heritage list: medieval streets, a pedestrian zone and old buildings with strict renovation rules. Car access is restricted.",
    ru: "Исторический центр Риги из списка Всемирного наследия ЮНЕСКО: средневековые улицы, пешеходная зона и старинные здания со строгими правилами перестройки. Въезд на авто ограничен.",
    lt: "Istorinė Rygos šerdis, įtraukta į UNESCO pasaulio paveldo sąrašą: viduramžių gatvės, pėsčiųjų zona ir seni pastatai su griežtomis rekonstrukcijos taisyklėmis. Įvažiavimas automobiliu ribotas.",
  },
  "Rīga|Āgenskalns": {
    lv: "Pārdaugavas apkaime netālu no centra ar vēsturisku koka apbūvi, Āgenskalna tirgu un Māras dīķi. Blakus koka namiem ir padomju laika mājas un jauni projekti.",
    en: "A Pārdaugava neighbourhood close to the centre, with historic wooden houses, Āgenskalns Market and Māra's Pond. Soviet-era blocks and new developments stand alongside the wooden buildings.",
    ru: "Район Пардаугавы недалеко от центра: историческая деревянная застройка, Агенскалнский рынок и пруд Мары. Рядом с деревянными домами — советские дома и новые проекты.",
    lt: "Pārdaugavos rajonas netoli centro su istoriniais mediniais namais, Āgenskalnio turgumi ir Māros tvenkiniu. Šalia medinių namų – sovietmečio ir nauji projektai.",
  },
  "Rīga|Purvciems": {
    lv: "Liela padomju laika dzīvojamā apkaime Rīgas austrumos ar 1960.–80. gadu daudzstāvu mājām (103., 104., 119., 602. sērija). Daudz zaļumu, skolu un veikalu; uz centru kursē trolejbusi un autobusi.",
    en: "A large Soviet-era residential district in eastern Riga with apartment blocks from the 1960s–80s (103, 104, 119, 602 series). Plenty of greenery, schools and shops; trolleybuses and buses run to the centre.",
    ru: "Большой спальный район советской эпохи на востоке Риги с многоэтажками 1960–80-х годов (серии 103, 104, 119, 602). Много зелени, школ и магазинов; до центра ходят троллейбусы и автобусы.",
    lt: "Didelis sovietmečio gyvenamasis rajonas rytinėje Rygoje su 1960–80 m. daugiabučiais (103, 104, 119, 602 serijos). Daug žalumos, mokyklų ir parduotuvių; į centrą važiuoja troleibusai ir autobusai.",
  },
  "Rīga|Imanta": {
    lv: "Pārdaugavas rietumu apkaime ar 1970.–80. gadu daudzstāvu mājām un privātmāju kvartāliem, netālu no Babītes ezera un Jūrmalas šosejas. Uz centru – vilciens un autobusi.",
    en: "A western Pārdaugava neighbourhood with 1970s–80s apartment blocks and areas of private houses, close to Lake Babīte and the Jūrmala highway. Trains and buses run to the centre.",
    ru: "Западный район Пардаугавы с многоэтажками 1970–80-х и кварталами частных домов, рядом с озером Бабите и Юрмальским шоссе. До центра — поезд и автобусы.",
    lt: "Vakarinis Pārdaugavos rajonas su 1970–80 m. daugiabučiais ir privačių namų kvartalais, netoli Babītės ežero ir Jūrmalos plento. Į centrą – traukinys ir autobusai.",
  },
  "Rīga|Teika": {
    lv: "Klusa un zaļa apkaime pie Brīvības gatves ar starpkaru un pēckara mūra mājām un savrupmājām. Uz centru tieši pa Brīvības ielu.",
    en: "A quiet, green neighbourhood along Brīvības gatve with interwar and post-war brick buildings and detached houses. A straight run to the centre along Brīvības iela.",
    ru: "Тихий зелёный район у Бривибас гатве с кирпичными домами межвоенного и послевоенного времени и частными домами. До центра — прямо по улице Бривибас.",
    lt: "Ramus ir žalias rajonas prie Brīvības gatvės su tarpukario ir pokario mūriniais namais bei individualiais namais. Į centrą tiesiai Brīvības gatve.",
  },
  "Rīga|Ziepniekkalns": {
    lv: "Pārdaugavas dienvidu apkaime ar padomju laika daudzstāvu mājām un daudziem jauniem projektiem, netālu no Dienvidu tilta un Bauskas ielas.",
    en: "A southern Pārdaugava neighbourhood with Soviet-era apartment blocks and many new developments, near the Southern Bridge and Bauskas iela.",
    ru: "Южный район Пардаугавы с советскими многоэтажками и множеством новых проектов, рядом с Южным мостом и улицей Баускас.",
    lt: "Pietinis Pārdaugavos rajonas su sovietmečio daugiabučiais ir daug naujų projektų, netoli Pietinio tilto ir Bauskas gatvės.",
  },
  "Rīga|Ķengarags": {
    lv: "Padomju laika apkaime gar Daugavu Rīgas dienvidaustrumos ar 1970.–80. gadu daudzstāvu mājām un promenādi pie upes. Uz centru kursē tramvajs.",
    en: "A Soviet-era neighbourhood along the Daugava in south-eastern Riga, with 1970s–80s apartment blocks and a riverside promenade. A tram runs to the centre.",
    ru: "Советский район вдоль Даугавы на юго-востоке Риги с многоэтажками 1970–80-х и набережной. До центра ходит трамвай.",
    lt: "Sovietmečio rajonas prie Dauguvos pietryčių Rygoje su 1970–80 m. daugiabučiais ir pakrantės promenada. Į centrą važiuoja tramvajus.",
  },
  "Rīga|Sarkandaugava": {
    lv: "Apkaime Rīgas ziemeļos starp centru un ostu ar koka apbūvi, padomju mājām un rūpnieciskām teritorijām. Uz centru kursē tramvajs.",
    en: "A neighbourhood in northern Riga between the centre and the port, with wooden houses, Soviet blocks and industrial areas. A tram runs to the centre.",
    ru: "Район на севере Риги между центром и портом: деревянная застройка, советские дома и промышленные территории. До центра ходит трамвай.",
    lt: "Rajonas šiaurinėje Rygoje tarp centro ir uosto su mediniais namais, sovietiniais daugiabučiais ir pramonės teritorijomis. Į centrą važiuoja tramvajus.",
  },
  "Rīga|Iļģuciems": {
    lv: "Pārdaugavas apkaime ar padomju laika daudzstāvu mājām, privātmājām un bijušām rūpnīcu teritorijām, netālu no Daugavas.",
    en: "A Pārdaugava neighbourhood with Soviet-era apartment blocks, private houses and former factory sites, close to the Daugava.",
    ru: "Район Пардаугавы с советскими многоэтажками, частными домами и бывшими заводскими территориями, недалеко от Даугавы.",
    lt: "Pārdaugavos rajonas su sovietmečio daugiabučiais, privačiais namais ir buvusiomis gamyklų teritorijomis, netoli Dauguvos.",
  },
  "Rīga|Zolitūde": {
    lv: "Pārdaugavas rietumu apkaime blakus Imantai ar 1980. gadu daudzstāvu mājām un jaunākiem projektiem; ir dzelzceļa stacija.",
    en: "A western Pārdaugava neighbourhood next to Imanta with 1980s apartment blocks and newer developments; it has a railway station.",
    ru: "Западный район Пардаугавы рядом с Имантой: многоэтажки 1980-х и более новые проекты; есть железнодорожная станция.",
    lt: "Vakarinis Pārdaugavos rajonas šalia Imantos su 1980 m. daugiabučiais ir naujesniais projektais; yra geležinkelio stotis.",
  },
  "Rīga|Dārzciems": {
    lv: "Apkaime Rīgas austrumos starp Purvciemu un Ķengaragu ar padomju laika daudzstāvu mājām un privātmājām.",
    en: "A neighbourhood in eastern Riga between Purvciems and Ķengarags, with Soviet-era apartment blocks and private houses.",
    ru: "Район на востоке Риги между Пурвциемсом и Кенгарагсом с советскими многоэтажками и частными домами.",
    lt: "Rajonas rytinėje Rygoje tarp Purvciemo ir Ķengarago su sovietmečio daugiabučiais ir privačiais namais.",
  },
  "Rīga|Vecmīlgrāvis": {
    lv: "Rīgas ziemeļu apkaime pie Mīlgrāvja un ostas ar padomju laika daudzstāvu mājām; netālu Vecāķu pludmale.",
    en: "A northern Riga neighbourhood by the Mīlgrāvis canal and the port, with Soviet-era apartment blocks; Vecāķi beach is nearby.",
    ru: "Северный район Риги у канала Милгравис и порта с советскими многоэтажками; рядом пляж Вецаки.",
    lt: "Šiaurinis Rygos rajonas prie Mīlgrāvio kanalo ir uosto su sovietmečio daugiabučiais; netoli Vecāķių paplūdimys.",
  },
  "Rīga|Mežciems": {
    lv: "Zaļa apkaime pie Biķernieku meža Rīgas austrumos ar 1970.–80. gadu daudzstāvu mājām un jaunākiem projektiem.",
    en: "A green neighbourhood by Biķernieki forest in eastern Riga, with 1970s–80s apartment blocks and newer developments.",
    ru: "Зелёный район у Бикерниекского леса на востоке Риги с многоэтажками 1970–80-х и более новыми проектами.",
    lt: "Žalias rajonas prie Biķernieku miško rytinėje Rygoje su 1970–80 m. daugiabučiais ir naujesniais projektais.",
  },
  "Rīga|Ķīpsala": {
    lv: "Sala Daugavā pretī Vecrīgai ar atjaunotām koka zvejnieku mājām, modernu biroju un dzīvokļu apbūvi un izstāžu centru.",
    en: "An island in the Daugava opposite the Old Town, with restored wooden fishermen's houses, modern offices and flats, and an exhibition centre.",
    ru: "Остров на Даугаве напротив Старой Риги: отреставрированные деревянные рыбацкие дома, современные офисы и квартиры, выставочный центр.",
    lt: "Sala Dauguvoje priešais Senamiestį su restauruotais mediniais žvejų namais, moderniais biurais ir butais bei parodų centru.",
  },
  "Rīga|Jugla": {
    lv: "Apkaime Rīgas austrumos pie Juglas ezera ar padomju laika mājām un privātmājām; netālu Latvijas Etnogrāfiskais brīvdabas muzejs.",
    en: "A neighbourhood in eastern Riga by Lake Jugla, with Soviet-era blocks and private houses; the Latvian Ethnographic Open-Air Museum is nearby.",
    ru: "Район на востоке Риги у озера Югла с советскими домами и частной застройкой; рядом Латвийский этнографический музей под открытым небом.",
    lt: "Rajonas rytinėje Rygoje prie Juglos ežero su sovietmečio ir privačiais namais; netoli Latvijos etnografinis muziejus po atviru dangumi.",
  },
  "Rīga|Bolderāja": {
    lv: "Rīgas ziemeļrietumu apkaime pie Lielupes un Buļļupes ar privātmājām un padomju laika mājām; tālu no centra, bet tuvu jūrai.",
    en: "A north-western Riga neighbourhood by the Lielupe and Buļļupe rivers, with private houses and Soviet-era blocks; far from the centre but close to the sea.",
    ru: "Северо-западный район Риги у рек Лиелупе и Буллюпе с частными домами и советскими многоэтажками; далеко от центра, но близко к морю.",
    lt: "Šiaurės vakarų Rygos rajonas prie Lielupės ir Buļļupės su privačiais ir sovietmečio namais; toli nuo centro, bet arti jūros.",
  },
  "Rīga|Šampēteris": {
    lv: "Pārdaugavas apkaime ar privātmājām un mazstāvu apbūvi, netālu no Zasulauka un Imantas.",
    en: "A Pārdaugava neighbourhood of private houses and low-rise buildings, near Zasulauks and Imanta.",
    ru: "Район Пардаугавы с частными домами и малоэтажной застройкой, рядом с Засулауксом и Имантой.",
    lt: "Pārdaugavos rajonas su privačiais namais ir mažaaukšte statyba, netoli Zasulauko ir Imantos.",
  },
  "Rīga|Grīziņkalns": {
    lv: "Apkaime blakus Rīgas centram ar koka un mūra apbūvi un Grīziņkalna parku.",
    en: "A neighbourhood next to central Riga with wooden and brick buildings and Grīziņkalns park.",
    ru: "Район рядом с центром Риги с деревянной и каменной застройкой и парком Гризинькалнс.",
    lt: "Rajonas šalia Rygos centro su mediniais ir mūriniais pastatais bei Grīziņkalnio parku.",
  },
};

export const areaInfo = (city: string | null | undefined, name: string | null | undefined, locale: Locale): string | null =>
  city && name ? AREA_INFO[`${city}|${name}`]?.[locale] ?? null : null;
