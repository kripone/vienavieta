// Komplektāciju īsi apraksti 4 valodās (kas parasti ietilpst). Aprīkojums atšķiras pa modeļiem un gadiem,
// tāpēc teksts vispārīgs ("parasti", "bieži"). Rāda modeļa SEO lapā un sludinājumā (src/components/model-info.tsx).
import type { Locale } from "@/i18n/core";

type D = Record<Locale, string>;
const d = (lv: string, en: string, ru: string, lt: string): D => ({ lv, en, ru, lt });

export const TRIM_INFO: Record<string, Record<string, D>> = {
  BMW: {
    "M Sport": d("M bamperi un sliekšņi, M stūre, sporta sēdekļi, parasti stingrāka M sporta piekare.", "M bumpers and side skirts, M steering wheel, sports seats, usually firmer M Sport suspension.", "Бамперы и пороги M, руль M, спортивные сиденья, обычно более жёсткая подвеска M Sport.", "M buferiai ir slenksčiai, M vairas, sportinės sėdynės, paprastai standesnė M Sport pakaba."),
    "Luxury Line": d("Hroma apdare, ādas salons un koka apdare – komfortam.", "Chrome trim, leather and wood interior – comfort-focused.", "Хромированная отделка, кожа и дерево в салоне — ставка на комфорт.", "Chromo apdaila, odinis salonas ir medžio apdaila – komfortui."),
    "Sport Line": d("Melni akcenti, sporta sēdekļi un stūre, bez M bamperiem.", "Black accents, sports seats and steering wheel, without the M bumpers.", "Чёрные акценты, спортивные сиденья и руль, без бамперов M.", "Juodi akcentai, sportinės sėdynės ir vairas, be M buferių."),
    "Modern Line": d("Gaiša, moderna salona apdare un sudraba akcenti.", "Light, modern interior trim and silver accents.", "Светлая современная отделка салона и серебристые акценты.", "Šviesi, moderni salono apdaila ir sidabriniai akcentai."),
    xLine: d("X modeļiem: matēta sudraba apdare un apvidus stila akcenti.", "For X models: matt silver trim and off-road styling accents.", "Для моделей X: матовая серебристая отделка и внедорожные акценты.", "X modeliams: matinė sidabrinė apdaila ir visureigio akcentai."),
  },
  "Mercedes-Benz": {
    "AMG Line": d("AMG stila bamperi un diski, sporta stūre un sēdekļi, bieži sportiska piekare – AMG izskats ar parasto dzinēju.", "AMG-style bumpers and wheels, sports steering wheel and seats, often sports suspension – the AMG look with a regular engine.", "Бамперы и диски в стиле AMG, спортивные руль и сиденья, часто спортивная подвеска — вид AMG с обычным мотором.", "AMG stiliaus buferiai ir ratlankiai, sportinis vairas ir sėdynės, dažnai sportinė pakaba – AMG išvaizda su įprastu varikliu."),
    Avantgarde: d("Sportiskāka līnija: zvaigzne radiatora restē, dinamiskāka apdare.", "A sportier line: star in the grille and more dynamic trim.", "Более спортивная линия: звезда в решётке радиатора и динамичная отделка.", "Sportiškesnė linija: žvaigždė grotelėse ir dinamiškesnė apdaila."),
    Elegance: d("Klasiskā līnija: zvaigzne uz motora pārsega, hroma apdare, komforta piekare.", "The classic line: bonnet star, chrome trim and comfort suspension.", "Классическая линия: звезда на капоте, хром, комфортная подвеска.", "Klasikinė linija: žvaigždė ant variklio dangčio, chromas, komfortiška pakaba."),
    Exclusive: d("Luksusa līnija: klasiskā reste, zvaigzne uz pārsega, koka un ādas apdare.", "The luxury line: classic grille, bonnet star, wood and leather trim.", "Люксовая линия: классическая решётка, звезда на капоте, дерево и кожа.", "Prabangi linija: klasikinės grotelės, žvaigždė ant dangčio, medis ir oda."),
  },
  Audi: {
    "S line": d("Sportiskā pakete: S line bamperi un diski, sporta sēdekļi, bieži sporta piekare.", "The sports package: S line bumpers and wheels, sports seats, often sports suspension.", "Спортивный пакет: бамперы и диски S line, спортивные сиденья, часто спортивная подвеска.", "Sportinis paketas: S line buferiai ir ratlankiai, sportinės sėdynės, dažnai sportinė pakaba."),
  },
  Volkswagen: {
    "R-Line": d("Sportiskā pakete: R-Line bamperi, diski, sporta sēdekļi un stūre.", "The sports package: R-Line bumpers, wheels, sports seats and steering wheel.", "Спортивный пакет: бамперы R-Line, диски, спортивные сиденья и руль.", "Sportinis paketas: R-Line buferiai, ratlankiai, sportinės sėdynės ir vairas."),
    Highline: d("Augstākā standarta komplektācija ar vairāk komforta aprīkojuma.", "The top standard trim with more comfort equipment.", "Верхняя стандартная комплектация с большим количеством опций комфорта.", "Aukščiausia standartinė komplektacija su daugiau komforto įrangos."),
    Comfortline: d("Vidējā komplektācija ar labu pamata komfortu.", "The mid-level trim with good basic comfort.", "Средняя комплектация с хорошим базовым комфортом.", "Vidutinė komplektacija su geru baziniu komfortu."),
    Trendline: d("Bāzes komplektācija.", "The base trim.", "Базовая комплектация.", "Bazinė komplektacija."),
  },
  Škoda: {
    "Laurin & Klement": d("Augstākā Škoda komplektācija ar ādas salonu un bagātāko aprīkojumu.", "Škoda's top trim with a leather interior and the richest equipment.", "Топовая комплектация Škoda с кожаным салоном и самым богатым оснащением.", "Aukščiausia Škoda komplektacija su odiniu salonu ir turtingiausia įranga."),
    Sportline: d("Sportisks izskats: melni akcenti, sporta sēdekļi un diski.", "Sporty look: black accents, sports seats and wheels.", "Спортивный вид: чёрные акценты, спортивные сиденья и диски.", "Sportiška išvaizda: juodi akcentai, sportinės sėdynės ir ratlankiai."),
    Scout: d("Apvidus stila versija ar aizsargapdari un parasti pilnpiedziņu.", "An off-road styled version with protective trim and usually all-wheel drive.", "Версия во внедорожном стиле с защитной отделкой и обычно полным приводом.", "Visureigio stiliaus versija su apsaugine apdaila ir paprastai visų ratų pavara."),
    RS: d("Sportiskākā versija ar jaudīgāko dzinēju un sporta piekari.", "The sportiest version with the most powerful engine and sports suspension.", "Самая спортивная версия с мощным мотором и спортивной подвеской.", "Sportiškiausia versija su galingiausiu varikliu ir sportine pakaba."),
    Ambition: d("Vidējā komplektācija.", "The mid-level trim.", "Средняя комплектация.", "Vidutinė komplektacija."),
  },
  Kia: {
    "GT Line": d("Sportisks izskats: GT Line bamperi, diski un sporta stūre.", "Sporty look: GT Line bumpers, wheels and sports steering wheel.", "Спортивный вид: бамперы GT Line, диски и спортивный руль.", "Sportiška išvaizda: GT Line buferiai, ratlankiai ir sportinis vairas."),
    "GT Line S": d("GT Line ar bagātāko aprīkojumu (bieži panorāmas jumts, ventilējami sēdekļi, premium audio).", "GT Line with the richest equipment (often panoramic roof, ventilated seats, premium audio).", "GT Line с самым богатым оснащением (часто панорамная крыша, вентиляция сидений, премиум-аудио).", "GT Line su turtingiausia įranga (dažnai panoraminis stogas, vėdinamos sėdynės, premium garsas)."),
  },
  Volvo: {
    "R-Design": d("Sportiskā līnija: R-Design bamperi, sporta sēdekļi un piekare.", "The sporty line: R-Design bumpers, sports seats and suspension.", "Спортивная линия: бамперы R-Design, спортивные сиденья и подвеска.", "Sportinė linija: R-Design buferiai, sportinės sėdynės ir pakaba."),
    Inscription: d("Luksusa līnija: hroms, koka apdare un ādas salons.", "The luxury line: chrome, wood trim and leather.", "Люксовая линия: хром, дерево и кожа.", "Prabangi linija: chromas, medžio apdaila ir oda."),
    Momentum: d("Standarta līnija ar labu aprīkojumu.", "The standard line with good equipment.", "Стандартная линия с хорошим оснащением.", "Standartinė linija su gera įranga."),
    Summum: d("Augstākā komplektācija vecākiem modeļiem.", "The top trim on older models.", "Верхняя комплектация у старых моделей.", "Aukščiausia komplektacija senesniuose modeliuose."),
    Kinetic: d("Bāzes komplektācija vecākiem modeļiem.", "The base trim on older models.", "Базовая комплектация у старых моделей.", "Bazinė komplektacija senesniuose modeliuose."),
  },
  Toyota: {
    "GR Sport": d("Sportisks GR izskats, dažkārt arī piekares uzlabojumi.", "Sporty GR styling, sometimes with suspension upgrades.", "Спортивный стиль GR, иногда с доработкой подвески.", "Sportiška GR išvaizda, kartais ir pakabos patobulinimai."),
    Executive: d("Augstākā komplektācija ar ādu un premium aprīkojumu.", "The top trim with leather and premium equipment.", "Топовая комплектация с кожей и премиум-оснащением.", "Aukščiausia komplektacija su oda ir premium įranga."),
    Prestige: d("Augsta komplektācija.", "A high trim level.", "Высокая комплектация.", "Aukšta komplektacija."),
    Luna: d("Vidējā komplektācija vecākiem modeļiem.", "The mid-level trim on older models.", "Средняя комплектация у старых моделей.", "Vidutinė komplektacija senesniuose modeliuose."),
    Sol: d("Augstākā komplektācija vecākiem modeļiem.", "The top trim on older models.", "Верхняя комплектация у старых моделей.", "Aukščiausia komplektacija senesniuose modeliuose."),
  },
  Ford: {
    "ST-Line": d("Sportisks izskats un sportiskāka piekare.", "Sporty styling and firmer suspension.", "Спортивный вид и более жёсткая подвеска.", "Sportiška išvaizda ir standesnė pakaba."),
    Titanium: d("Augsta, komfortam orientēta komplektācija.", "A high, comfort-oriented trim.", "Высокая комплектация с упором на комфорт.", "Aukšta, komfortui skirta komplektacija."),
    Vignale: d("Luksusa līnija ar ādu un premium apdari.", "The luxury line with leather and premium finishes.", "Люксовая линия с кожей и премиальной отделкой.", "Prabangi linija su oda ir premium apdaila."),
    Ghia: d("Augstākā komplektācija vecākiem modeļiem.", "The top trim on older models.", "Верхняя комплектация у старых моделей.", "Aukščiausia komplektacija senesniuose modeliuose."),
  },
  Peugeot: {
    "GT Line": d("Sportisks izskats un salons ar parasto dzinēju.", "Sporty look and interior with a regular engine.", "Спортивный внешний вид и салон с обычным мотором.", "Sportiška išvaizda ir salonas su įprastu varikliu."),
    Allure: d("Augsta komforta komplektācija.", "A well-equipped comfort trim.", "Хорошо оснащённая комфортная комплектация.", "Gerai įrengta komforto komplektacija."),
  },
  Opel: {
    "OPC Line": d("Sportisks OPC stila ārējais izskats.", "Sporty OPC-style exterior.", "Спортивный внешний вид в стиле OPC.", "Sportiška OPC stiliaus išvaizda."),
    "GS Line": d("Sportiskā līnija jaunākiem modeļiem.", "The sporty line on newer models.", "Спортивная линия у новых моделей.", "Sportinė linija naujesniuose modeliuose."),
    Cosmo: d("Augstākā komforta komplektācija.", "The top comfort trim.", "Верхняя комфортная комплектация.", "Aukščiausia komforto komplektacija."),
  },
  Hyundai: {
    "N Line": d("Sportisks izskats, iedvesmots no N modeļiem.", "Sporty look inspired by the N models.", "Спортивный вид в стиле моделей N.", "Sportiška išvaizda, įkvėpta N modelių."),
  },
  Nissan: {
    Tekna: d("Augstākā komplektācija.", "The top trim.", "Топовая комплектация.", "Aukščiausia komplektacija."),
    "N-Connecta": d("Vidēji augsta komplektācija ar navigāciju un savienojamību.", "An upper-mid trim with navigation and connectivity.", "Комплектация выше средней с навигацией и подключением.", "Aukštesnė nei vidutinė komplektacija su navigacija ir ryšiu."),
    Acenta: d("Vidējā komplektācija.", "The mid-level trim.", "Средняя комплектация.", "Vidutinė komplektacija."),
  },
  Lexus: {
    "F Sport": d("Sportisks izskats, sporta sēdekļi un bieži adaptīvā piekare.", "Sporty styling, sports seats and often adaptive suspension.", "Спортивный стиль, спортивные сиденья и часто адаптивная подвеска.", "Sportiška išvaizda, sportinės sėdynės ir dažnai adaptyvi pakaba."),
  },
  Renault: {
    "RS Line": d("Sportisks izskats, iedvesmots no Renault Sport.", "Sporty look inspired by Renault Sport.", "Спортивный вид в стиле Renault Sport.", "Sportiška išvaizda, įkvėpta Renault Sport."),
    "Initiale Paris": d("Luksusa līnija ar ādu un premium apdari.", "The luxury line with leather and premium trim.", "Люксовая линия с кожей и премиальной отделкой.", "Prabangi linija su oda ir premium apdaila."),
  },
  Seat: {
    FR: d("Sportiskā līnija: bamperi, diski un sporta piekare.", "The sporty line: bumpers, wheels and sports suspension.", "Спортивная линия: бамперы, диски и спортивная подвеска.", "Sportinė linija: buferiai, ratlankiai ir sportinė pakaba."),
  },
  "Land Rover": {
    "R-Dynamic": d("Sportisks izskats ar tumšiem akcentiem.", "Sporty look with dark accents.", "Спортивный вид с тёмными акцентами.", "Sportiška išvaizda su tamsiais akcentais."),
    HSE: d("Augsta komplektācija ar premium aprīkojumu.", "A high trim with premium equipment.", "Высокая комплектация с премиум-оснащением.", "Aukšta komplektacija su premium įranga."),
  },
};
