// Populārāko auto modeļu paaudzes (Eiropas tirgus ražošanas gadi, facelift gads) un daži fakti 4 valodās.
// Rāda SEO modeļa lapā (/auto/<marka>/<modelis>) un sludinājumā (paaudze pēc izlaiduma gada).
// Gadi ir aptuveni: ražošanas sākums/beigas un facelift dažādos tirgos var atšķirties par gadu, tāpēc tekstā "parasti".
// Atslēga: marka un modelis tieši kā mūsu katalogā (makes.name, models.name).
import type { Locale } from "@/i18n/core";

/** [paaudzes kods, no, līdz (null = ražo joprojām), facelift gads] */
export type Gen = [code: string, from: number, to: number | null, facelift?: number | null];
export type ModelInfo = { gens: Gen[]; facts: Record<Locale, string[]> };

export const MODEL_INFO: Record<string, ModelInfo> = {
  "BMW|5. sērija": {
    gens: [["E34", 1988, 1996, 1994], ["E39", 1995, 2004, 2000], ["E60/E61", 2003, 2010, 2007], ["F10/F11", 2010, 2017, 2013], ["G30/G31", 2017, 2023, 2020], ["G60/G61", 2023, null]],
    facts: {
      lv: ["Universāls (Touring) 5. sērijai pirmo reizi parādījās E34 paaudzē 1991. gadā.", "Detaļas un cenas atšķiras pēc paaudzes koda (E39, F10, G30), tāpēc to vērts zināt, salīdzinot sludinājumus."],
      en: ["The 5 Series Touring estate first appeared with the E34 generation in 1991.", "Parts and prices differ by generation code (E39, F10, G30), so it is worth knowing when comparing listings."],
      ru: ["Универсал Touring у 5-й серии впервые появился в поколении E34 в 1991 году.", "Запчасти и цены зависят от кода поколения (E39, F10, G30) — его стоит знать при сравнении объявлений."],
      lt: ["5 serijos universalas (Touring) pirmą kartą pasirodė E34 kartoje 1991 m.", "Dalys ir kainos skiriasi pagal kartos kodą (E39, F10, G30), todėl jį verta žinoti lyginant skelbimus."],
    },
  },
  "BMW|3. sērija": {
    gens: [["E36", 1990, 2000], ["E46", 1998, 2006, 2001], ["E90/E91", 2005, 2012, 2008], ["F30/F31", 2012, 2019, 2015], ["G20/G21", 2019, null, 2022]],
    facts: {
      lv: ["3. sērija ir visvairāk pārdotais BMW modelis vēsturē.", "Touring universāls 3. sērijai pieejams kopš E30 paaudzes (1987)."],
      en: ["The 3 Series is the best-selling BMW model in history.", "A Touring estate has been offered since the E30 generation (1987)."],
      ru: ["3-я серия — самая продаваемая модель BMW в истории.", "Универсал Touring предлагается со времён поколения E30 (1987)."],
      lt: ["3 serija yra perkamiausias BMW modelis istorijoje.", "Touring universalas siūlomas nuo E30 kartos (1987)."],
    },
  },
  "Audi|A6": {
    gens: [["C4", 1994, 1997], ["C5", 1997, 2004, 2001], ["C6", 2004, 2011, 2008], ["C7", 2011, 2018, 2014], ["C8", 2018, 2025, 2023], ["C9", 2025, null]],
    facts: {
      lv: ["Bezceļu versija allroad quattro pirmo reizi parādījās C5 paaudzē (2000).", "C6 paaudzē debitēja 3.0 TDI V6 dīzelis, kas kļuva par vienu no populārākajiem A6 dzinējiem."],
      en: ["The off-road allroad quattro version first appeared with the C5 generation (2000).", "The C6 generation introduced the 3.0 TDI V6 diesel, which became one of the most popular A6 engines."],
      ru: ["Внедорожная версия allroad quattro впервые появилась в поколении C5 (2000).", "В поколении C6 дебютировал дизель 3.0 TDI V6 — один из самых популярных моторов A6."],
      lt: ["Visureigė allroad quattro versija pirmą kartą pasirodė C5 kartoje (2000).", "C6 kartoje debiutavo 3.0 TDI V6 dyzelis, tapęs vienu populiariausių A6 variklių."],
    },
  },
  "Volkswagen|Passat": {
    gens: [["B5", 1996, 2005, 2000], ["B6", 2005, 2010], ["B7", 2010, 2014], ["B8", 2014, 2023, 2019], ["B9", 2023, null]],
    facts: {
      lv: ["Passat ražo kopš 1973. gada, un tas ir viens no visvairāk pārdotajiem VW modeļiem.", "B7 (2010–2014) patiesībā ir dziļi modernizēts B6 ar tām pašām durvīm un jumtu."],
      en: ["The Passat has been built since 1973 and is one of VW's best-selling models.", "The B7 (2010–2014) is really a heavily updated B6 with the same doors and roof."],
      ru: ["Passat выпускается с 1973 года и входит в число самых продаваемых моделей VW.", "B7 (2010–2014) — по сути глубоко обновлённый B6 с теми же дверями и крышей."],
      lt: ["Passat gaminamas nuo 1973 m. ir yra vienas perkamiausių VW modelių.", "B7 (2010–2014) iš esmės yra smarkiai atnaujintas B6 su tomis pačiomis durimis ir stogu."],
    },
  },
  "Volkswagen|Golf": {
    gens: [["Mk4", 1997, 2003], ["Mk5", 2003, 2008], ["Mk6", 2008, 2012], ["Mk7", 2012, 2019, 2017], ["Mk8", 2019, null, 2024]],
    facts: {
      lv: ["Golf ražo kopš 1974. gada, un kopumā pārdoti vairāk nekā 37 miljoni.", "Mk7 pārejot uz MQB platformu, auto kļuva līdz 100 kg vieglāks par Mk6."],
      en: ["The Golf has been built since 1974, with more than 37 million sold.", "Moving to the MQB platform made the Mk7 up to 100 kg lighter than the Mk6."],
      ru: ["Golf выпускается с 1974 года, продано более 37 миллионов.", "Переход на платформу MQB сделал Mk7 легче Mk6 до 100 кг."],
      lt: ["Golf gaminamas nuo 1974 m., parduota daugiau nei 37 milijonai.", "Perėjus prie MQB platformos Mk7 tapo iki 100 kg lengvesnis už Mk6."],
    },
  },
  "Audi|A4": {
    gens: [["B5", 1994, 2001, 1999], ["B6", 2000, 2004], ["B7", 2004, 2008], ["B8", 2007, 2015, 2011], ["B9", 2015, 2024, 2019]],
    facts: {
      lv: ["B8 paaudzē ieviesa MLB platformu, kurā priekšējā ass pārvietota uz priekšu labākam svara sadalījumam.", "Kopš 2024. gada A4 pēcteci Audi sauc par A5."],
      en: ["The B8 introduced the MLB platform, moving the front axle forward for better weight distribution.", "Since 2024 Audi calls the A4's successor the A5."],
      ru: ["В поколении B8 появилась платформа MLB с вынесенной вперёд передней осью для лучшей развесовки.", "С 2024 года преемник A4 называется A5."],
      lt: ["B8 kartoje pristatyta MLB platforma, priekinę ašį perkeliant į priekį geresniam svorio pasiskirstymui.", "Nuo 2024 m. A4 įpėdinis vadinamas A5."],
    },
  },
  "Volvo|XC60": {
    gens: [["1. paaudze", 2008, 2017, 2013], ["2. paaudze", 2017, null, 2021]],
    facts: {
      lv: ["Pirmā XC60 bija viens no pirmajiem auto ar standarta City Safety automātisko bremzēšanu.", "Otrā paaudze ieguva titulu „Pasaules gada auto 2018”."],
      en: ["The first XC60 was one of the first cars with City Safety automatic braking as standard.", "The second generation won World Car of the Year 2018."],
      ru: ["Первый XC60 одним из первых получил автоматическое торможение City Safety в базе.", "Второе поколение стало «Всемирным автомобилем года 2018»."],
      lt: ["Pirmasis XC60 buvo vienas pirmųjų automobilių su standartiniu City Safety automatiniu stabdymu.", "Antroji karta laimėjo „Pasaulio metų automobilio 2018“ titulą."],
    },
  },
  "BMW|X5": {
    gens: [["E53", 1999, 2006, 2003], ["E70", 2006, 2013, 2010], ["F15", 2013, 2018], ["G05", 2018, null, 2023]],
    facts: {
      lv: ["X5 ir pirmais BMW apvidus auto; BMW to sauc par SAV (Sports Activity Vehicle).", "Pirmo X5 izstrādāja laikā, kad BMW piederēja Land Rover."],
      en: ["The X5 was BMW's first SUV; BMW calls it an SAV (Sports Activity Vehicle).", "The first X5 was developed while BMW owned Land Rover."],
      ru: ["X5 — первый внедорожник BMW; сама BMW называет его SAV (Sports Activity Vehicle).", "Первый X5 разрабатывался, когда BMW владела Land Rover."],
      lt: ["X5 – pirmasis BMW visureigis; BMW jį vadina SAV (Sports Activity Vehicle).", "Pirmasis X5 kurtas tuo metu, kai BMW priklausė Land Rover."],
    },
  },
  "Volkswagen|Tiguan": {
    gens: [["1. paaudze", 2007, 2016, 2011], ["2. paaudze", 2016, 2024, 2020], ["3. paaudze", 2024, null]],
    facts: {
      lv: ["Nosaukumu izvēlējās lasītāju balsojumā – tas apvieno vārdus „tīģeris” un „iguāna”.", "Otrajā paaudzē parādījās garā 7 vietu versija Allspace."],
      en: ["The name was chosen by a reader vote and combines “tiger” and “iguana”.", "The second generation added the long seven-seat Allspace version."],
      ru: ["Название выбрали читатели голосованием — оно объединяет слова «тигр» и «игуана».", "Во втором поколении появилась длинная 7-местная версия Allspace."],
      lt: ["Pavadinimas išrinktas skaitytojų balsavimu ir sujungia žodžius „tigras“ ir „iguana“.", "Antrojoje kartoje atsirado ilga 7 vietų versija Allspace."],
    },
  },
  "Mercedes-Benz|E klase": {
    gens: [["W210", 1995, 2002, 1999], ["W211", 2002, 2009, 2006], ["W212", 2009, 2016, 2013], ["W213", 2016, 2023, 2020], ["W214", 2023, null]],
    facts: {
      lv: ["W210 ieviesa E klasei raksturīgos četrus apaļos lukturus.", "W212 facelift 2013. gadā aizstāja dalītos lukturus ar vienotiem."],
      en: ["The W210 introduced the E-Class's signature four round headlights.", "The 2013 W212 facelift replaced the split headlights with single units."],
      ru: ["W210 принёс фирменные четыре круглые фары E-класса.", "Рестайлинг W212 в 2013 году заменил раздельные фары на цельные."],
      lt: ["W210 įvedė E klasei būdingus keturis apvalius žibintus.", "2013 m. W212 atnaujinimas padalintus žibintus pakeitė vientisais."],
    },
  },
  "Škoda|Octavia": {
    gens: [["1U", 1996, 2010, 2000], ["1Z", 2004, 2013, 2008], ["5E", 2012, 2020, 2017], ["NX", 2020, null, 2024]],
    facts: {
      lv: ["Nosaukums cēlies no latīņu „astotais”: 1959. gada Octavia bija astotais Škoda modelis pēc kara.", "Sportiskā versija RS ražota kopš 2000. gada."],
      en: ["The name comes from the Latin for “eighth”: the 1959 Octavia was Škoda's eighth post-war model.", "The sporty RS version has been built since 2000."],
      ru: ["Название от латинского «восьмая»: Octavia 1959 года была восьмой послевоенной моделью Škoda.", "Спортивная версия RS выпускается с 2000 года."],
      lt: ["Pavadinimas kilęs iš lotyniško „aštunta“: 1959 m. Octavia buvo aštuntas pokario Škoda modelis.", "Sportiška RS versija gaminama nuo 2000 m."],
    },
  },
  "BMW|X3": {
    gens: [["E83", 2003, 2010, 2006], ["F25", 2010, 2017, 2014], ["G01", 2017, 2024, 2021], ["G45", 2024, null]],
    facts: {
      lv: ["Pirmo X3 (E83) ražoja Magna Steyr rūpnīcā Austrijā.", "Kopš F25 paaudzes X3 ražo ASV, BMW rūpnīcā Spartanburgā."],
      en: ["The first X3 (E83) was built by Magna Steyr in Austria.", "Since the F25 generation the X3 has been built at BMW's Spartanburg plant in the USA."],
      ru: ["Первый X3 (E83) собирали на заводе Magna Steyr в Австрии.", "С поколения F25 X3 выпускают в США, на заводе BMW в Спартанберге."],
      lt: ["Pirmąjį X3 (E83) gamino Magna Steyr gamykla Austrijoje.", "Nuo F25 kartos X3 gaminamas JAV, BMW gamykloje Spartanburge."],
    },
  },
  "Toyota|RAV4": {
    gens: [["XA20", 2000, 2005, 2003], ["XA30", 2005, 2012, 2008], ["XA40", 2012, 2018, 2015], ["XA50", 2018, 2025]],
    facts: {
      lv: ["Viens no pirmajiem kompaktajiem krosoveriem; nosaukums nozīmē „Recreational Activity Vehicle 4WD”.", "Hibrīda versija Eiropā pieejama kopš 2016. gada (XA40 facelift)."],
      en: ["One of the first compact crossovers; the name stands for “Recreational Activity Vehicle 4WD”.", "A hybrid version has been sold in Europe since 2016 (XA40 facelift)."],
      ru: ["Один из первых компактных кроссоверов; название — «Recreational Activity Vehicle 4WD».", "Гибрид продаётся в Европе с 2016 года (рестайлинг XA40)."],
      lt: ["Vienas pirmųjų kompaktiškų krosoverių; pavadinimas reiškia „Recreational Activity Vehicle 4WD“.", "Hibridinė versija Europoje parduodama nuo 2016 m. (XA40 atnaujinimas)."],
    },
  },
  "Audi|Q5": {
    gens: [["8R", 2008, 2017, 2012], ["FY", 2016, 2024, 2020], ["3. paaudze", 2024, null]],
    facts: {
      lv: ["Pirmo Q5 ražoja Ingolštatē, otro – jaunajā Audi rūpnīcā Meksikā.", "2012. gada Q5 hybrid quattro bija pirmais Audi pilnhibrīds."],
      en: ["The first Q5 was built in Ingolstadt, the second at Audi's new plant in Mexico.", "The 2012 Q5 hybrid quattro was Audi's first full hybrid."],
      ru: ["Первый Q5 собирали в Ингольштадте, второй — на новом заводе Audi в Мексике.", "Q5 hybrid quattro 2012 года стал первым полным гибридом Audi."],
      lt: ["Pirmasis Q5 gamintas Ingolštate, antrasis – naujoje Audi gamykloje Meksikoje.", "2012 m. Q5 hybrid quattro buvo pirmasis Audi pilnasis hibridas."],
    },
  },
  "Volvo|XC90": {
    gens: [["1. paaudze", 2002, 2014, 2006], ["2. paaudze", 2014, null, 2019]],
    facts: {
      lv: ["Pirmā paaudze tika ražota 12 gadus.", "Otrā paaudze bija pirmais Volvo uz SPA platformas un ar „Tora āmura” LED lukturiem."],
      en: ["The first generation was built for 12 years.", "The second generation was the first Volvo on the SPA platform and with “Thor's hammer” LED lights."],
      ru: ["Первое поколение выпускалось 12 лет.", "Второе поколение — первый Volvo на платформе SPA и с LED-фарами «молот Тора»."],
      lt: ["Pirmoji karta gaminta 12 metų.", "Antroji karta – pirmasis Volvo SPA platformoje ir su „Toro kūjo“ LED žibintais."],
    },
  },
  "Nissan|Qashqai": {
    gens: [["J10", 2006, 2013, 2010], ["J11", 2013, 2021, 2017], ["J12", 2021, null, 2024]],
    facts: {
      lv: ["Qashqai radīja kompakto krosoveru klasi Eiropā; to izstrādāja un ražo Sanderlendā, Lielbritānijā.", "Pirmajai paaudzei bija 7 vietu versija Qashqai+2 (2008–2013)."],
      en: ["The Qashqai created the compact crossover class in Europe; it is designed and built in Sunderland, UK.", "The first generation had a seven-seat Qashqai+2 version (2008–2013)."],
      ru: ["Qashqai создал класс компактных кроссоверов в Европе; разработан и выпускается в Сандерленде (Великобритания).", "У первого поколения была 7-местная версия Qashqai+2 (2008–2013)."],
      lt: ["Qashqai sukūrė kompaktiškų krosoverių klasę Europoje; kuriamas ir gaminamas Sanderlande, JK.", "Pirmoji karta turėjo 7 vietų Qashqai+2 versiją (2008–2013)."],
    },
  },
  "Mercedes-Benz|C klase": {
    gens: [["W202", 1993, 2000], ["W203", 2000, 2007, 2004], ["W204", 2007, 2014, 2011], ["W205", 2014, 2021, 2018], ["W206", 2021, null]],
    facts: {
      lv: ["C klase 1993. gadā nomainīja modeli 190 (W201).", "W205 bija pirmā C klase ar pneimatisko piekari kā izvēles aprīkojumu."],
      en: ["The C-Class replaced the 190 (W201) in 1993.", "The W205 was the first C-Class offered with optional air suspension."],
      ru: ["C-класс в 1993 году сменил модель 190 (W201).", "W205 — первый C-класс с пневмоподвеской в качестве опции."],
      lt: ["C klasė 1993 m. pakeitė modelį 190 (W201).", "W205 – pirmoji C klasė su pasirenkama pneumatine pakaba."],
    },
  },
  "Opel|Astra": {
    gens: [["G", 1998, 2004], ["H", 2004, 2010, 2007], ["J", 2009, 2015, 2012], ["K", 2015, 2021, 2019], ["L", 2021, null]],
    facts: {
      lv: ["Astra K ieguva titulu „Eiropas gada auto 2016”.", "Astra L bija pirmā Astra uz Stellantis platformas – kopīgas ar Peugeot 308."],
      en: ["The Astra K won European Car of the Year 2016.", "The Astra L was the first Astra on a Stellantis platform, shared with the Peugeot 308."],
      ru: ["Astra K стала «Европейским автомобилем года 2016».", "Astra L — первая Astra на платформе Stellantis, общей с Peugeot 308."],
      lt: ["Astra K laimėjo „Europos metų automobilio 2016“ titulą.", "Astra L – pirmoji Astra Stellantis platformoje, bendroje su Peugeot 308."],
    },
  },
  "BMW|1. sērija": {
    gens: [["E87", 2004, 2011, 2007], ["F20", 2011, 2019, 2015], ["F40", 2019, 2024], ["F70", 2024, null]],
    facts: {
      lv: ["Līdz 2019. gadam (F20) 1. sērija bija vienīgais hečbeks savā klasē ar aizmugures piedziņu.", "F40 paaudzē 1. sērija pārgāja uz priekšējo piedziņu."],
      en: ["Until 2019 (F20) the 1 Series was the only rear-wheel-drive hatchback in its class.", "With the F40 generation the 1 Series switched to front-wheel drive."],
      ru: ["До 2019 года (F20) 1-я серия была единственным заднеприводным хэтчбеком в классе.", "В поколении F40 1-я серия перешла на передний привод."],
      lt: ["Iki 2019 m. (F20) 1 serija buvo vienintelis galinių ratų pavaros hečbekas savo klasėje.", "F40 kartoje 1 serija perėjo prie priekinių ratų pavaros."],
    },
  },
  "Audi|A3": {
    gens: [["8L", 1996, 2003, 2000], ["8P", 2003, 2013, 2008], ["8V", 2012, 2020, 2016], ["8Y", 2020, null, 2024]],
    facts: {
      lv: ["8P paaudzē parādījās piecu durvju Sportback versija (2004).", "8V paaudzē A3 pirmo reizi bija pieejams arī kā sedans."],
      en: ["The five-door Sportback arrived with the 8P generation (2004).", "The 8V generation was the first A3 also offered as a saloon."],
      ru: ["Пятидверный Sportback появился в поколении 8P (2004).", "В поколении 8V A3 впервые предложили и в кузове седан."],
      lt: ["8P kartoje atsirado penkių durų Sportback versija (2004).", "8V kartoje A3 pirmą kartą buvo siūlomas ir kaip sedanas."],
    },
  },
  "Opel|Insignia": {
    gens: [["A", 2008, 2017, 2013], ["B", 2017, 2022, 2020]],
    facts: {
      lv: ["Insignia A ieguva titulu „Eiropas gada auto 2009”.", "Otrā paaudze (Grand Sport) ir līdz 175 kg vieglāka par pirmo."],
      en: ["The Insignia A won European Car of the Year 2009.", "The second generation (Grand Sport) is up to 175 kg lighter than the first."],
      ru: ["Insignia A стала «Европейским автомобилем года 2009».", "Второе поколение (Grand Sport) легче первого до 175 кг."],
      lt: ["Insignia A laimėjo „Europos metų automobilio 2009“ titulą.", "Antroji karta (Grand Sport) iki 175 kg lengvesnė už pirmąją."],
    },
  },
  "Škoda|Superb": {
    gens: [["3U", 2001, 2008, 2006], ["3T", 2008, 2015, 2013], ["3V", 2015, 2023, 2019], ["B9", 2024, null]],
    facts: {
      lv: ["Mūsdienu Superb pirmā paaudze (2001) bija veidota uz pagarināta VW Passat B5 bāzes.", "Otrajai paaudzei bija „Twindoor” bagāžnieks, ko var atvērt gan kā sedanam, gan kā hečbekam."],
      en: ["The first modern Superb (2001) was based on a stretched VW Passat B5.", "The second generation had a “Twindoor” boot that opens either like a saloon or a hatchback."],
      ru: ["Первый современный Superb (2001) построен на удлинённой базе VW Passat B5.", "У второго поколения был багажник «Twindoor», открывающийся как у седана или как у хэтчбека."],
      lt: ["Pirmasis šiuolaikinis Superb (2001) sukurtas ant pailginto VW Passat B5 pagrindo.", "Antroji karta turėjo „Twindoor“ bagažinę, atsidarančią ir kaip sedano, ir kaip hečbeko."],
    },
  },
  "BMW|X1": {
    gens: [["E84", 2009, 2015, 2012], ["F48", 2015, 2022, 2019], ["U11", 2022, null]],
    facts: {
      lv: ["E84 bija BMW pirmais kompaktais apvidus auto, ražots Leipcigā.", "Kopš F48 paaudzes X1 pamatā ir priekšējā piedziņa."],
      en: ["The E84 was BMW's first compact SUV, built in Leipzig.", "Since the F48 generation the X1 is front-wheel drive based."],
      ru: ["E84 — первый компактный кроссовер BMW, выпускался в Лейпциге.", "С поколения F48 X1 построен на переднеприводной базе."],
      lt: ["E84 buvo pirmasis BMW kompaktiškas visureigis, gamintas Leipcige.", "Nuo F48 kartos X1 pagrindas – priekinių ratų pavara."],
    },
  },
  "Volvo|V60": {
    gens: [["1. paaudze", 2010, 2018, 2013], ["2. paaudze", 2018, null]],
    facts: {
      lv: ["V60 D6 Plug-in Hybrid (2012) bija pirmais sērijveida dīzeļa plug-in hibrīds pasaulē.", "Otrā paaudze būvēta uz SPA platformas, tāpat kā XC60 un XC90."],
      en: ["The V60 D6 Plug-in Hybrid (2012) was the world's first production diesel plug-in hybrid.", "The second generation uses the SPA platform, like the XC60 and XC90."],
      ru: ["V60 D6 Plug-in Hybrid (2012) — первый в мире серийный дизельный подключаемый гибрид.", "Второе поколение построено на платформе SPA, как XC60 и XC90."],
      lt: ["V60 D6 Plug-in Hybrid (2012) – pirmasis pasaulyje serijinis dyzelinis įkraunamas hibridas.", "Antroji karta sukurta SPA platformoje, kaip ir XC60 bei XC90."],
    },
  },
  "Volvo|V70": {
    gens: [["1. paaudze", 1996, 2000], ["P2", 2000, 2007, 2004], ["P3", 2007, 2016, 2013]],
    facts: {
      lv: ["Pirmā V70 1996. gadā nomainīja leģendāro Volvo 850 universāli.", "Bezceļu versija XC70 sākotnēji saucās V70 XC (Cross Country)."],
      en: ["The first V70 replaced the legendary Volvo 850 estate in 1996.", "The off-road XC70 was originally called the V70 XC (Cross Country)."],
      ru: ["Первый V70 в 1996 году сменил легендарный универсал Volvo 850.", "Внедорожный XC70 изначально назывался V70 XC (Cross Country)."],
      lt: ["Pirmasis V70 1996 m. pakeitė legendinį Volvo 850 universalą.", "Visureigis XC70 iš pradžių vadinosi V70 XC (Cross Country)."],
    },
  },
  "Volkswagen|Touran": {
    gens: [["1T", 2003, 2015, 2010], ["5T", 2015, null]],
    facts: {
      lv: ["Pirmā Touran paaudze tika ražota 12 gadus.", "Ar 7 vietām trešās rindas sēdekļi paslēpjas bagāžnieka grīdā."],
      en: ["The first-generation Touran was built for 12 years.", "In seven-seat form the third-row seats fold into the boot floor."],
      ru: ["Первое поколение Touran выпускалось 12 лет.", "В 7-местной версии сиденья третьего ряда убираются в пол багажника."],
      lt: ["Pirmosios kartos Touran gamintas 12 metų.", "7 vietų versijoje trečios eilės sėdynės paslepiamos bagažinės grindyse."],
    },
  },
  "Kia|Sportage": {
    gens: [["KM", 2004, 2010, 2008], ["SL", 2010, 2015, 2014], ["QL", 2016, 2021, 2018], ["NQ5", 2021, null]],
    facts: {
      lv: ["Sportage ir Kia visvairāk pārdotais modelis pasaulē.", "Eiropas tirgum Sportage ražo Žilinā, Slovākijā."],
      en: ["The Sportage is Kia's best-selling model worldwide.", "Sportage for Europe is built in Žilina, Slovakia."],
      ru: ["Sportage — самая продаваемая модель Kia в мире.", "Для Европы Sportage выпускают в Жилине (Словакия)."],
      lt: ["Sportage – perkamiausias Kia modelis pasaulyje.", "Europos rinkai Sportage gaminamas Žilinoje, Slovakijoje."],
    },
  },
  "Peugeot|3008": {
    gens: [["1. paaudze", 2009, 2016, 2013], ["2. paaudze", 2016, 2023, 2020], ["3. paaudze", 2023, null]],
    facts: {
      lv: ["Otrā paaudze ieguva titulu „Eiropas gada auto 2017”.", "Pirmā paaudze bija krosovers ar minivena iezīmēm un dalītu bagāžnieka vāku."],
      en: ["The second generation won European Car of the Year 2017.", "The first generation was a crossover-MPV with a split tailgate."],
      ru: ["Второе поколение стало «Европейским автомобилем года 2017».", "Первое поколение — кроссовер с чертами минивэна и раздельной дверью багажника."],
      lt: ["Antroji karta laimėjo „Europos metų automobilio 2017“ titulą.", "Pirmoji karta buvo krosoveris su vienatūrio bruožais ir padalintomis bagažinės durimis."],
    },
  },
  "Toyota|Avensis": {
    gens: [["T22", 1997, 2003, 2000], ["T25", 2003, 2009, 2006], ["T27", 2009, 2018, 2015]],
    facts: {
      lv: ["Avensis tika izstrādāts galvenokārt Eiropai un ražots Lielbritānijā.", "Ražošana beidzās 2018. gadā; Eiropā to aizstāja Camry."],
      en: ["The Avensis was developed mainly for Europe and built in the UK.", "Production ended in 2018; in Europe it was replaced by the Camry."],
      ru: ["Avensis разрабатывался в основном для Европы и выпускался в Великобритании.", "Производство завершено в 2018 году; в Европе его сменила Camry."],
      lt: ["Avensis kurtas daugiausia Europai ir gamintas Didžiojoje Britanijoje.", "Gamyba baigta 2018 m.; Europoje jį pakeitė Camry."],
    },
  },
  "Audi|Q7": {
    gens: [["4L", 2005, 2015, 2009], ["4M", 2015, null, 2019]],
    facts: {
      lv: ["Otrā paaudze ir līdz 325 kg vieglāka par pirmo.", "Q7 V12 TDI (2008–2012) ar 500 ZS bija viens no jaudīgākajiem dīzeļa auto pasaulē."],
      en: ["The second generation is up to 325 kg lighter than the first.", "The Q7 V12 TDI (2008–2012), with 500 hp, was one of the most powerful diesel cars in the world."],
      ru: ["Второе поколение легче первого до 325 кг.", "Q7 V12 TDI (2008–2012) мощностью 500 л. с. был одним из самых мощных дизельных автомобилей в мире."],
      lt: ["Antroji karta iki 325 kg lengvesnė už pirmąją.", "Q7 V12 TDI (2008–2012) su 500 AG buvo vienas galingiausių dyzelinių automobilių pasaulyje."],
    },
  },
  "Škoda|Kodiaq": {
    gens: [["1. paaudze", 2016, 2024, 2021], ["2. paaudze", 2024, null]],
    facts: {
      lv: ["Nosaukums cēlies no Kodiaka lāča Aļaskā, ar „q” beigās Škoda stilā.", "Kodiaq bija pirmais lielais Škoda apvidus auto ar iespēju izvēlēties 7 vietas."],
      en: ["The name comes from the Kodiak bear of Alaska, with a Škoda-style “q” at the end.", "The Kodiaq was Škoda's first large SUV with an optional seven seats."],
      ru: ["Название — от аляскинского медведя кодьяка, с «q» на конце в стиле Škoda.", "Kodiaq — первый большой кроссовер Škoda с возможностью 7 мест."],
      lt: ["Pavadinimas kilęs nuo Aliaskos kodjako lokio, su Škoda stiliaus „q“ gale.", "Kodiaq – pirmasis didelis Škoda visureigis su pasirenkamomis 7 vietomis."],
    },
  },
  "Toyota|C-HR": {
    gens: [["1. paaudze", 2016, 2023, 2019], ["2. paaudze", 2023, null]],
    facts: {
      lv: ["Nosaukums nozīmē „Coupé High-Rider”.", "Eiropas C-HR ražo Turcijā, Sakarjā."],
      en: ["The name stands for “Coupé High-Rider”.", "The European C-HR is built in Sakarya, Turkey."],
      ru: ["Название означает «Coupé High-Rider».", "Европейский C-HR выпускают в Сакарье (Турция)."],
      lt: ["Pavadinimas reiškia „Coupé High-Rider“.", "Europinis C-HR gaminamas Sakarijoje, Turkijoje."],
    },
  },
  "BMW|7. sērija": {
    gens: [["E38", 1994, 2001, 1998], ["E65/E66", 2001, 2008, 2005], ["F01/F02", 2008, 2015, 2012], ["G11/G12", 2015, 2022, 2019], ["G70", 2022, null]],
    facts: {
      lv: ["E65 paaudzē debitēja BMW iDrive vadības sistēma (2001).", "G11 bija pirmais BMW ar oglekļa šķiedras elementiem virsbūves karkasā (Carbon Core)."],
      en: ["The E65 debuted BMW's iDrive control system (2001).", "The G11 was the first BMW with carbon fibre in its body structure (Carbon Core)."],
      ru: ["В E65 дебютировала система управления BMW iDrive (2001).", "G11 — первый BMW с углепластиком в силовой структуре кузова (Carbon Core)."],
      lt: ["E65 kartoje debiutavo BMW iDrive valdymo sistema (2001).", "G11 – pirmasis BMW su anglies pluošto elementais kėbulo karkase (Carbon Core)."],
    },
  },
  "Ford|Focus": {
    gens: [["Mk1", 1998, 2004, 2001], ["Mk2", 2004, 2011, 2008], ["Mk3", 2010, 2018, 2014], ["Mk4", 2018, 2025, 2022]],
    facts: {
      lv: ["Pirmā Focus ieguva titulu „Eiropas gada auto 1999”.", "Focus ražošana Eiropā (Zārlujē, Vācijā) beidzās 2025. gadā."],
      en: ["The first Focus won European Car of the Year 1999.", "Focus production in Europe (Saarlouis, Germany) ended in 2025."],
      ru: ["Первый Focus стал «Европейским автомобилем года 1999».", "Производство Focus в Европе (Саарлуис, Германия) завершилось в 2025 году."],
      lt: ["Pirmasis Focus laimėjo „Europos metų automobilio 1999“ titulą.", "Focus gamyba Europoje (Saarlouis, Vokietija) baigėsi 2025 m."],
    },
  },
  "Volkswagen|Transporter": {
    gens: [["T4", 1990, 2003], ["T5", 2003, 2015, 2009], ["T6", 2015, 2024, 2019], ["T7", 2024, null]],
    facts: {
      lv: ["Transporter ražo kopš 1950. gada – tas ir viens no ilgāk ražotajiem auto nosaukumiem.", "Jaunais T7 Transporter (2024) izstrādāts kopā ar Ford uz Transit Custom bāzes."],
      en: ["The Transporter has been built since 1950, one of the longest-running vehicle names.", "The new T7 Transporter (2024) was developed with Ford on the Transit Custom base."],
      ru: ["Transporter выпускается с 1950 года — одно из самых долгоживущих названий.", "Новый T7 Transporter (2024) создан вместе с Ford на базе Transit Custom."],
      lt: ["Transporter gaminamas nuo 1950 m. – vienas ilgiausiai gaminamų automobilių pavadinimų.", "Naujasis T7 Transporter (2024) sukurtas kartu su Ford Transit Custom pagrindu."],
    },
  },
  "Toyota|Corolla": {
    gens: [["E120", 2000, 2007, 2004], ["E150", 2006, 2013, 2010], ["E170", 2013, 2019, 2016], ["E210", 2018, null, 2022]],
    facts: {
      lv: ["Corolla ir visvairāk pārdotais auto modelis vēsturē – vairāk nekā 50 miljoni kopš 1966. gada.", "Eiropā 2007.–2018. gadā hečbeks saucās Auris, bet sedans palika Corolla."],
      en: ["The Corolla is the best-selling car in history, with more than 50 million since 1966.", "In Europe the hatchback was called Auris in 2007–2018, while the saloon stayed Corolla."],
      ru: ["Corolla — самый продаваемый автомобиль в истории: более 50 миллионов с 1966 года.", "В Европе в 2007–2018 годах хэтчбек назывался Auris, а седан остался Corolla."],
      lt: ["Corolla – perkamiausias automobilis istorijoje, daugiau nei 50 milijonų nuo 1966 m.", "Europoje 2007–2018 m. hečbekas vadinosi Auris, o sedanas liko Corolla."],
    },
  },
  "Toyota|Yaris": {
    gens: [["XP10", 1999, 2005, 2003], ["XP90", 2005, 2011, 2009], ["XP130", 2011, 2020, 2014], ["XP210", 2020, null, 2024]],
    facts: {
      lv: ["Yaris divreiz ieguvis titulu „Eiropas gada auto” – 2000. un 2021. gadā.", "Eiropas Yaris ražo Valansjēnā, Francijā."],
      en: ["The Yaris has twice won European Car of the Year, in 2000 and 2021.", "The European Yaris is built in Valenciennes, France."],
      ru: ["Yaris дважды становился «Европейским автомобилем года» — в 2000 и 2021 годах.", "Европейский Yaris выпускают в Валансьене (Франция)."],
      lt: ["Yaris du kartus laimėjo „Europos metų automobilio“ titulą – 2000 ir 2021 m.", "Europinis Yaris gaminamas Valansjene, Prancūzijoje."],
    },
  },
  "Mercedes-Benz|Sprinter": {
    gens: [["T1N", 1995, 2006, 2000], ["W906", 2006, 2018, 2013], ["W907/W910", 2018, null]],
    facts: {
      lv: ["Sprinter 1995. gadā nomainīja Mercedes T1 furgonu.", "No 2006. līdz 2016. gadam uz Sprinter bāzes ražoja arī Volkswagen Crafter."],
      en: ["The Sprinter replaced the Mercedes T1 van in 1995.", "From 2006 to 2016 the Volkswagen Crafter was also built on the Sprinter base."],
      ru: ["Sprinter в 1995 году сменил фургон Mercedes T1.", "С 2006 по 2016 год на базе Sprinter выпускался и Volkswagen Crafter."],
      lt: ["Sprinter 1995 m. pakeitė Mercedes T1 furgoną.", "2006–2016 m. Sprinter pagrindu gamintas ir Volkswagen Crafter."],
    },
  },
  "Volkswagen|Touareg": {
    gens: [["7L", 2002, 2010, 2007], ["7P", 2010, 2018, 2014], ["CR", 2018, null, 2023]],
    facts: {
      lv: ["Pirmā Touareg dalīja platformu ar Porsche Cayenne un Audi Q7.", "2006. gada reklāmas akcijā Touareg V10 TDI aizvilka 155 tonnas smagu Boeing 747."],
      en: ["The first Touareg shared its platform with the Porsche Cayenne and Audi Q7.", "In a 2006 promotion a Touareg V10 TDI towed a 155-tonne Boeing 747."],
      ru: ["Первый Touareg делил платформу с Porsche Cayenne и Audi Q7.", "В рекламной акции 2006 года Touareg V10 TDI отбуксировал 155-тонный Boeing 747."],
      lt: ["Pirmasis Touareg dalijosi platforma su Porsche Cayenne ir Audi Q7.", "2006 m. reklaminėje akcijoje Touareg V10 TDI nutempė 155 tonų Boeing 747."],
    },
  },
  "Opel|Zafira": {
    gens: [["A", 1999, 2005, 2003], ["B", 2005, 2014, 2008], ["C (Tourer)", 2011, 2019, 2016]],
    facts: {
      lv: ["Pirmā Zafira ieviesa Flex7 sēdekļus – trešās rindas sēdekļi pilnībā paslēpjas grīdā.", "Zafira Tourer bija pieejama arī ar rūpnīcas CNG (gāzes) versiju."],
      en: ["The first Zafira introduced Flex7 seating, with the third row folding fully into the floor.", "The Zafira Tourer was also offered with a factory CNG (natural gas) version."],
      ru: ["Первая Zafira принесла систему Flex7 — сиденья третьего ряда полностью убираются в пол.", "Zafira Tourer предлагалась и в заводской версии на метане (CNG)."],
      lt: ["Pirmoji Zafira įvedė Flex7 sėdynes – trečios eilės sėdynės visiškai paslepiamos grindyse.", "Zafira Tourer siūlyta ir su gamykline CNG (dujų) versija."],
    },
  },
  "Volkswagen|Caddy": {
    gens: [["Mk2", 1995, 2004], ["Mk3 (2K)", 2003, 2015, 2010], ["Mk4", 2015, 2020], ["Mk5", 2020, null]],
    facts: {
      lv: ["Caddy Mk4 (2015) patiesībā bija dziļi modernizēts trešās paaudzes Caddy.", "Piektā paaudze (2020) pārgāja uz MQB platformu, tāpat kā Golf 8."],
      en: ["The Caddy Mk4 (2015) was really a heavily updated third-generation Caddy.", "The fifth generation (2020) moved to the MQB platform, like the Golf 8."],
      ru: ["Caddy Mk4 (2015) — по сути глубоко обновлённый Caddy третьего поколения.", "Пятое поколение (2020) перешло на платформу MQB, как Golf 8."],
      lt: ["Caddy Mk4 (2015) iš esmės buvo smarkiai atnaujintas trečiosios kartos Caddy.", "Penktoji karta (2020) perėjo prie MQB platformos, kaip ir Golf 8."],
    },
  },
  "Honda|CR-V": {
    gens: [["2. paaudze", 2001, 2006, 2004], ["3. paaudze", 2006, 2012, 2009], ["4. paaudze", 2012, 2018, 2015], ["5. paaudze", 2018, 2023], ["6. paaudze", 2023, null]],
    facts: {
      lv: ["Honda nosaukumu skaidro kā „Comfortable Runabout Vehicle”.", "Kopš 5. paaudzes Eiropā CR-V vairs nav ar dīzeli – tā vietā hibrīds."],
      en: ["Honda explains the name as “Comfortable Runabout Vehicle”.", "Since the 5th generation the European CR-V has no diesel – a hybrid instead."],
      ru: ["Honda расшифровывает название как «Comfortable Runabout Vehicle».", "С 5-го поколения в Европе CR-V без дизеля — вместо него гибрид."],
      lt: ["Honda pavadinimą aiškina kaip „Comfortable Runabout Vehicle“.", "Nuo 5-osios kartos Europoje CR-V nebeturi dyzelio – vietoj jo hibridas."],
    },
  },
  "Toyota|Auris": {
    gens: [["E150", 2006, 2012, 2010], ["E180", 2012, 2018, 2015]],
    facts: {
      lv: ["Auris bija Corolla hečbeka nosaukums Eiropā; 2019. gadā atgriezās vārds Corolla.", "Auris Hybrid (2010) bija pirmais Eiropā masveidā ražotais pilnhibrīds (Lielbritānijā)."],
      en: ["Auris was the European name of the Corolla hatchback; in 2019 the Corolla name returned.", "The Auris Hybrid (2010) was the first full hybrid mass-produced in Europe (in the UK)."],
      ru: ["Auris — европейское название хэтчбека Corolla; в 2019 году вернулось имя Corolla.", "Auris Hybrid (2010) — первый полный гибрид массового производства в Европе (Великобритания)."],
      lt: ["Auris buvo Corolla hečbeko pavadinimas Europoje; 2019 m. grįžo Corolla vardas.", "Auris Hybrid (2010) – pirmasis masiškai Europoje gamintas pilnasis hibridas (JK)."],
    },
  },
  "Peugeot|308": {
    gens: [["T7", 2007, 2013, 2011], ["T9", 2013, 2021, 2017], ["P5", 2021, null]],
    facts: {
      lv: ["Otrā paaudze (T9) ieguva titulu „Eiropas gada auto 2014”.", "Trešā paaudze bija pirmais modelis ar jauno 2021. gada Peugeot logotipu."],
      en: ["The second generation (T9) won European Car of the Year 2014.", "The third generation was the first model with Peugeot's new 2021 logo."],
      ru: ["Второе поколение (T9) стало «Европейским автомобилем года 2014».", "Третье поколение — первая модель с новым логотипом Peugeot 2021 года."],
      lt: ["Antroji karta (T9) laimėjo „Europos metų automobilio 2014“ titulą.", "Trečioji karta – pirmasis modelis su naujuoju 2021 m. Peugeot logotipu."],
    },
  },
  "Lexus|RX": {
    gens: [["XU30", 2003, 2008], ["AL10", 2008, 2015, 2012], ["AL20", 2015, 2022, 2019], ["5. paaudze", 2022, null]],
    facts: {
      lv: ["RX 400h (2005) bija pirmais luksusa klases hibrīda apvidus auto.", "Pirmo RX (1998) uzskata par vienu no pirmajiem luksusa krosoveriem."],
      en: ["The RX 400h (2005) was the first luxury hybrid SUV.", "The first RX (1998) is considered one of the first luxury crossovers."],
      ru: ["RX 400h (2005) — первый люксовый гибридный кроссовер.", "Первый RX (1998) считается одним из первых люксовых кроссоверов."],
      lt: ["RX 400h (2005) buvo pirmasis prabangus hibridinis visureigis.", "Pirmasis RX (1998) laikomas vienu pirmųjų prabangių krosoverių."],
    },
  },
  "Porsche|Cayenne": {
    gens: [["9PA (E1)", 2002, 2010, 2007], ["92A (E2)", 2010, 2017, 2014], ["9Y0 (E3)", 2017, null, 2023]],
    facts: {
      lv: ["Pirmā Cayenne dalīja platformu ar VW Touareg.", "Cayenne Coupé versija parādījās 2019. gadā."],
      en: ["The first Cayenne shared its platform with the VW Touareg.", "The Cayenne Coupé arrived in 2019."],
      ru: ["Первый Cayenne делил платформу с VW Touareg.", "Версия Cayenne Coupé появилась в 2019 году."],
      lt: ["Pirmasis Cayenne dalijosi platforma su VW Touareg.", "Cayenne Coupé versija pasirodė 2019 m."],
    },
  },
  "Ford|Transit": {
    gens: [["Mk6", 2000, 2006], ["Mk7", 2006, 2013], ["Mk8", 2013, null, 2019]],
    facts: {
      lv: ["Pirmais Ford Transit tika ražots 1965. gadā.", "Transit ir viens no Eiropā visvairāk pārdotajiem furgoniem."],
      en: ["The first Ford Transit was built in 1965.", "The Transit is one of Europe's best-selling vans."],
      ru: ["Первый Ford Transit выпущен в 1965 году.", "Transit — один из самых продаваемых фургонов в Европе."],
      lt: ["Pirmasis Ford Transit pagamintas 1965 m.", "Transit – vienas perkamiausių furgonų Europoje."],
    },
  },
  "Jeep|Grand Cherokee": {
    gens: [["WJ", 1999, 2004], ["WK", 2004, 2010], ["WK2", 2010, 2021, 2013], ["WL", 2021, null]],
    facts: {
      lv: ["WK2 paaudzei ir kopīga platforma ar Mercedes-Benz M klasi (W166).", "Trackhawk versijai (2017) bija 707 ZS kompresora V8."],
      en: ["The WK2 shares its platform with the Mercedes-Benz M-Class (W166).", "The Trackhawk version (2017) had a 707 hp supercharged V8."],
      ru: ["WK2 делит платформу с Mercedes-Benz M-класса (W166).", "У версии Trackhawk (2017) был V8 с компрессором на 707 л. с."],
      lt: ["WK2 dalijasi platforma su Mercedes-Benz M klase (W166).", "Trackhawk versija (2017) turėjo 707 AG kompresorinį V8."],
    },
  },
  "Mercedes-Benz|S klase": {
    gens: [["W140", 1991, 1998, 1994], ["W220", 1998, 2005, 2002], ["W221", 2005, 2013, 2009], ["W222", 2013, 2020, 2017], ["W223", 2020, null]],
    facts: {
      lv: ["S klase W116 (1978) bija pirmais sērijveida auto ar elektronisko ABS.", "W222 bija pirmais auto, kurā nav nevienas kvēlspuldzes – visas gaismas ir LED."],
      en: ["The W116 S-Class (1978) was the first production car with electronic ABS.", "The W222 was the first car with no light bulbs at all – every light is LED."],
      ru: ["S-класс W116 (1978) — первый серийный автомобиль с электронной ABS.", "W222 — первый автомобиль без единой лампы накаливания: все огни светодиодные."],
      lt: ["S klasė W116 (1978) – pirmasis serijinis automobilis su elektronine ABS.", "W222 – pirmasis automobilis be jokių kaitrinių lempučių: visos šviesos LED."],
    },
  },
  "Hyundai|Tucson": {
    gens: [["JM", 2004, 2009], ["LM (ix35)", 2009, 2015], ["TL", 2015, 2020, 2018], ["NX4", 2020, null, 2024]],
    facts: {
      lv: ["2009.–2015. gadā Eiropā šis modelis saucās ix35.", "Eiropas Tucson ražo Nošovicē, Čehijā."],
      en: ["In 2009–2015 this model was sold in Europe as the ix35.", "The European Tucson is built in Nošovice, Czech Republic."],
      ru: ["В 2009–2015 годах в Европе модель называлась ix35.", "Европейский Tucson выпускают в Ношовице (Чехия)."],
      lt: ["2009–2015 m. Europoje šis modelis vadinosi ix35.", "Europinis Tucson gaminamas Nošovicėje, Čekijoje."],
    },
  },
  "Volvo|XC70": {
    gens: [["V70 XC", 1997, 2000], ["P2", 2000, 2007, 2004], ["P3", 2007, 2016, 2013]],
    facts: {
      lv: ["XC70 ir paaugstināts V70 universālis ar pilnpiedziņu.", "Ražošana beidzās 2016. gadā; pēctecis ir V90 Cross Country."],
      en: ["The XC70 is a raised, all-wheel-drive version of the V70 estate.", "Production ended in 2016; its successor is the V90 Cross Country."],
      ru: ["XC70 — приподнятый полноприводный вариант универсала V70.", "Производство завершено в 2016 году; преемник — V90 Cross Country."],
      lt: ["XC70 – paaukštinta visų ratų pavaros V70 universalo versija.", "Gamyba baigta 2016 m.; įpėdinis – V90 Cross Country."],
    },
  },
  "Volvo|S60": {
    gens: [["1. paaudze", 2000, 2009, 2004], ["2. paaudze", 2010, 2018, 2013], ["3. paaudze", 2018, 2024]],
    facts: {
      lv: ["S60 R (2003) bija ar 300 ZS un pilnpiedziņu.", "Trešā paaudze bija pirmais Volvo, kas ražots ASV (Dienvidkarolīnā)."],
      en: ["The S60 R (2003) had 300 hp and all-wheel drive.", "The third generation was the first Volvo built in the USA (South Carolina)."],
      ru: ["S60 R (2003) имел 300 л. с. и полный привод.", "Третье поколение — первый Volvo, выпускавшийся в США (Южная Каролина)."],
      lt: ["S60 R (2003) turėjo 300 AG ir visų ratų pavarą.", "Trečioji karta – pirmasis Volvo, gamintas JAV (Pietų Karolinoje)."],
    },
  },
  "Nissan|X-Trail": {
    gens: [["T30", 2001, 2007, 2003], ["T31", 2007, 2013, 2010], ["T32", 2013, 2022, 2017], ["T33", 2022, null]],
    facts: {
      lv: ["Trešā paaudze (T32) dalīja platformu ar Qashqai un bija pieejama ar 7 vietām.", "Ceturtajai paaudzei Eiropā ir e-Power hibrīds: benzīna dzinējs tikai ražo strāvu, riteņus griež elektromotors."],
      en: ["The third generation (T32) shared its platform with the Qashqai and was offered with seven seats.", "The fourth generation offers the e-Power hybrid in Europe: the petrol engine only generates electricity and an electric motor drives the wheels."],
      ru: ["Третье поколение (T32) делило платформу с Qashqai и предлагалось с 7 местами.", "У четвёртого поколения в Европе есть гибрид e-Power: бензиновый мотор только вырабатывает ток, колёса крутит электромотор."],
      lt: ["Trečioji karta (T32) dalijosi platforma su Qashqai ir buvo siūloma su 7 vietomis.", "Ketvirtoji karta Europoje turi e-Power hibridą: benzininis variklis tik gamina elektrą, ratus suka elektros variklis."],
    },
  },
  "BMW|X6": {
    gens: [["E71", 2008, 2014, 2012], ["F16", 2014, 2019], ["G06", 2019, null, 2023]],
    facts: {
      lv: ["X6 (2008) aizsāka „apvidus kupejas” klasi; BMW to sauc par SAC (Sports Activity Coupé).", "ActiveHybrid X6 (2009) bija BMW pirmais pilnhibrīds."],
      en: ["The X6 (2008) started the “SUV coupé” class; BMW calls it an SAC (Sports Activity Coupé).", "The ActiveHybrid X6 (2009) was BMW's first full hybrid."],
      ru: ["X6 (2008) открыл класс «купе-кроссоверов»; BMW называет его SAC (Sports Activity Coupé).", "ActiveHybrid X6 (2009) — первый полный гибрид BMW."],
      lt: ["X6 (2008) pradėjo „visureigio kupė“ klasę; BMW jį vadina SAC (Sports Activity Coupé).", "ActiveHybrid X6 (2009) – pirmasis BMW pilnasis hibridas."],
    },
  },
  "Ford|S-Max": {
    gens: [["1. paaudze", 2006, 2015, 2010], ["2. paaudze", 2015, 2023, 2019]],
    facts: {
      lv: ["Pirmā S-Max ieguva titulu „Eiropas gada auto 2007”.", "S-Max ražošana beidzās 2023. gadā."],
      en: ["The first S-Max won European Car of the Year 2007.", "S-Max production ended in 2023."],
      ru: ["Первый S-Max стал «Европейским автомобилем года 2007».", "Производство S-Max завершилось в 2023 году."],
      lt: ["Pirmasis S-Max laimėjo „Europos metų automobilio 2007“ titulą.", "S-Max gamyba baigėsi 2023 m."],
    },
  },
  "Ford|Kuga": {
    gens: [["1. paaudze", 2008, 2012], ["2. paaudze", 2012, 2019, 2016], ["3. paaudze", 2019, null, 2024]],
    facts: {
      lv: ["ASV otrā un trešā paaudze tiek pārdota kā Ford Escape.", "Trešajai paaudzei ir arī plug-in hibrīda versija."],
      en: ["In the USA the second and third generations are sold as the Ford Escape.", "The third generation is also offered as a plug-in hybrid."],
      ru: ["В США второе и третье поколения продаются как Ford Escape.", "У третьего поколения есть и подключаемый гибрид."],
      lt: ["JAV antroji ir trečioji kartos parduodamos kaip Ford Escape.", "Trečioji karta siūloma ir kaip įkraunamas hibridas."],
    },
  },
  "Subaru|Outback": {
    gens: [["BH", 1998, 2003], ["BP", 2003, 2009, 2006], ["BR", 2009, 2014, 2012], ["BS", 2014, 2019, 2017], ["BT", 2019, null]],
    facts: {
      lv: ["Visām paaudzēm ir pastāvīgā pilnpiedziņa un oponētais (boxer) dzinējs.", "Outback sākotnēji (1994) bija paaugstināta Legacy universāļa versija."],
      en: ["Every generation has permanent all-wheel drive and a horizontally opposed (boxer) engine.", "The Outback started out (1994) as a raised version of the Legacy estate."],
      ru: ["У всех поколений постоянный полный привод и оппозитный (boxer) двигатель.", "Изначально (1994) Outback был приподнятой версией универсала Legacy."],
      lt: ["Visos kartos turi nuolatinę visų ratų pavarą ir priešpriešinį (boxer) variklį.", "Iš pradžių (1994) Outback buvo paaukštinta Legacy universalo versija."],
    },
  },
  "Peugeot|5008": {
    gens: [["1. paaudze", 2009, 2017, 2013], ["2. paaudze", 2017, 2024, 2020], ["3. paaudze", 2024, null]],
    facts: {
      lv: ["Pirmā 5008 bija minivens, otrā – 7 vietu apvidus auto.", "Otrā paaudze būtībā ir pagarināts Peugeot 3008."],
      en: ["The first 5008 was an MPV, the second a seven-seat SUV.", "The second generation is essentially a stretched Peugeot 3008."],
      ru: ["Первый 5008 был минивэном, второй — 7-местным кроссовером.", "Второе поколение — по сути удлинённый Peugeot 3008."],
      lt: ["Pirmasis 5008 buvo vienatūris, antrasis – 7 vietų visureigis.", "Antroji karta iš esmės yra pailgintas Peugeot 3008."],
    },
  },
  "Renault|Trafic": {
    gens: [["X83", 2001, 2014, 2006], ["X82", 2014, null, 2021]],
    facts: {
      lv: ["Trafic dvīņi: Opel Vivaro, Nissan Primastar/NV300 un (X82) Fiat Talento.", "Pirmais Renault Trafic parādījās 1980. gadā."],
      en: ["Trafic twins include the Opel Vivaro, Nissan Primastar/NV300 and (X82) Fiat Talento.", "The first Renault Trafic appeared in 1980."],
      ru: ["Близнецы Trafic: Opel Vivaro, Nissan Primastar/NV300 и (X82) Fiat Talento.", "Первый Renault Trafic появился в 1980 году."],
      lt: ["Trafic dvyniai: Opel Vivaro, Nissan Primastar/NV300 ir (X82) Fiat Talento.", "Pirmasis Renault Trafic pasirodė 1980 m."],
    },
  },
  "Mazda|CX-5": {
    gens: [["KE", 2012, 2017, 2015], ["KF", 2017, 2025, 2021], ["3. paaudze", 2025, null]],
    facts: {
      lv: ["CX-5 bija pirmā Mazda ar pilnu SKYACTIV tehnoloģiju un „Kodo” dizainu.", "CX-5 ir Mazda visvairāk pārdotais modelis pasaulē."],
      en: ["The CX-5 was the first Mazda with full SKYACTIV technology and “Kodo” design.", "The CX-5 is Mazda's best-selling model worldwide."],
      ru: ["CX-5 — первая Mazda с полной технологией SKYACTIV и дизайном «Kodo».", "CX-5 — самая продаваемая модель Mazda в мире."],
      lt: ["CX-5 – pirmoji Mazda su visa SKYACTIV technologija ir „Kodo“ dizainu.", "CX-5 – perkamiausias Mazda modelis pasaulyje."],
    },
  },
};

export const modelInfo = (make: string | null | undefined, model: string | null | undefined): ModelInfo | null =>
  make && model ? MODEL_INFO[`${make}|${model}`] ?? null : null;

/** Paaudze(-s) pēc izlaiduma gada; pārklājuma gados var būt divas. */
export function gensForYear(info: ModelInfo, year: number): Gen[] {
  return info.gens.filter(([, from, to]) => year >= from && year <= (to ?? 9999));
}
