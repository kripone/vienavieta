// „Uz ko pievērst uzmanību, pērkot lietotu”: plaši zināmas vājās vietas pa modeļiem (4 valodās).
// Tie ir vispārīgi brīdinājumi, nevis konkrētā auto diagnoze; lapā vienmēr iesakām pārbaudi servisā.
// Atslēga kā MODEL_INFO (src/content/models.ts).
import type { Locale } from "@/i18n/core";

type C = Record<Locale, string[]>;

const N47: C = {
  lv: ["2.0 dīzeļiem N47 (apm. 2007–2014) klausies sadales ķēdi – tā ir motora aizmugurē, un remonts ir dārgs."],
  en: ["On N47 2.0 diesels (about 2007–2014) listen for the timing chain – it sits at the back of the engine and repairs are costly."],
  ru: ["У дизелей 2.0 N47 (примерно 2007–2014) прислушайтесь к цепи ГРМ — она сзади мотора, ремонт дорогой."],
  lt: ["N47 2.0 dyzeliuose (apie 2007–2014) klausykitės paskirstymo grandinės – ji variklio gale, remontas brangus."],
};
const DQ200: C = {
  lv: ["7 pakāpju sausā DSG (DQ200, ar mazākiem dzinējiem) – pārbaudi, vai nav raustīšanās, uzsākot braukt."],
  en: ["7-speed dry DSG (DQ200, with smaller engines) – check for judder when pulling away."],
  ru: ["7-ступенчатый «сухой» DSG (DQ200, с небольшими моторами) — проверьте, нет ли рывков при трогании."],
  lt: ["7 pavarų sausa DSG (DQ200, su mažesniais varikliais) – patikrinkite, ar netrūkčioja pajudant."],
};
const TSI14: C = {
  lv: ["1.2/1.4 TSI (apm. 2007–2012) – klausies sadales ķēdes troksni aukstam dzinējam un pārbaudi eļļas patēriņu."],
  en: ["1.2/1.4 TSI (about 2007–2012) – listen for timing chain rattle on a cold start and check oil consumption."],
  ru: ["1.2/1.4 TSI (примерно 2007–2012) — послушайте цепь на холодную и проверьте расход масла."],
  lt: ["1.2/1.4 TSI (apie 2007–2012) – klausykitės grandinės barškėjimo užvedus šaltą variklį ir patikrinkite alyvos sąnaudas."],
};
const TFSI20: C = {
  lv: ["2.0 TFSI (apm. 2008–2012) mēdz patērēt daudz eļļas – pajautā apkopju vēsturi."],
  en: ["The 2.0 TFSI (about 2008–2012) is known for high oil consumption – ask for the service history."],
  ru: ["2.0 TFSI (примерно 2008–2012) известен большим расходом масла — спросите историю обслуживания."],
  lt: ["2.0 TFSI (apie 2008–2012) garsėja didelėmis alyvos sąnaudomis – paklauskite techninės priežiūros istorijos."],
};
const DIESEL: C = {
  lv: ["Dīzeļiem pārbaudi DPF un EGR stāvokli, īpaši ja auto braukts galvenokārt pilsētā."],
  en: ["On diesels check the DPF and EGR, especially if the car was mostly driven in town."],
  ru: ["У дизелей проверьте сажевый фильтр и EGR, особенно если машина ездила в основном по городу."],
  lt: ["Dyzeliuose patikrinkite DPF ir EGR, ypač jei automobilis daugiausia važinėjo mieste."],
};
const HALDEX: C = {
  lv: ["Pilnpiedziņai (Haldex) pajautā, vai sajūga eļļa mainīta – to bieži aizmirst."],
  en: ["For all-wheel drive (Haldex) ask whether the clutch oil has been changed – it is often forgotten."],
  ru: ["Для полного привода (Haldex) спросите, менялось ли масло муфты — об этом часто забывают."],
  lt: ["Visų ratų pavarai (Haldex) paklauskite, ar keista sankabos alyva – tai dažnai pamirštama."],
};
const M32: C = {
  lv: ["6 pakāpju manuālajai kārbai M32 pārbaudi gultņu troksni 1.–2. pārnesumā."],
  en: ["On the M32 six-speed manual listen for bearing noise in 1st–2nd gear."],
  ru: ["У 6-ступенчатой механики M32 прислушайтесь к шуму подшипников на 1–2-й передаче."],
  lt: ["6 pavarų mechaninėje M32 dėžėje klausykitės guolių triukšmo 1–2 pavaroje."],
};
const AIR: C = {
  lv: ["Pneimatiskā piekare – pārbaudi, vai auto stāvot nenoslīd un vai kompresors nedarbojas pārāk ilgi."],
  en: ["Air suspension – check that the car does not sink when parked and the compressor does not run too long."],
  ru: ["Пневмоподвеска — проверьте, не проседает ли машина на стоянке и не работает ли компрессор слишком долго."],
  lt: ["Pneumatinė pakaba – patikrinkite, ar automobilis stovėdamas nenusileidžia ir ar kompresorius neveikia per ilgai."],
};
const RUST: C = {
  lv: ["Pārbaudi rūsu: sliekšņi, riteņu arkas, durvju apakšas un apakšdaļa."],
  en: ["Check for rust: sills, wheel arches, door bottoms and the underbody."],
  ru: ["Проверьте ржавчину: пороги, арки, низ дверей и днище."],
  lt: ["Patikrinkite rūdis: slenksčius, ratų arkas, durų apačias ir dugną."],
};
const PURETECH: C = {
  lv: ["1.2 PureTech (apm. 2014–2022) zobsiksna darbojas eļļā un nolietojas ātrāk – pajautā, kad mainīta."],
  en: ["The 1.2 PureTech (about 2014–2022) has a wet timing belt that wears early – ask when it was replaced."],
  ru: ["У 1.2 PureTech (примерно 2014–2022) ремень ГРМ работает в масле и быстро изнашивается — спросите, когда меняли."],
  lt: ["1.2 PureTech (apie 2014–2022) paskirstymo diržas veikia alyvoje ir greičiau dyla – paklauskite, kada keistas."],
};
const THP: C = {
  lv: ["1.6 THP benzīna dzinējam (apm. 2007–2015) pārbaudi sadales ķēdi un eļļas patēriņu."],
  en: ["On the 1.6 THP petrol (about 2007–2015) check the timing chain and oil consumption."],
  ru: ["У бензинового 1.6 THP (примерно 2007–2015) проверьте цепь ГРМ и расход масла."],
  lt: ["1.6 THP benzininiame (apie 2007–2015) patikrinkite paskirstymo grandinę ir alyvos sąnaudas."],
};
const CVT: C = {
  lv: ["Variatora (CVT) kārbai pārbaudi, vai nav kaukšanas un raustīšanās, un pajautā par eļļas maiņu."],
  en: ["With a CVT check for whining or judder and ask about fluid changes."],
  ru: ["У вариатора (CVT) проверьте, нет ли воя и рывков, и спросите о замене масла."],
  lt: ["Variatoriaus (CVT) dėžėje patikrinkite, ar nėra kaukimo ir trūkčiojimo, paklauskite apie alyvos keitimą."],
};
const MMT: C = {
  lv: ["Robotizētā kārba (MMT) mēdz raustīties un dārgi remontējama – priekšroka manuālajai vai hibrīdam."],
  en: ["The automated manual (MMT) can be jerky and costly to fix – a manual or hybrid is the safer choice."],
  ru: ["Роботизированная коробка (MMT) склонна к рывкам и дорогому ремонту — надёжнее механика или гибрид."],
  lt: ["Robotizuota dėžė (MMT) linkusi trūkčioti ir brangiai taisoma – patikimesnė mechaninė ar hibridas."],
};
const HYBRID: C = {
  lv: ["Hibrīdam pajautā apkopju vēsturi un hibrīda akumulatora pārbaudes rezultātu."],
  en: ["For a hybrid ask for the service history and a hybrid battery health check."],
  ru: ["Для гибрида спросите историю обслуживания и результат проверки гибридной батареи."],
  lt: ["Hibridui paklauskite techninės priežiūros istorijos ir hibridinės baterijos patikros rezultato."],
};
const DMF: C = {
  lv: ["Pārbaudi divmasu spararatu un sajūgu – vibrācija vai klaboņa iedarbinot un apturot dzinēju."],
  en: ["Check the dual-mass flywheel and clutch – vibration or knocking when starting or stopping the engine."],
  ru: ["Проверьте двухмассовый маховик и сцепление — вибрация или стук при запуске и остановке мотора."],
  lt: ["Patikrinkite dvimasį smagratį ir sankabą – vibracija ar beldimas užvedant ir išjungiant variklį."],
};
const one = (lv: string, en: string, ru: string, lt: string): C => ({ lv: [lv], en: [en], ru: [ru], lt: [lt] });
const join = (...cs: C[]): C => ({
  lv: cs.flatMap((c) => c.lv), en: cs.flatMap((c) => c.en), ru: cs.flatMap((c) => c.ru), lt: cs.flatMap((c) => c.lt),
});

export const MODEL_CHECKS: Record<string, C> = {
  "BMW|5. sērija": join(N47, one("Touring versijām pārbaudi aizmugures pneimatisko piekari.", "On Touring models check the rear air suspension.", "У Touring проверьте заднюю пневмоподвеску.", "Touring versijose patikrinkite galinę pneumatinę pakabą.")),
  "BMW|3. sērija": join(N47, one("E46/E90 dzesēšanas sistēmas plastmasas detaļas (sūknis, termostats, tvertne) laika gaitā jāmaina.", "On the E46/E90 the plastic cooling parts (pump, thermostat, tank) wear out with age.", "У E46/E90 пластиковые детали охлаждения (помпа, термостат, бачок) со временем требуют замены.", "E46/E90 plastikinės aušinimo dalys (pompa, termostatas, bakelis) laikui bėgant dėvisi.")),
  "Audi|A6": join(one("Priekšpiedziņas versijām ar Multitronic (CVT) kārbu pārbaudi raustīšanos – remonts dārgs.", "On front-wheel-drive cars with the Multitronic (CVT) gearbox check for judder – repairs are expensive.", "У переднеприводных версий с Multitronic (CVT) проверьте рывки — ремонт дорогой.", "Priekinių ratų versijose su Multitronic (CVT) patikrinkite trūkčiojimą – remontas brangus."), TFSI20),
  "Volkswagen|Passat": join(DQ200, DIESEL),
  "Volkswagen|Golf": join(DQ200, TSI14),
  "Audi|A4": join(TFSI20, one("Priekšpiedziņas versijām ar Multitronic (CVT) kārbu pārbaudi raustīšanos.", "On front-wheel-drive cars with the Multitronic (CVT) check for judder.", "У переднеприводных с Multitronic (CVT) проверьте рывки.", "Priekinių ratų versijose su Multitronic (CVT) patikrinkite trūkčiojimą.")),
  "Volvo|XC60": join(HALDEX, DIESEL),
  "BMW|X5": join(one("Pārbaudi sadales kārbu: raustīšanās vai klikšķi lēnos pagriezienos liecina par problēmu.", "Check the transfer case: jerking or clicking in slow turns signals a problem.", "Проверьте раздаточную коробку: рывки или щелчки в медленных поворотах — признак проблемы.", "Patikrinkite skirstymo dėžę: trūkčiojimas ar spragsėjimas lėtai sukant rodo problemą."), AIR),
  "Volkswagen|Tiguan": join(TSI14, HALDEX),
  "Mercedes-Benz|E klase": join(one("W211 līdz 2006. gadam: pārbaudi SBC elektrohidraulisko bremžu bloku (vai mainīts vai atjaunots).", "W211 up to 2006: check the SBC electro-hydraulic brake unit (replaced or renewed?).", "W211 до 2006 года: проверьте блок электрогидравлических тормозов SBC (менялся ли).", "W211 iki 2006 m.: patikrinkite SBC elektrohidraulinių stabdžių bloką (ar keistas)."), RUST),
  "Škoda|Octavia": join(DQ200, TSI14),
  "BMW|X3": join(N47, one("E83: pārbaudi sadales kārbu – raustīšanās lēnos pagriezienos.", "E83: check the transfer case for jerking in slow turns.", "E83: проверьте раздатку — рывки в медленных поворотах.", "E83: patikrinkite skirstymo dėžę – trūkčiojimas lėtai sukant.")),
  "Toyota|RAV4": join(one("XA30 ar 2.2 D-4D dīzeli: zināmas galvas blīves un eļļas patēriņa problēmas.", "XA30 with the 2.2 D-4D diesel: known head gasket and oil consumption issues.", "XA30 с дизелем 2.2 D-4D: известны проблемы с прокладкой ГБЦ и расходом масла.", "XA30 su 2.2 D-4D dyzeliu: žinomos galvutės tarpinės ir alyvos sąnaudų problemos."), HYBRID),
  "Audi|Q5": join(TFSI20, one("7 pakāpju S tronic kārbai pārbaudi pārslēgšanos un pajautā par eļļas maiņu.", "On the 7-speed S tronic check the shifts and ask about oil changes.", "У 7-ступенчатой S tronic проверьте переключения и спросите о замене масла.", "7 pavarų S tronic patikrinkite perjungimą ir paklauskite apie alyvos keitimą.")),
  "Volvo|XC90": join(one("Pirmās paaudzes T6 benzīna versijām automātiskā kārba ir vāja vieta.", "On first-generation T6 petrol cars the automatic gearbox is a weak point.", "У бензиновых T6 первого поколения слабое место — автоматическая коробка.", "Pirmosios kartos T6 benzininių automatinė dėžė yra silpnoji vieta."), one("Pirmajai paaudzei pārbaudi leņķa reduktoru (angle gear) un Haldex sajūgu.", "On the first generation check the angle gear and Haldex coupling.", "У первого поколения проверьте угловой редуктор (angle gear) и муфту Haldex.", "Pirmojoje kartoje patikrinkite kampinį reduktorių (angle gear) ir Haldex sankabą.")),
  "Nissan|Qashqai": join(one("J11 ar 1.2 DIG-T (apm. 2014–2018) var patērēt eļļu.", "The J11 with the 1.2 DIG-T (about 2014–2018) can burn oil.", "J11 с 1.2 DIG-T (примерно 2014–2018) может расходовать масло.", "J11 su 1.2 DIG-T (apie 2014–2018) gali naudoti alyvą."), CVT),
  "Mercedes-Benz|C klase": join(one("W204 220/250 CDI (OM651, apm. 2008–2011): zināmas sprauslu problēmas.", "W204 220/250 CDI (OM651, about 2008–2011): known injector problems.", "W204 220/250 CDI (OM651, примерно 2008–2011): известные проблемы форсунок.", "W204 220/250 CDI (OM651, apie 2008–2011): žinomos purkštukų problemos."), RUST),
  "Opel|Astra": join(M32, one("1.9 CDTI (Astra H): virpuļvārsti un EGR ir biežākās dīzeļa problēmas.", "1.9 CDTI (Astra H): swirl flaps and EGR are the usual diesel issues.", "1.9 CDTI (Astra H): заслонки впуска и EGR — типичные проблемы дизеля.", "1.9 CDTI (Astra H): sūkurinės sklendės ir EGR – dažniausios dyzelio problemos.")),
  "BMW|1. sērija": join(N47, one("Riepas bez gaisa (run-flat) padara braukšanu cietāku; pārbaudi riepu stāvokli un cenu.", "Run-flat tyres make the ride firmer; check their condition and replacement cost.", "Шины run-flat делают ход жёстче; проверьте их состояние и цену замены.", "Run-flat padangos daro važiavimą kietesnį; patikrinkite jų būklę ir kainą.")),
  "Audi|A3": join(DQ200, TSI14),
  "Opel|Insignia": join(M32, DMF),
  "Škoda|Superb": join(DQ200, TSI14),
  "BMW|X1": join(N47, DIESEL),
  "Volvo|V60": join(DIESEL, HALDEX),
  "Volvo|V70": join(one("P2 automātiskajai kārbai AW55 pārbaudi, vai pārslēgšanās ir gluda.", "On the P2's AW55 automatic check that shifts are smooth.", "У автомата AW55 (P2) проверьте плавность переключений.", "P2 automatinėje AW55 dėžėje patikrinkite, ar pavaros perjungiamos sklandžiai."), one("Pilnpiedziņas versijām pārbaudi leņķa reduktoru (angle gear).", "On all-wheel-drive cars check the angle gear.", "У полноприводных проверьте угловой редуктор (angle gear).", "Visų ratų pavaros versijose patikrinkite kampinį reduktorių (angle gear).")),
  "Volkswagen|Touran": join(DQ200, TSI14),
  "Kia|Sportage": join(RUST, DIESEL),
  "Peugeot|3008": join(PURETECH, THP),
  "Toyota|Avensis": join(one("2.2 D-4D dīzeļiem (T25/T27) zināmas galvas blīves problēmas.", "The 2.2 D-4D diesel (T25/T27) has known head gasket issues.", "У дизеля 2.2 D-4D (T25/T27) известны проблемы с прокладкой ГБЦ.", "2.2 D-4D dyzelis (T25/T27) turi žinomų galvutės tarpinės problemų."), DIESEL),
  "Audi|Q7": join(AIR, one("Agrīnajiem 3.0 TDI (apm. 2005–2008) sadales ķēdes ir motora aizmugurē – klausies troksni.", "On early 3.0 TDI (about 2005–2008) the timing chains are at the back of the engine – listen for noise.", "У ранних 3.0 TDI (примерно 2005–2008) цепи ГРМ сзади мотора — прислушайтесь к шуму.", "Ankstyvuose 3.0 TDI (apie 2005–2008) grandinės variklio gale – klausykitės triukšmo.")),
  "Škoda|Kodiaq": join(one("DSG kārbai pajautā, vai eļļa mainīta (parasti ik pēc 60 000 km).", "For the DSG ask whether the oil was changed (usually every 60,000 km).", "Для DSG спросите, менялось ли масло (обычно каждые 60 000 км).", "DSG dėžei paklauskite, ar keista alyva (paprastai kas 60 000 km)."), HALDEX),
  "Toyota|C-HR": join(HYBRID, one("1.2 turbo benzīna versija ir retāka; hibrīds parasti ir uzticamākā izvēle.", "The 1.2 turbo petrol is rarer; the hybrid is usually the more reliable choice.", "Бензиновая 1.2 турбо встречается реже; гибрид обычно надёжнее.", "1.2 turbo benzininė versija retesnė; hibridas paprastai patikimesnis.")),
  "BMW|7. sērija": join(AIR, one("4.4 V8 (N63) benzīna dzinējs mēdz patērēt daudz eļļas un tam ir dārgas turbīnas.", "The 4.4 V8 (N63) petrol is known for oil consumption and costly turbos.", "Бензиновый 4.4 V8 (N63) известен расходом масла и дорогими турбинами.", "4.4 V8 (N63) benzininis garsėja alyvos sąnaudomis ir brangiomis turbinomis.")),
  "Ford|Focus": join(one("Mk3 ar 6 pakāpju Powershift automātu: zināmas sajūga raustīšanās problēmas.", "Mk3 with the six-speed Powershift automatic: known clutch judder problems.", "Mk3 с 6-ступенчатым Powershift: известны рывки сцепления.", "Mk3 su 6 pavarų Powershift: žinomos sankabos trūkčiojimo problemos."), one("1.0 EcoBoost (apm. 2012–2015): pārbaudi dzesēšanas sistēmu un atsaukumus.", "1.0 EcoBoost (about 2012–2015): check the cooling system and recalls.", "1.0 EcoBoost (примерно 2012–2015): проверьте систему охлаждения и отзывы.", "1.0 EcoBoost (apie 2012–2015): patikrinkite aušinimo sistemą ir atšaukimus.")),
  "Volkswagen|Transporter": join(DMF, RUST),
  "Toyota|Corolla": join(one("1.4/1.6 benzīna (ZZ dzinēji, apm. 2000–2008) var patērēt eļļu.", "The 1.4/1.6 petrols (ZZ engines, about 2000–2008) can burn oil.", "Бензиновые 1.4/1.6 (моторы ZZ, примерно 2000–2008) могут расходовать масло.", "1.4/1.6 benzininiai (ZZ varikliai, apie 2000–2008) gali naudoti alyvą."), MMT),
  "Toyota|Yaris": join(MMT, HYBRID),
  "Mercedes-Benz|Sprinter": join(RUST, one("OM651 dīzeļiem (apm. 2009–2011) zināmas sprauslu problēmas.", "OM651 diesels (about 2009–2011) have known injector problems.", "У дизелей OM651 (примерно 2009–2011) известны проблемы форсунок.", "OM651 dyzeliai (apie 2009–2011) turi žinomų purkštukų problemų.")),
  "Volkswagen|Touareg": join(AIR, one("Pirmās paaudzes 2.5 R5 TDI dzinējs ir vājākais – priekšroka V6 TDI.", "The first generation's 2.5 R5 TDI is the weakest engine – prefer the V6 TDI.", "У первого поколения 2.5 R5 TDI — самый слабый мотор; лучше V6 TDI.", "Pirmosios kartos 2.5 R5 TDI – silpniausias variklis; geriau V6 TDI.")),
  "Opel|Zafira": join(one("Zafira B: pārbaudi, vai izpildīts atsaukums par salona ventilatora rezistoru (aizdegšanās risks).", "Zafira B: check that the recall for the heater blower resistor (fire risk) was done.", "Zafira B: проверьте, выполнен ли отзыв по резистору вентилятора печки (риск возгорания).", "Zafira B: patikrinkite, ar atliktas atšaukimas dėl salono ventiliatoriaus rezistoriaus (gaisro rizika)."), M32),
  "Volkswagen|Caddy": join(DQ200, DIESEL),
  "Honda|CR-V": join(one("Pilnpiedziņai pajautā par aizmugures diferenciāļa šķidruma maiņu (vaimanāšana pagriezienos).", "For all-wheel drive ask about rear differential fluid changes (groaning in turns).", "Для полного привода спросите о замене жидкости заднего дифференциала (гул в поворотах).", "Visų ratų pavarai paklauskite apie galinio diferencialo skysčio keitimą (ūžimas posūkiuose)."), DIESEL),
  "Toyota|Auris": join(MMT, HYBRID),
  "Peugeot|308": join(PURETECH, THP),
  "Lexus|RX": join(HYBRID, one("RX 400h: pārbaudi, vai izpildīti atsaukumi (piem. invertora dzesēšanas sūknis).", "RX 400h: check that recalls were done (e.g. the inverter cooling pump).", "RX 400h: проверьте выполнение отзывов (например, помпа охлаждения инвертора).", "RX 400h: patikrinkite, ar atlikti atšaukimai (pvz., inverterio aušinimo pompa).")),
  "Porsche|Cayenne": join(one("Pirmās paaudzes V8: plastmasas dzesēšanas caurules zem ieplūdes kolektora mēdz tecēt.", "First-generation V8: the plastic coolant pipes under the intake manifold tend to leak.", "V8 первого поколения: пластиковые патрубки охлаждения под впуском склонны течь.", "Pirmosios kartos V8: plastikiniai aušinimo vamzdžiai po įsiurbimo kolektoriumi linkę tekėti."), AIR),
  "Ford|Transit": join(RUST, DMF),
  "Jeep|Grand Cherokee": join(one("WK2 Quadra-Lift pneimatiskā piekare ir dārga remontā.", "The WK2's Quadra-Lift air suspension is costly to repair.", "Пневмоподвеска Quadra-Lift у WK2 дорогая в ремонте.", "WK2 Quadra-Lift pneumatinė pakaba brangi taisyti."), DIESEL),
  "Mercedes-Benz|S klase": join(AIR, one("Daudz elektronikas – pārbaudi, vai visas sistēmas strādā, un nolasi kļūdas.", "Lots of electronics – check every system works and read the fault codes.", "Много электроники — проверьте работу всех систем и считайте ошибки.", "Daug elektronikos – patikrinkite, ar viskas veikia, ir nuskaitykite klaidas.")),
  "Hyundai|Tucson": join(one("7 pakāpju DCT kārbai pārbaudi raustīšanos lēnā braukšanā.", "On the 7-speed DCT check for judder at low speed.", "У 7-ступенчатого DCT проверьте рывки на малой скорости.", "7 pavarų DCT patikrinkite trūkčiojimą važiuojant lėtai."), RUST),
  "Volvo|XC70": join(one("Pārbaudi leņķa reduktoru (angle gear) un Haldex sajūgu.", "Check the angle gear and Haldex coupling.", "Проверьте угловой редуктор (angle gear) и муфту Haldex.", "Patikrinkite kampinį reduktorių (angle gear) ir Haldex sankabą."), DIESEL),
  "Volvo|S60": join(one("Pirmās paaudzes automātiskajai kārbai AW55 pārbaudi gludu pārslēgšanos.", "On the first generation's AW55 automatic check for smooth shifts.", "У автомата AW55 первого поколения проверьте плавность переключений.", "Pirmosios kartos AW55 automatinėje dėžėje patikrinkite sklandų perjungimą."), DIESEL),
  "Nissan|X-Trail": join(CVT, DIESEL),
  "BMW|X6": join(one("4.4 V8 (N63, xDrive50i) mēdz patērēt eļļu, un turbīnas ir dārgas.", "The 4.4 V8 (N63, xDrive50i) tends to burn oil and its turbos are costly.", "4.4 V8 (N63, xDrive50i) склонен к расходу масла, турбины дорогие.", "4.4 V8 (N63, xDrive50i) linkęs naudoti alyvą, turbinos brangios."), one("Pārbaudi sadales kārbu – raustīšanās lēnos pagriezienos.", "Check the transfer case for jerking in slow turns.", "Проверьте раздатку — рывки в медленных поворотах.", "Patikrinkite skirstymo dėžę – trūkčiojimas lėtai sukant.")),
  "Ford|S-Max": join(DIESEL, DMF),
  "Ford|Kuga": join(one("1.5/1.6 EcoBoost (apm. 2012–2019): pārbaudi dzesēšanas šķidruma noplūdes un atsaukumus.", "1.5/1.6 EcoBoost (about 2012–2019): check for coolant leaks and recalls.", "1.5/1.6 EcoBoost (примерно 2012–2019): проверьте утечки антифриза и отзывы.", "1.5/1.6 EcoBoost (apie 2012–2019): patikrinkite aušinimo skysčio nuotėkius ir atšaukimus."), DIESEL),
  "Subaru|Outback": join(CVT, one("Agrīnajam 2.0D boxer dīzelim (apm. 2008–2011) zināmas kloķvārpstas problēmas.", "The early 2.0D boxer diesel (about 2008–2011) has known crankshaft problems.", "У раннего оппозитного дизеля 2.0D (примерно 2008–2011) известны проблемы коленвала.", "Ankstyvas 2.0D boxer dyzelis (apie 2008–2011) turi žinomų alkūninio veleno problemų.")),
  "Peugeot|5008": join(PURETECH, THP),
  "Renault|Trafic": join(DMF, RUST),
  "Mazda|CX-5": join(one("2.2 Skyactiv-D: pilsētas braukšanā degviela var nonākt eļļā – pārbaudi eļļas līmeni un apkopes.", "2.2 Skyactiv-D: in town driving fuel can dilute the oil – check the oil level and servicing.", "2.2 Skyactiv-D: при городской езде топливо может попадать в масло — проверьте уровень масла и ТО.", "2.2 Skyactiv-D: važinėjant mieste kuras gali patekti į alyvą – patikrinkite alyvos lygį ir priežiūrą."), RUST),
};
