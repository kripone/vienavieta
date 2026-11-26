// „Uz ko pievērst uzmanību, pērkot lietotu”: plaši zināmas vājās vietas pa modeļiem (4 valodās).
// Tie ir vispārīgi brīdinājumi, nevis konkrētā auto diagnoze; lapā vienmēr iesakām pārbaudi servisā.
// Atslēga kā MODEL_INFO (src/content/models.ts).
import type { Locale } from "@/i18n/core";

type C = Record<Locale, string[]>;

const N47: C = {
  lv: ["2.0 dīzeļiem N47 (apm. 2007–2015) klausies sadales ķēdi – tā ir motora aizmugurē, un remonts ir dārgs."],
  en: ["On N47 2.0 diesels (about 2007–2015) listen for the timing chain – it sits at the back of the engine and repairs are costly."],
  ru: ["У дизелей 2.0 N47 (примерно 2007–2015) прислушайтесь к цепи ГРМ — она сзади мотора, ремонт дорогой."],
  lt: ["N47 2.0 dyzeliuose (apie 2007–2015) klausykitės paskirstymo grandinės – ji variklio gale, remontas brangus."],
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

// --- noteikumi: piezīme attiecas uz paaudzi (g), gadu intervālu (y), degvielu (f) un/vai kārbu (a) ---
// Bez nosacījumiem = visam modelim. Sludinājumā rāda tikai atbilstošos (ne vairāk kā CHECKS_MAX), modeļa lapā – visus pa paaudzēm.
export type Fuel = "Dīzelis" | "Benzīns" | "Hibrīds" | "Elektro";
export type Rule = { g?: string[]; y?: [number, number]; f?: Fuel; a?: "Automāts" | "Manuāla"; c: C };
export const CHECKS_MAX = 4;
const NOW = 2100;
const r = (c: C, cond: Partial<Omit<Rule, "c">> = {}): Rule => ({ ...cond, c });
const x = one;

const EV: C = one(
  "Elektroauto pārbaudi akumulatora veselības (SOH) atskaiti, lādēšanas ātrumu un akumulatora garantiju.",
  "On an electric car check the battery health (SOH) report, charging speed and the battery warranty.",
  "У электромобиля проверьте отчёт о состоянии батареи (SOH), скорость зарядки и гарантию на батарею.",
  "Elektromobiliui patikrinkite baterijos būklės (SOH) ataskaitą, įkrovimo greitį ir baterijos garantiją.",
);
const PHEV: C = one(
  "Plug-in hibrīdam pārbaudi akumulatora stāvokli un to, vai lādēšana strādā ar visiem kabeļiem.",
  "On a plug-in hybrid check the battery condition and that charging works with all cables.",
  "У plug-in гибрида проверьте состояние батареи и работу зарядки со всеми кабелями.",
  "Plug-in hibridui patikrinkite baterijos būklę ir ar įkrovimas veikia su visais kabeliais.",
);
const B47: C = one(
  "Dīzeļiem no apm. 2015. gada (B47) pārbaudi DPF un EGR; motora kodu (N47 vai B47) var noskaidrot pie pārdevēja.",
  "On diesels from about 2015 (B47) check the DPF and EGR; ask the seller for the engine code (N47 or B47).",
  "У дизелей примерно с 2015 года (B47) проверьте сажевый фильтр и EGR; код мотора (N47 или B47) уточните у продавца.",
  "Dyzeliuose nuo maždaug 2015 m. (B47) patikrinkite DPF ir EGR; variklio kodo (N47 ar B47) paklauskite pardavėjo.",
);
const ELEC: C = one(
  "Daudz elektronikas – pārbaudi, vai visas funkcijas strādā, un nolasi kļūdu kodus.",
  "Lots of electronics – check every function works and read the fault codes.",
  "Много электроники — проверьте работу всех функций и считайте коды ошибок.",
  "Daug elektronikos – patikrinkite, ar veikia visos funkcijos, ir nuskaitykite klaidų kodus.",
);
const TIMING: C = one(
  "Klausies dzinēja troksni aukstam – ķēdes vai siksnas nodilums ir dārgs remonts; pajautā, kad tas mainīts.",
  "Listen to the engine when cold – timing chain or belt wear is an expensive repair; ask when it was replaced.",
  "Послушайте холодный мотор — износ цепи или ремня ГРМ дорог в ремонте; спросите, когда менялся.",
  "Klausykitės šalto variklio – grandinės ar diržo nusidėvėjimas brangiai taisomas; paklauskite, kada keistas.",
);
const DSGOIL: C = one(
  "DSG kārbai pajautā, vai eļļa mainīta (parasti ik pēc 60 000 km).",
  "For the DSG ask whether the oil was changed (usually every 60,000 km).",
  "Для DSG спросите, менялось ли масло (обычно каждые 60 000 км).",
  "DSG dėžei paklauskite, ar keista alyva (paprastai kas 60 000 km).",
);

export const MODEL_CHECKS: Record<string, Rule[]> = {
  "BMW|5. sērija": [
    r(x("Pārbaudi rūsu uz aizmugurējām arkām un slieksņiem, kā arī dzesēšanas sistēmu (sūknis, termostats, radiators).", "Check for rust on the rear arches and sills, and the cooling system (pump, thermostat, radiator).", "Проверьте ржавчину на задних арках и порогах, а также систему охлаждения (помпа, термостат, радиатор).", "Patikrinkite rūdis ant galinių arkų ir slenksčių bei aušinimo sistemą (pompa, termostatas, radiatorius)."), { g: ["E34", "E39"] }),
    r(N47, { y: [2007, 2015], f: "Dīzelis" }),
    r(B47, { y: [2015, NOW], f: "Dīzelis" }),
    r(x("M57 dīzeļiem (525d/530d/535d) pārbaudi virpuļvārstus (swirl flaps) un turbīnu.", "On M57 diesels (525d/530d/535d) check the swirl flaps and the turbo.", "У дизелей M57 (525d/530d/535d) проверьте вихревые заслонки и турбину.", "M57 dyzeliuose (525d/530d/535d) patikrinkite sūkurines sklendes ir turbiną."), { g: ["E60/E61"], f: "Dīzelis" }),
    r(ELEC, { g: ["E60/E61"] }),
    r(x("2.0 turbo benzīnam (N20, apm. 2011–2015) pārbaudi sadales ķēdes nodilumu.", "On the 2.0 turbo petrol (N20, about 2011–2015) check for timing chain wear.", "У бензинового 2.0 турбо (N20, примерно 2011–2015) проверьте износ цепи ГРМ.", "2.0 turbo benzininiame (N20, apie 2011–2015) patikrinkite grandinės nusidėvėjimą."), { g: ["F10/F11"], f: "Benzīns" }),
    r(PHEV, { g: ["G30/G31"], f: "Hibrīds" }),
    r(x("Touring versijām pārbaudi aizmugures pneimatisko piekari.", "On Touring models check the rear air suspension.", "У Touring проверьте заднюю пневмоподвеску.", "Touring versijose patikrinkite galinę pneumatinę pakabą.")),
  ],
  "BMW|3. sērija": [
    r(x("Pārbaudi rūsu uz slieksņiem un aizmugures arkām, kā arī aizmugurējās ass stiprinājumus.", "Check for rust on the sills and rear arches, and the rear subframe mounts.", "Проверьте ржавчину на порогах и задних арках, а также крепления заднего подрамника.", "Patikrinkite rūdis ant slenksčių ir galinių arkų bei galinio rėmo tvirtinimus."), { g: ["E36", "E46"] }),
    r(x("Dzesēšanas sistēmas plastmasas detaļas (sūknis, termostats, tvertne) laika gaitā jāmaina.", "The plastic cooling parts (pump, thermostat, tank) wear out with age.", "Пластиковые детали охлаждения (помпа, термостат, бачок) со временем требуют замены.", "Plastikinės aušinimo dalys (pompa, termostatas, bakelis) laikui bėgant dėvisi."), { g: ["E46", "E90/E91"] }),
    r(N47, { y: [2007, 2015], f: "Dīzelis" }),
    r(B47, { y: [2015, NOW], f: "Dīzelis" }),
    r(x("N43/N45/N46 benzīna dzinējiem pārbaudi eļļas noplūdes pie vārstu vāka un dzesēšanas sistēmu.", "On N43/N45/N46 petrol engines check for oil leaks at the valve cover and the cooling system.", "У бензиновых N43/N45/N46 проверьте течи масла у клапанной крышки и систему охлаждения.", "N43/N45/N46 benzininiuose patikrinkite alyvos nuotėkius prie vožtuvų dangtelio ir aušinimo sistemą."), { g: ["E90/E91"], f: "Benzīns" }),
    r(x("2.0 turbo benzīnam (N20, apm. 2012–2015) pārbaudi sadales ķēdes nodilumu.", "On the 2.0 turbo petrol (N20, about 2012–2015) check for timing chain wear.", "У бензинового 2.0 турбо (N20, примерно 2012–2015) проверьте износ цепи ГРМ.", "2.0 turbo benzininiame (N20, apie 2012–2015) patikrinkite grandinės nusidėvėjimą."), { g: ["F30/F31"], f: "Benzīns" }),
    r(PHEV, { g: ["F30/F31", "G20/G21"], f: "Hibrīds" }),
  ],
  "Audi|A6": [
    r(x("Priekšpiedziņas versijām ar Multitronic (CVT) kārbu pārbaudi raustīšanos – remonts dārgs.", "On front-wheel-drive cars with the Multitronic (CVT) gearbox check for judder – repairs are expensive.", "У переднеприводных версий с Multitronic (CVT) проверьте рывки — ремонт дорогой.", "Priekinių ratų versijose su Multitronic (CVT) patikrinkite trūkčiojimą – remontas brangus."), { g: ["C5", "C6"] }),
    r(x("Pārbaudi dzesēšanas sistēmu un eļļas noplūdes; pneimatiskajai piekarei (allroad) pārbaudi, vai auto stāvot nenoslīd.", "Check the cooling system and oil leaks; on air suspension (allroad) check that the car does not sink when parked.", "Проверьте систему охлаждения и течи масла; у пневмоподвески (allroad) — не проседает ли машина на стоянке.", "Patikrinkite aušinimo sistemą ir alyvos nuotėkius; pneumatinę pakabą (allroad) – ar automobilis stovėdamas nenusileidžia."), { g: ["C5"] }),
    r(x("Agrīnajiem 3.0 TDI (apm. 2005–2008) sadales ķēdes ir motora aizmugurē – klausies troksni.", "On early 3.0 TDI (about 2005–2008) the timing chains are at the back of the engine – listen for noise.", "У ранних 3.0 TDI (примерно 2005–2008) цепи ГРМ сзади мотора — прислушайтесь к шуму.", "Ankstyvuose 3.0 TDI (apie 2005–2008) grandinės variklio gale – klausykitės triukšmo."), { g: ["C6"], f: "Dīzelis" }),
    r(TFSI20, { y: [2008, 2012], f: "Benzīns" }),
    r(x("7 pakāpju S tronic kārbai pārbaudi pārslēgšanos un pajautā par eļļas maiņu.", "On the 7-speed S tronic check the shifts and ask about oil changes.", "У 7-ступенчатой S tronic проверьте переключения и спросите о замене масла.", "7 pavarų S tronic patikrinkite perjungimą ir paklauskite apie alyvos keitimą."), { g: ["C7", "C8"], a: "Automāts" }),
    r(DIESEL, { g: ["C7", "C8"], f: "Dīzelis" }),
  ],
  "Volkswagen|Passat": [
    r(x("Pārbaudi rūsu uz aizmugures arkām un dzesēšanas sistēmu; dīzeļiem – injektorus un turbīnu.", "Check for rust on the rear arches and the cooling system; on diesels the injectors and turbo.", "Проверьте ржавчину на задних арках и систему охлаждения; у дизелей — форсунки и турбину.", "Patikrinkite rūdis ant galinių arkų ir aušinimo sistemą; dyzeliuose – purkštukus ir turbiną."), { g: ["B5"] }),
    r(x("2.0 TDI ar PD sprauslām (apm. 2005–2008): klausies sprauslu un sadales vārpstas troksni, pajautā par remontu.", "On the 2.0 TDI with unit injectors (about 2005–2008) listen for injector and camshaft noise and ask about repairs.", "У 2.0 TDI с насос-форсунками (примерно 2005–2008) прислушайтесь к форсункам и распредвалу, спросите о ремонте.", "2.0 TDI su siurblio purkštukais (apie 2005–2008): klausykitės purkštukų ir skirstomojo veleno triukšmo, paklauskite apie remontą."), { g: ["B6"], f: "Dīzelis" }),
    r(x("2.0 TDI (CR, apm. 2008–2014): pārbaudi eļļas siltummaini, DPF un EGR.", "On the 2.0 TDI (CR, about 2008–2014) check the oil cooler, DPF and EGR.", "У 2.0 TDI (CR, примерно 2008–2014) проверьте масляный радиатор, сажевый фильтр и EGR.", "2.0 TDI (CR, apie 2008–2014): patikrinkite alyvos aušintuvą, DPF ir EGR."), { g: ["B6", "B7"], f: "Dīzelis" }),
    r(DQ200, { g: ["B7", "B8"], a: "Automāts" }),
    r(TSI14, { y: [2008, 2012], f: "Benzīns" }),
    r(PHEV, { g: ["B8"], f: "Hibrīds" }),
  ],
  "Volkswagen|Golf": [
    r(x("Pārbaudi rūsu uz aizmugures arkām un slieksņiem, kā arī elektrisko logu pacēlāju un durvju slēdžu darbību.", "Check for rust on the rear arches and sills, and the electric windows and door switches.", "Проверьте ржавчину на задних арках и порогах, а также электростеклоподъёмники и выключатели дверей.", "Patikrinkite rūdis ant galinių arkų ir slenksčių bei elektrinius stiklų pakėliklius ir durų jungiklius."), { g: ["Mk4"] }),
    r(x("1.9/2.0 TDI (PD sprauslas): klausies sprauslu troksni un pajautā par sadales siksnas maiņu.", "On the 1.9/2.0 TDI (unit injectors) listen for injector noise and ask about the timing belt replacement.", "У 1.9/2.0 TDI (насос-форсунки) прислушайтесь к форсункам и спросите о замене ремня ГРМ.", "1.9/2.0 TDI (siurblio purkštukai): klausykitės purkštukų triukšmo ir paklauskite apie paskirstymo diržo keitimą."), { g: ["Mk5"], f: "Dīzelis" }),
    r(TSI14, { y: [2007, 2012], f: "Benzīns" }),
    r(DQ200, { g: ["Mk6", "Mk7"], a: "Automāts" }),
    r(x("2.0 TDI (CR): pārbaudi DPF un eļļas siltummaini.", "On the 2.0 TDI (CR) check the DPF and the oil cooler.", "У 2.0 TDI (CR) проверьте сажевый фильтр и масляный радиатор.", "2.0 TDI (CR): patikrinkite DPF ir alyvos aušintuvą."), { g: ["Mk6", "Mk7"], f: "Dīzelis" }),
    r(EV, { f: "Elektro" }),
  ],
  "Audi|A4": [
    r(x("1.8T un 1.9 TDI: pārbaudi sadales siksnu, eļļas noplūdes un priekšējās piekares detaļas.", "On the 1.8T and 1.9 TDI check the timing belt, oil leaks and the front suspension parts.", "У 1.8T и 1.9 TDI проверьте ремень ГРМ, течи масла и детали передней подвески.", "1.8T ir 1.9 TDI: patikrinkite paskirstymo diržą, alyvos nuotėkius ir priekinės pakabos dalis."), { g: ["B5", "B6"] }),
    r(x("Priekšpiedziņas versijām ar Multitronic (CVT) kārbu pārbaudi raustīšanos.", "On front-wheel-drive cars with the Multitronic (CVT) check for judder.", "У переднеприводных с Multitronic (CVT) проверьте рывки.", "Priekinių ratų versijose su Multitronic (CVT) patikrinkite trūkčiojimą."), { g: ["B6", "B7", "B8"] }),
    r(TFSI20, { g: ["B8"], f: "Benzīns" }),
    r(x("2.0 TDI (CR): pārbaudi DPF, EGR un eļļas siltummaini.", "On the 2.0 TDI (CR) check the DPF, EGR and oil cooler.", "У 2.0 TDI (CR) проверьте сажевый фильтр, EGR и масляный радиатор.", "2.0 TDI (CR): patikrinkite DPF, EGR ir alyvos aušintuvą."), { g: ["B8", "B9"], f: "Dīzelis" }),
    r(x("7 pakāpju S tronic kārbai pārbaudi pārslēgšanos un pajautā par eļļas maiņu.", "On the 7-speed S tronic check the shifts and ask about oil changes.", "У 7-ступенчатой S tronic проверьте переключения и спросите о замене масла.", "7 pavarų S tronic patikrinkite perjungimą ir paklauskite apie alyvos keitimą."), { g: ["B8", "B9"], a: "Automāts" }),
  ],
  "Volvo|XC60": [
    r(HALDEX, { g: ["1. paaudze"] }),
    r(x("D5 dīzeļiem pārbaudi DPF, EGR un sprauslas; pajautā par apkopju vēsturi.", "On the D5 diesels check the DPF, EGR and injectors, and ask for the service history.", "У дизелей D5 проверьте сажевый фильтр, EGR и форсунки; спросите историю обслуживания.", "D5 dyzeliuose patikrinkite DPF, EGR ir purkštukus; paprašykite techninės priežiūros istorijos."), { g: ["1. paaudze"], f: "Dīzelis" }),
    r(x("T8 plug-in hibrīdam pārbaudi akumulatora stāvokli un to, vai lādēšana strādā.", "On the T8 plug-in hybrid check the battery condition and that charging works.", "У plug-in гибрида T8 проверьте состояние батареи и работу зарядки.", "T8 plug-in hibridui patikrinkite baterijos būklę ir ar veikia įkrovimas."), { g: ["2. paaudze"], f: "Hibrīds" }),
    r(ELEC, { g: ["2. paaudze"] }),
    r(x("Pārbaudi eļļas līmeni un dzesēšanas sistēmu; D4/D5 dīzeļiem pajautā, kad mainīta zobsiksna.", "Check the oil level and cooling system; on the D4/D5 diesels ask when the timing belt was replaced.", "Проверьте уровень масла и систему охлаждения; у дизелей D4/D5 спросите, когда менялся ремень ГРМ.", "Patikrinkite alyvos lygį ir aušinimo sistemą; D4/D5 dyzeliuose paklauskite, kada keistas paskirstymo diržas."), { g: ["2. paaudze"], f: "Dīzelis" }),
  ],
  "BMW|X5": [
    r(x("Pārbaudi sadales kārbu: raustīšanās vai klikšķi lēnos pagriezienos liecina par problēmu.", "Check the transfer case: jerking or clicking in slow turns signals a problem.", "Проверьте раздаточную коробку: рывки или щелчки в медленных поворотах — признак проблемы.", "Patikrinkite skirstymo dėžę: trūkčiojimas ar spragsėjimas lėtai sukant rodo problemą.")),
    r(x("Pneimatiskā piekare – pārbaudi, vai auto stāvot nenoslīd un vai kompresors nedarbojas pārāk ilgi.", "Air suspension – check that the car does not sink when parked and the compressor does not run too long.", "Пневмоподвеска — проверьте, не проседает ли машина на стоянке и не работает ли компрессор слишком долго.", "Pneumatinė pakaba – patikrinkite, ar automobilis stovėdamas nenusileidžia ir ar kompresorius neveikia per ilgai."), { g: ["E53", "E70", "F15"] }),
    r(x("Pārbaudi rūsu un dzesēšanas sistēmu; E53 ar 4.4/4.8 V8 – eļļas noplūdes un ventilatora vadību.", "Check for rust and the cooling system; on the E53 with the 4.4/4.8 V8 oil leaks and the fan control.", "Проверьте ржавчину и систему охлаждения; у E53 с V8 4.4/4.8 — течи масла и управление вентилятором.", "Patikrinkite rūdis ir aušinimo sistemą; E53 su 4.4/4.8 V8 – alyvos nuotėkius ir ventiliatoriaus valdymą."), { g: ["E53"] }),
    r(x("4.4 V8 (N63) benzīna dzinējs mēdz patērēt daudz eļļas un tam ir dārgas turbīnas.", "The 4.4 V8 (N63) petrol is known for oil consumption and costly turbos.", "Бензиновый 4.4 V8 (N63) известен расходом масла и дорогими турбинами.", "4.4 V8 (N63) benzininis garsėja alyvos sąnaudomis ir brangiomis turbinomis."), { g: ["E70", "F15"], f: "Benzīns" }),
    r(x("3.0d dīzeļiem pārbaudi DPF, EGR un virpuļvārstus.", "On the 3.0d diesels check the DPF, EGR and swirl flaps.", "У дизелей 3.0d проверьте сажевый фильтр, EGR и вихревые заслонки.", "3.0d dyzeliuose patikrinkite DPF, EGR ir sūkurines sklendes."), { g: ["E70", "F15"], f: "Dīzelis" }),
    r(PHEV, { g: ["F15", "G05"], f: "Hibrīds" }),
  ],
  "Volkswagen|Tiguan": [
    r(TSI14, { g: ["1. paaudze"], f: "Benzīns" }),
    r(HALDEX, { g: ["1. paaudze", "2. paaudze"] }),
    r(x("2.0 TDI: pārbaudi DPF, EGR un eļļas siltummaini.", "On the 2.0 TDI check the DPF, EGR and the oil cooler.", "У 2.0 TDI проверьте сажевый фильтр, EGR и масляный радиатор.", "2.0 TDI: patikrinkite DPF, EGR ir alyvos aušintuvą."), { f: "Dīzelis" }),
    r(DSGOIL, { a: "Automāts" }),
    r(PHEV, { g: ["2. paaudze", "3. paaudze"], f: "Hibrīds" }),
  ],
  "Mercedes-Benz|E klase": [
    r(x("W210: pārbaudi rūsu uz arkām un slieksņiem, kā arī elektroinstalāciju.", "W210: check for rust on the arches and sills, and the wiring.", "W210: проверьте ржавчину на арках и порогах, а также электропроводку.", "W210: patikrinkite rūdis ant arkų ir slenksčių bei elektros instaliaciją."), { g: ["W210"] }),
    r(x("W211 līdz 2006. gadam: pārbaudi SBC elektrohidraulisko bremžu bloku (vai mainīts vai atjaunots).", "W211 up to 2006: check the SBC electro-hydraulic brake unit (replaced or renewed?).", "W211 до 2006 года: проверьте блок электрогидравлических тормозов SBC (менялся ли).", "W211 iki 2006 m.: patikrinkite SBC elektrohidraulinių stabdžių bloką (ar keistas)."), { g: ["W211"] }),
    r(x("W211 ar pneimatisko Airmatic piekari: pārbaudi, vai auto nenoslīd un kompresors nedarbojas pārāk ilgi.", "W211 with Airmatic air suspension: check that the car does not sink and the compressor does not run too long.", "W211 с пневмоподвеской Airmatic: проверьте, не проседает ли машина и не работает ли компрессор слишком долго.", "W211 su pneumatine Airmatic pakaba: patikrinkite, ar automobilis nenusileidžia ir ar kompresorius neveikia per ilgai."), { g: ["W211"] }),
    r(x("W212 ar OM651 dīzeli (apm. 2009–2013): zināmas sprauslu problēmas; pārbaudi arī DPF.", "W212 with the OM651 diesel (about 2009–2013): known injector problems; also check the DPF.", "W212 с дизелем OM651 (примерно 2009–2013): известны проблемы форсунок; проверьте и сажевый фильтр.", "W212 su OM651 dyzeliu (apie 2009–2013): žinomos purkštukų problemos; patikrinkite ir DPF."), { g: ["W212"], f: "Dīzelis" }),
    r(x("M272/M273 benzīna V6/V8 (apm. 2004–2008) bija zināmas balansēšanas vārpstas problēmas – pajautā, vai pārbaudīts.", "The M272/M273 petrol V6/V8 (about 2004–2008) had known balance shaft issues – ask whether this was checked.", "У бензиновых V6/V8 M272/M273 (примерно 2004–2008) известны проблемы балансирного вала — спросите, проверялось ли.", "M272/M273 benzininiuose V6/V8 (apie 2004–2008) žinomos balansinio veleno problemos – paklauskite, ar tikrinta."), { g: ["W211"], f: "Benzīns" }),
    r(RUST, { g: ["W210", "W211"] }),
    r(PHEV, { g: ["W213"], f: "Hibrīds" }),
  ],
  "Škoda|Octavia": [
    r(x("Pārbaudi rūsu uz slieksņiem un arkām; 1.9 TDI ar PD sprauslām klausies sprauslu troksni.", "Check for rust on the sills and arches; on the 1.9 TDI with unit injectors listen for injector noise.", "Проверьте ржавчину на порогах и арках; у 1.9 TDI с насос-форсунками прислушайтесь к форсункам.", "Patikrinkite rūdis ant slenksčių ir arkų; 1.9 TDI su siurblio purkštukais klausykitės purkštukų triukšmo."), { g: ["1U", "1Z"] }),
    r(TSI14, { g: ["1Z", "5E"], f: "Benzīns", y: [2008, 2012] }),
    r(DQ200, { g: ["1Z", "5E"], a: "Automāts" }),
    r(x("2.0 TDI (CR): pārbaudi DPF, EGR un eļļas siltummaini.", "On the 2.0 TDI (CR) check the DPF, EGR and oil cooler.", "У 2.0 TDI (CR) проверьте сажевый фильтр, EGR и масляный радиатор.", "2.0 TDI (CR): patikrinkite DPF, EGR ir alyvos aušintuvą."), { g: ["1Z", "5E"], f: "Dīzelis" }),
    r(x("Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "Check that recalls and software updates have been done.", "Проверьте, выполнены ли отзывные кампании и обновления ПО.", "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), { g: ["NX"] }),
  ],
  "BMW|X3": [
    r(x("E83: pārbaudi sadales kārbu – raustīšanās lēnos pagriezienos.", "E83: check the transfer case for jerking in slow turns.", "E83: проверьте раздатку — рывки в медленных поворотах.", "E83: patikrinkite skirstymo dėžę – trūkčiojimas lėtai sukant."), { g: ["E83"] }),
    r(N47, { y: [2007, 2015], f: "Dīzelis" }),
    r(B47, { y: [2015, NOW], f: "Dīzelis" }),
    r(x("F25: pārbaudi sadales kārbu, eļļas noplūdes un dzesēšanas sistēmu.", "F25: check the transfer case, oil leaks and the cooling system.", "F25: проверьте раздатку, течи масла и систему охлаждения.", "F25: patikrinkite skirstymo dėžę, alyvos nuotėkius ir aušinimo sistemą."), { g: ["F25"] }),
    r(PHEV, { g: ["G01"], f: "Hibrīds" }),
  ],
  "Toyota|RAV4": [
    r(x("XA30 ar 2.2 D-4D dīzeli: zināmas galvas blīves un eļļas patēriņa problēmas.", "XA30 with the 2.2 D-4D diesel: known head gasket and oil consumption issues.", "XA30 с дизелем 2.2 D-4D: известны проблемы с прокладкой ГБЦ и расходом масла.", "XA30 su 2.2 D-4D dyzeliu: žinomos galvutės tarpinės ir alyvos sąnaudų problemos."), { g: ["XA30"], f: "Dīzelis" }),
    r(x("XA20/XA30: pārbaudi rūsu uz aizmugures durvīm un slieksņiem; pilnpiedziņai – diferenciāļa troksni.", "XA20/XA30: check for rust on the rear doors and sills; on AWD listen to the differential.", "XA20/XA30: проверьте ржавчину на задних дверях и порогах; у полного привода — шум дифференциала.", "XA20/XA30: patikrinkite rūdis ant galinių durų ir slenksčių; visų ratų pavarai – diferencialo triukšmą."), { g: ["XA20", "XA30"] }),
    r(CVT, { g: ["XA40"], a: "Automāts" }),
    r(HYBRID, { g: ["XA40", "XA50"], f: "Hibrīds" }),
    r(x("Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "Check that recalls and software updates have been done.", "Проверьте, выполнены ли отзывные кампании и обновления ПО.", "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), { g: ["XA50"] }),
  ],
  "Audi|Q5": [
    r(TFSI20, { g: ["8R"], f: "Benzīns", y: [2008, 2012] }),
    r(x("2.0 TDI: pārbaudi DPF un EGR, un pajautā, kad mainīta zobsiksna.", "On the 2.0 TDI check the DPF and EGR, and ask when the timing belt was replaced.", "У 2.0 TDI проверьте сажевый фильтр и EGR и спросите, когда менялся ремень ГРМ.", "2.0 TDI: patikrinkite DPF ir EGR, paklauskite, kada keistas paskirstymo diržas."), { g: ["8R"], f: "Dīzelis" }),
    r(x("7 pakāpju S tronic kārbai pārbaudi pārslēgšanos un pajautā par eļļas maiņu.", "On the 7-speed S tronic check the shifts and ask about oil changes.", "У 7-ступенчатой S tronic проверьте переключения и спросите о замене масла.", "7 pavarų S tronic patikrinkite perjungimą ir paklauskite apie alyvos keitimą."), { a: "Automāts" }),
    r(PHEV, { g: ["FY", "3. paaudze"], f: "Hibrīds" }),
    r(DIESEL, { g: ["FY"], f: "Dīzelis" }),
  ],
  "Volvo|XC90": [
    r(x("Pirmās paaudzes T6 benzīna versijām automātiskā kārba ir vāja vieta.", "On first-generation T6 petrol cars the automatic gearbox is a weak point.", "У бензиновых T6 первого поколения слабое место — автоматическая коробка.", "Pirmosios kartos T6 benzininių automatinė dėžė yra silpnoji vieta."), { g: ["1. paaudze"], f: "Benzīns" }),
    r(x("Pārbaudi leņķa reduktoru (angle gear) un Haldex sajūgu.", "Check the angle gear and Haldex coupling.", "Проверьте угловой редуктор (angle gear) и муфту Haldex.", "Patikrinkite kampinį reduktorių (angle gear) ir Haldex sankabą."), { g: ["1. paaudze"] }),
    r(x("D5 dīzeļiem pārbaudi DPF, EGR un sprauslas.", "On the D5 diesels check the DPF, EGR and injectors.", "У дизелей D5 проверьте сажевый фильтр, EGR и форсунки.", "D5 dyzeliuose patikrinkite DPF, EGR ir purkštukus."), { g: ["1. paaudze"], f: "Dīzelis" }),
    r(x("Otrās paaudzes pneimatiskajai piekarei pārbaudi, vai auto stāvot nenoslīd.", "On the second generation's air suspension check that the car does not sink when parked.", "У пневмоподвески второго поколения проверьте, не проседает ли машина на стоянке.", "Antrosios kartos pneumatinę pakabą – patikrinkite, ar automobilis stovėdamas nenusileidžia."), { g: ["2. paaudze"] }),
    r(PHEV, { g: ["2. paaudze"], f: "Hibrīds" }),
  ],
  "Nissan|Qashqai": [
    r(x("J10: pārbaudi rūsu uz aizmugures arkām un slieksņiem; dīzeļiem – DPF un EGR.", "J10: check for rust on the rear arches and sills; on diesels the DPF and EGR.", "J10: проверьте ржавчину на задних арках и порогах; у дизелей — сажевый фильтр и EGR.", "J10: patikrinkite rūdis ant galinių arkų ir slenksčių; dyzeliuose – DPF ir EGR."), { g: ["J10"] }),
    r(x("J11 ar 1.2 DIG-T (apm. 2014–2018) var patērēt eļļu.", "The J11 with the 1.2 DIG-T (about 2014–2018) can burn oil.", "J11 с 1.2 DIG-T (примерно 2014–2018) может расходовать масло.", "J11 su 1.2 DIG-T (apie 2014–2018) gali naudoti alyvą."), { g: ["J11"], f: "Benzīns" }),
    r(CVT, { a: "Automāts" }),
    r(DIESEL, { g: ["J11"], f: "Dīzelis" }),
  ],
  "Mercedes-Benz|C klase": [
    r(x("W202/W203: pārbaudi rūsu uz arkām un slieksņiem un elektroinstalāciju.", "W202/W203: check for rust on the arches and sills, and the wiring.", "W202/W203: проверьте ржавчину на арках и порогах и электропроводку.", "W202/W203: patikrinkite rūdis ant arkų ir slenksčių bei elektros instaliaciją."), { g: ["W202", "W203"] }),
    r(x("W204 220/250 CDI (OM651, apm. 2008–2011): zināmas sprauslu problēmas.", "W204 220/250 CDI (OM651, about 2008–2011): known injector problems.", "W204 220/250 CDI (OM651, примерно 2008–2011): известные проблемы форсунок.", "W204 220/250 CDI (OM651, apie 2008–2011): žinomos purkštukų problemos."), { g: ["W204"], f: "Dīzelis" }),
    r(x("W204 ar M271 (1.8 Kompressor) benzīna dzinēju: klausies sadales ķēdes troksni.", "W204 with the M271 (1.8 Kompressor) petrol: listen for timing chain noise.", "W204 с бензиновым M271 (1.8 Kompressor): прислушайтесь к цепи ГРМ.", "W204 su M271 (1.8 Kompressor) benzininiu: klausykitės grandinės triukšmo."), { g: ["W204"], f: "Benzīns" }),
    r(x("W205: pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "W205: check that recalls and software updates have been done.", "W205: проверьте, выполнены ли отзывные кампании и обновления ПО.", "W205: patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), { g: ["W205"] }),
    r(PHEV, { g: ["W205", "W206"], f: "Hibrīds" }),
  ],
  "Opel|Astra": [
    r(x("Pārbaudi rūsu uz slieksņiem un aizmugures arkām; dīzeļiem – virpuļvārstus un EGR.", "Check for rust on the sills and rear arches; on diesels the swirl flaps and EGR.", "Проверьте ржавчину на порогах и задних арках; у дизелей — вихревые заслонки и EGR.", "Patikrinkite rūdis ant slenksčių ir galinių arkų; dyzeliuose – sūkurines sklendes ir EGR."), { g: ["G"] }),
    r(x("1.9 CDTI (Astra H): virpuļvārsti un EGR ir biežākās dīzeļa problēmas.", "1.9 CDTI (Astra H): swirl flaps and EGR are the usual diesel issues.", "1.9 CDTI (Astra H): заслонки впуска и EGR — типичные проблемы дизеля.", "1.9 CDTI (Astra H): sūkurinės sklendės ir EGR – dažniausios dyzelio problemos."), { g: ["H"], f: "Dīzelis" }),
    r(x("Pārbaudi sadales ķēdi (1.4/1.6 turbo benzīnam) un dzesēšanas sistēmu.", "Check the timing chain (1.4/1.6 turbo petrol) and the cooling system.", "Проверьте цепь ГРМ (1.4/1.6 турбо бензин) и систему охлаждения.", "Patikrinkite grandinę (1.4/1.6 turbo benzininiams) ir aušinimo sistemą."), { g: ["J", "K"], f: "Benzīns" }),
    r(M32, { g: ["H", "J"], a: "Manuāla" }),
    r(x("1.6 CDTI (J/K): pārbaudi sadales ķēdi, DPF un EGR.", "On the 1.6 CDTI (J/K) check the timing chain, DPF and EGR.", "У 1.6 CDTI (J/K) проверьте цепь ГРМ, сажевый фильтр и EGR.", "1.6 CDTI (J/K): patikrinkite grandinę, DPF ir EGR."), { g: ["J", "K"], f: "Dīzelis" }),
  ],
  "BMW|1. sērija": [
    r(N47, { y: [2007, 2015], f: "Dīzelis" }),
    r(B47, { y: [2015, NOW], f: "Dīzelis" }),
    r(x("2.0 turbo benzīnam (N20, apm. 2012–2015) pārbaudi sadales ķēdes nodilumu.", "On the 2.0 turbo petrol (N20, about 2012–2015) check for timing chain wear.", "У бензинового 2.0 турбо (N20, примерно 2012–2015) проверьте износ цепи ГРМ.", "2.0 turbo benzininiame (N20, apie 2012–2015) patikrinkite grandinės nusidėvėjimą."), { g: ["F20"], f: "Benzīns" }),
    r(x("Riepas bez gaisa (run-flat) padara braukšanu cietāku; pārbaudi riepu stāvokli un cenu.", "Run-flat tyres make the ride firmer; check their condition and replacement cost.", "Шины run-flat делают ход жёстче; проверьте их состояние и цену замены.", "Run-flat padangos daro važiavimą kietesnį; patikrinkite jų būklę ir kainą.")),
    r(x("F40 ar priekšpiedziņu: pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "F40 with front-wheel drive: check that recalls and software updates have been done.", "F40 с передним приводом: проверьте, выполнены ли отзывные кампании и обновления ПО.", "F40 su priekinių ratų pavara: patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), { g: ["F40"] }),
  ],
  "Audi|A3": [
    r(DQ200, { g: ["8P", "8V"], a: "Automāts" }),
    r(TSI14, { g: ["8P"], f: "Benzīns", y: [2008, 2012] }),
    r(x("2.0 TDI (CR): pārbaudi DPF un EGR; agrīnajiem 1.9 TDI – sprauslas.", "On the 2.0 TDI (CR) check the DPF and EGR; on the early 1.9 TDI the injectors.", "У 2.0 TDI (CR) проверьте сажевый фильтр и EGR; у ранних 1.9 TDI — форсунки.", "2.0 TDI (CR): patikrinkite DPF ir EGR; ankstyvuose 1.9 TDI – purkštukus."), { g: ["8P", "8V"], f: "Dīzelis" }),
    r(x("8L: pārbaudi rūsu un piekares detaļas; 1.8T – sadales siksni un eļļas noplūdes.", "8L: check for rust and the suspension parts; on the 1.8T the timing belt and oil leaks.", "8L: проверьте ржавчину и детали подвески; у 1.8T — ремень ГРМ и течи масла.", "8L: patikrinkite rūdis ir pakabos dalis; 1.8T – paskirstymo diržą ir alyvos nuotėkius."), { g: ["8L"] }),
    r(PHEV, { g: ["8V", "8Y"], f: "Hibrīds" }),
  ],
  "Opel|Insignia": [
    r(M32, { g: ["A"], a: "Manuāla" }),
    r(DMF, { g: ["A"] }),
    r(x("2.0 CDTI: pārbaudi DPF un EGR, pajautā par zobsiksnas maiņu; benzīna turbo versijām – eļļas patēriņu.", "On the 2.0 CDTI check the DPF and EGR and ask about the timing belt; on the turbo petrol the oil consumption.", "У 2.0 CDTI проверьте сажевый фильтр и EGR, спросите о замене ремня ГРМ; у бензинового турбо — расход масла.", "2.0 CDTI: patikrinkite DPF ir EGR, paklauskite apie paskirstymo diržo keitimą; turbo benzininėse – alyvos sąnaudas."), { g: ["A", "B"] }),
    r(x("Pārbaudi pilnpiedziņas (Haldex) sajūga eļļu un priekšējos gaismas elementus (AFL) – tie var būt dārgi.", "On AWD check the Haldex clutch oil; adaptive front lights (AFL) can be costly to repair.", "У полного привода проверьте масло муфты Haldex; адаптивные фары (AFL) могут быть дорогими в ремонте.", "Visų ratų pavarai patikrinkite Haldex sankabos alyvą; adaptyvūs žibintai (AFL) gali būti brangūs taisyti."), { g: ["A", "B"] }),
  ],
  "Škoda|Superb": [
    r(x("Pārbaudi rūsu uz slieksņiem un arkām; 1.9/2.0 TDI klausies sprauslu troksni.", "Check for rust on the sills and arches; on the 1.9/2.0 TDI listen for injector noise.", "Проверьте ржавчину на порогах и арках; у 1.9/2.0 TDI прислушайтесь к форсункам.", "Patikrinkite rūdis ant slenksčių ir arkų; 1.9/2.0 TDI klausykitės purkštukų triukšmo."), { g: ["3U"] }),
    r(DQ200, { g: ["3T", "3V"], a: "Automāts" }),
    r(TSI14, { g: ["3T"], f: "Benzīns", y: [2008, 2012] }),
    r(x("2.0 TDI: pārbaudi DPF, EGR un eļļas siltummaini.", "On the 2.0 TDI check the DPF, EGR and the oil cooler.", "У 2.0 TDI проверьте сажевый фильтр, EGR и масляный радиатор.", "2.0 TDI: patikrinkite DPF, EGR ir alyvos aušintuvą."), { g: ["3T", "3V"], f: "Dīzelis" }),
    r(PHEV, { g: ["3V", "B9"], f: "Hibrīds" }),
  ],
  "BMW|X1": [
    r(N47, { y: [2009, 2015], f: "Dīzelis" }),
    r(B47, { y: [2015, NOW], f: "Dīzelis" }),
    r(x("2.0 turbo benzīnam (N20, apm. 2011–2015) pārbaudi sadales ķēdes nodilumu.", "On the 2.0 turbo petrol (N20, about 2011–2015) check for timing chain wear.", "У бензинового 2.0 турбо (N20, примерно 2011–2015) проверьте износ цепи ГРМ.", "2.0 turbo benzininiame (N20, apie 2011–2015) patikrinkite grandinės nusidėvėjimą."), { g: ["E84"], f: "Benzīns" }),
    r(x("Pilnpiedziņas xDrive versijām pārbaudi sadales kārbu un aizmugures diferenciāli.", "On xDrive versions check the transfer case and rear differential.", "У xDrive проверьте раздаточную коробку и задний дифференциал.", "xDrive versijose patikrinkite skirstymo dėžę ir galinį diferencialą."), { g: ["E84", "F48"] }),
    r(PHEV, { g: ["F48", "U11"], f: "Hibrīds" }),
  ],
  "Volvo|V60": [
    r(DIESEL, { g: ["1. paaudze"], f: "Dīzelis" }),
    r(HALDEX, { g: ["1. paaudze"] }),
    r(x("D6 un T6 plug-in hibrīdiem pārbaudi akumulatoru un to, vai lādēšana strādā.", "On the D6 and T6 plug-in hybrids check the battery and that charging works.", "У plug-in гибридов D6 и T6 проверьте батарею и работу зарядки.", "D6 ir T6 plug-in hibriduose patikrinkite bateriją ir ar veikia įkrovimas."), { g: ["1. paaudze", "2. paaudze"], f: "Hibrīds" }),
    r(ELEC, { g: ["2. paaudze"] }),
  ],
  "Volvo|V70": [
    r(x("P2 automātiskajai kārbai AW55 pārbaudi, vai pārslēgšanās ir gluda.", "On the P2's AW55 automatic check that shifts are smooth.", "У автомата AW55 (P2) проверьте плавность переключений.", "P2 automatinėje AW55 dėžėje patikrinkite, ar pavaros perjungiamos sklandžiai."), { g: ["P2"], a: "Automāts" }),
    r(x("Pilnpiedziņas versijām pārbaudi leņķa reduktoru (angle gear) un Haldex sajūgu.", "On all-wheel-drive cars check the angle gear and Haldex coupling.", "У полноприводных проверьте угловой редуктор (angle gear) и муфту Haldex.", "Visų ratų pavaros versijose patikrinkite kampinį reduktorių (angle gear) ir Haldex sankabą."), { g: ["P2", "P3"] }),
    r(x("D5 dīzeļiem pārbaudi DPF, EGR un sprauslas.", "On the D5 diesels check the DPF, EGR and injectors.", "У дизелей D5 проверьте сажевый фильтр, EGR и форсунки.", "D5 dyzeliuose patikrinkite DPF, EGR ir purkštukus."), { g: ["P3"], f: "Dīzelis" }),
    r(RUST, { g: ["1. paaudze", "P2"] }),
  ],
  "Volkswagen|Touran": [
    r(DQ200, { g: ["1T", "5T"], a: "Automāts" }),
    r(TSI14, { g: ["1T"], f: "Benzīns", y: [2007, 2012] }),
    r(x("1.9/2.0 TDI: pārbaudi sprauslas (PD) un DPF, dīzeļiem arī sadales siksnu.", "On the 1.9/2.0 TDI check the (PD) injectors and DPF, and the timing belt.", "У 1.9/2.0 TDI проверьте форсунки (PD), сажевый фильтр и ремень ГРМ.", "1.9/2.0 TDI: patikrinkite purkštukus (PD), DPF ir paskirstymo diržą."), { g: ["1T"], f: "Dīzelis" }),
    r(x("Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "Check that recalls and software updates have been done.", "Проверьте, выполнены ли отзывные кампании и обновления ПО.", "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), { g: ["5T"] }),
  ],
  "Kia|Sportage": [
    r(RUST, { g: ["KM", "SL"] }),
    r(x("2.0 CRDi dīzeļiem pārbaudi DPF, EGR un sprauslas.", "On the 2.0 CRDi diesels check the DPF, EGR and injectors.", "У дизелей 2.0 CRDi проверьте сажевый фильтр, EGR и форсунки.", "2.0 CRDi dyzeliuose patikrinkite DPF, EGR ir purkštukus."), { g: ["SL", "QL"], f: "Dīzelis" }),
    r(x("7 pakāpju DCT kārbai pārbaudi raustīšanos lēnā braukšanā.", "On the 7-speed DCT check for judder at low speed.", "У 7-ступенчатого DCT проверьте рывки на малой скорости.", "7 pavarų DCT patikrinkite trūkčiojimą važiuojant lėtai."), { g: ["QL", "NQ5"], a: "Automāts" }),
    r(x("1.6 GDI/T-GDI benzīna dzinējiem pārbaudi eļļas patēriņu.", "On the 1.6 GDI/T-GDI petrol engines check the oil consumption.", "У бензиновых 1.6 GDI/T-GDI проверьте расход масла.", "1.6 GDI/T-GDI benzininiuose patikrinkite alyvos sąnaudas."), { g: ["SL", "QL"], f: "Benzīns" }),
  ],
  "Peugeot|3008": [
    r(x("1.6 THP benzīnam (apm. 2009–2015) pārbaudi sadales ķēdi un eļļas patēriņu.", "On the 1.6 THP petrol (about 2009–2015) check the timing chain and oil consumption.", "У бензинового 1.6 THP (примерно 2009–2015) проверьте цепь ГРМ и расход масла.", "1.6 THP benzininiame (apie 2009–2015) patikrinkite grandinę ir alyvos sąnaudas."), { g: ["1. paaudze"], f: "Benzīns" }),
    r(x("1.6 HDi dīzeļiem pārbaudi sprauslas, DPF un sadales siksnu.", "On the 1.6 HDi diesels check the injectors, DPF and timing belt.", "У дизелей 1.6 HDi проверьте форсунки, сажевый фильтр и ремень ГРМ.", "1.6 HDi dyzeliuose patikrinkite purkštukus, DPF ir paskirstymo diržą."), { g: ["1. paaudze"], f: "Dīzelis" }),
    r(PURETECH, { g: ["2. paaudze", "3. paaudze"], f: "Benzīns" }),
    r(x("EAT6/EAT8 automātiskajai kārbai pajautā par eļļas maiņu.", "On the EAT6/EAT8 automatic ask about oil changes.", "У автомата EAT6/EAT8 спросите о замене масла.", "EAT6/EAT8 automatinei dėžei paklauskite apie alyvos keitimą."), { g: ["2. paaudze", "3. paaudze"], a: "Automāts" }),
    r(PHEV, { g: ["2. paaudze", "3. paaudze"], f: "Hibrīds" }),
  ],
  "Toyota|Avensis": [
    r(x("2.2 D-4D dīzeļiem (T25/T27) zināmas galvas blīves problēmas.", "The 2.2 D-4D diesel (T25/T27) has known head gasket issues.", "У дизеля 2.2 D-4D (T25/T27) известны проблемы с прокладкой ГБЦ.", "2.2 D-4D dyzelis (T25/T27) turi žinomų galvutės tarpinės problemų."), { g: ["T25", "T27"], f: "Dīzelis" }),
    r(x("1.8/2.0 benzīna dzinējiem pārbaudi eļļas patēriņu un sadales ķēdi.", "On the 1.8/2.0 petrol engines check oil consumption and the timing chain.", "У бензиновых 1.8/2.0 проверьте расход масла и цепь ГРМ.", "1.8/2.0 benzininiuose patikrinkite alyvos sąnaudas ir grandinę."), { g: ["T25", "T27"], f: "Benzīns" }),
    r(RUST, { g: ["T22"] }),
    r(x("Multidrive S (CVT) kārbai pārbaudi, vai nav kaukšanas un raustīšanās.", "On the Multidrive S (CVT) check for whining or judder.", "У Multidrive S (CVT) проверьте, нет ли воя и рывков.", "Multidrive S (CVT) patikrinkite, ar nėra kaukimo ir trūkčiojimo."), { g: ["T27"], a: "Automāts" }),
  ],
  "Audi|Q7": [
    r(AIR, { g: ["4L", "4M"] }),
    r(x("Agrīnajiem 3.0 TDI (apm. 2005–2008) sadales ķēdes ir motora aizmugurē – klausies troksni.", "On early 3.0 TDI (about 2005–2008) the timing chains are at the back of the engine – listen for noise.", "У ранних 3.0 TDI (примерно 2005–2008) цепи ГРМ сзади мотора — прислушайтесь к шуму.", "Ankstyvuose 3.0 TDI (apie 2005–2008) grandinės variklio gale – klausykitės triukšmo."), { g: ["4L"], f: "Dīzelis" }),
    r(x("4.2 FSI/TDI V8 (4L): dārgs remonts – pārbaudi eļļas noplūdes un apkopju vēsturi.", "On the 4.2 FSI/TDI V8 (4L) repairs are expensive – check oil leaks and the service history.", "У 4.2 FSI/TDI V8 (4L) ремонт дорогой — проверьте течи масла и историю обслуживания.", "4.2 FSI/TDI V8 (4L): remontas brangus – patikrinkite alyvos nuotėkius ir priežiūros istoriją."), { g: ["4L"] }),
    r(PHEV, { g: ["4L", "4M"], f: "Hibrīds" }),
    r(DIESEL, { g: ["4M"], f: "Dīzelis" }),
  ],
  "Škoda|Kodiaq": [
    r(DSGOIL, { a: "Automāts" }),
    r(HALDEX, { g: ["1. paaudze", "2. paaudze"] }),
    r(x("2.0 TDI: pārbaudi DPF, EGR un eļļas siltummaini.", "On the 2.0 TDI check the DPF, EGR and the oil cooler.", "У 2.0 TDI проверьте сажевый фильтр, EGR и масляный радиатор.", "2.0 TDI: patikrinkite DPF, EGR ir alyvos aušintuvą."), { f: "Dīzelis" }),
    r(PHEV, { f: "Hibrīds" }),
  ],
  "Toyota|C-HR": [
    r(HYBRID, { f: "Hibrīds" }),
    r(x("1.2 turbo benzīna versija ir retāka; hibrīds parasti ir uzticamākā izvēle.", "The 1.2 turbo petrol is rarer; the hybrid is usually the more reliable choice.", "Бензиновая 1.2 турбо встречается реже; гибрид обычно надёжнее.", "1.2 turbo benzininė versija retesnė; hibridas paprastai patikimesnis."), { g: ["1. paaudze"], f: "Benzīns" }),
    r(x("Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "Check that recalls and software updates have been done.", "Проверьте, выполнены ли отзывные кампании и обновления ПО.", "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai.")),
  ],
  "BMW|7. sērija": [
    r(AIR, { g: ["E65/E66", "F01/F02", "G11/G12", "G70"] }),
    r(x("4.4 V8 (N63) benzīna dzinējs mēdz patērēt daudz eļļas un tam ir dārgas turbīnas.", "The 4.4 V8 (N63) petrol is known for oil consumption and costly turbos.", "Бензиновый 4.4 V8 (N63) известен расходом масла и дорогими турбинами.", "4.4 V8 (N63) benzininis garsėja alyvos sąnaudomis ir brangiomis turbinomis."), { g: ["F01/F02", "G11/G12"], f: "Benzīns" }),
    r(x("E65/E66: iDrive un elektronika var būt nepilnīga – pārbaudi visas funkcijas un kļūdu kodus.", "E65/E66: iDrive and the electronics can be faulty – check every function and the fault codes.", "E65/E66: iDrive и электроника могут быть неисправны — проверьте все функции и коды ошибок.", "E65/E66: iDrive ir elektronika gali būti sugedusi – patikrinkite visas funkcijas ir klaidų kodus."), { g: ["E65/E66"] }),
    r(x("Pārbaudi dzesēšanas sistēmu un eļļas noplūdes; dīzeļiem – sadales ķēdi un DPF.", "Check the cooling system and oil leaks; on diesels the timing chain and DPF.", "Проверьте систему охлаждения и течи масла; у дизелей — цепь ГРМ и сажевый фильтр.", "Patikrinkite aušinimo sistemą ir alyvos nuotėkius; dyzeliuose – grandinę ir DPF."), { g: ["F01/F02", "G11/G12"] }),
    r(PHEV, { g: ["G11/G12", "G70"], f: "Hibrīds" }),
    r(ELEC, {}),
  ],
  "Ford|Focus": [
    r(x("Mk3 ar 6 pakāpju Powershift automātu: zināmas sajūga raustīšanās problēmas.", "Mk3 with the six-speed Powershift automatic: known clutch judder problems.", "Mk3 с 6-ступенчатым Powershift: известны рывки сцепления.", "Mk3 su 6 pavarų Powershift: žinomos sankabos trūkčiojimo problemos."), { g: ["Mk3"], a: "Automāts" }),
    r(x("1.0 EcoBoost (apm. 2012–2015): pārbaudi dzesēšanas sistēmu un atsaukumus.", "1.0 EcoBoost (about 2012–2015): check the cooling system and recalls.", "1.0 EcoBoost (примерно 2012–2015): проверьте систему охлаждения и отзывы.", "1.0 EcoBoost (apie 2012–2015): patikrinkite aušinimo sistemą ir atšaukimus."), { g: ["Mk3"], f: "Benzīns" }),
    r(x("Mk1/Mk2: pārbaudi rūsu uz slieksņiem un arkām; 1.6 TDCi – sprauslas un turbīnu.", "Mk1/Mk2: check for rust on the sills and arches; on the 1.6 TDCi the injectors and turbo.", "Mk1/Mk2: проверьте ржавчину на порогах и арках; у 1.6 TDCi — форсунки и турбину.", "Mk1/Mk2: patikrinkite rūdis ant slenksčių ir arkų; 1.6 TDCi – purkštukus ir turbiną."), { g: ["Mk1", "Mk2"] }),
    r(DMF, { g: ["Mk2", "Mk3"], f: "Dīzelis" }),
  ],
  "Volkswagen|Transporter": [
    r(DMF, { g: ["T5", "T6"] }),
    r(RUST, { g: ["T4", "T5"] }),
    r(x("2.5 TDI (T5, apm. 2003–2009): pārbaudi sprauslas un sadales siksni; klausies motora troksni.", "On the 2.5 TDI (T5, about 2003–2009) check the injectors and timing belt; listen to the engine.", "У 2.5 TDI (T5, примерно 2003–2009) проверьте форсунки и ремень ГРМ; прислушайтесь к мотору.", "2.5 TDI (T5, apie 2003–2009): patikrinkite purkštukus ir paskirstymo diržą; klausykitės variklio."), { g: ["T5"], f: "Dīzelis" }),
    r(DSGOIL, { g: ["T5", "T6"], a: "Automāts" }),
    r(x("Pārbaudi, vai nav rūsas uz nesošajām daļām, un vai auto nav izmantots kā smagā darba furgons.", "Check for rust on structural parts and whether the van was used for heavy work.", "Проверьте ржавчину на несущих элементах и не использовался ли фургон на тяжёлых работах.", "Patikrinkite rūdis ant laikančių dalių ir ar furgonas nebuvo naudotas sunkiems darbams.")),
  ],
  "Toyota|Corolla": [
    r(x("1.4/1.6 benzīna (ZZ dzinēji, apm. 2000–2008) var patērēt eļļu.", "The 1.4/1.6 petrols (ZZ engines, about 2000–2008) can burn oil.", "Бензиновые 1.4/1.6 (моторы ZZ, примерно 2000–2008) могут расходовать масло.", "1.4/1.6 benzininiai (ZZ varikliai, apie 2000–2008) gali naudoti alyvą."), { g: ["E120"], f: "Benzīns" }),
    r(MMT, { g: ["E120", "E150"], a: "Automāts" }),
    r(x("1.4 D-4D dīzelim pārbaudi sprauslas un turbīnu; 1.6/1.8 Valvematic – eļļas patēriņu.", "On the 1.4 D-4D diesel check the injectors and turbo; on the 1.6/1.8 Valvematic the oil consumption.", "У дизеля 1.4 D-4D проверьте форсунки и турбину; у 1.6/1.8 Valvematic — расход масла.", "1.4 D-4D dyzelyje patikrinkite purkštukus ir turbiną; 1.6/1.8 Valvematic – alyvos sąnaudas."), { g: ["E150", "E170"] }),
    r(HYBRID, { g: ["E170", "E210"], f: "Hibrīds" }),
    r(CVT, { g: ["E170"], a: "Automāts" }),
  ],
  "Toyota|Yaris": [
    r(MMT, { g: ["XP90", "XP130"], a: "Automāts" }),
    r(x("1.4 D-4D dīzelim pārbaudi sprauslas un turbīnu; 1.3 VVT-i – eļļas patēriņu.", "On the 1.4 D-4D diesel check the injectors and turbo; on the 1.3 VVT-i the oil consumption.", "У дизеля 1.4 D-4D проверьте форсунки и турбину; у 1.3 VVT-i — расход масла.", "1.4 D-4D dyzelyje patikrinkite purkštukus ir turbiną; 1.3 VVT-i – alyvos sąnaudas."), { g: ["XP90"] }),
    r(HYBRID, { g: ["XP130", "XP210"], f: "Hibrīds" }),
    r(RUST, { g: ["XP10", "XP90"] }),
    r(x("Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "Check that recalls and software updates have been done.", "Проверьте, выполнены ли отзывные кампании и обновления ПО.", "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), { g: ["XP210"] }),
  ],
  "Mercedes-Benz|Sprinter": [
    r(RUST, {}),
    r(x("OM651 dīzeļiem (apm. 2009–2011) zināmas sprauslu problēmas.", "OM651 diesels (about 2009–2011) have known injector problems.", "У дизелей OM651 (примерно 2009–2011) известны проблемы форсунок.", "OM651 dyzeliai (apie 2009–2011) turi žinomų purkštukų problemų."), { g: ["W906"], f: "Dīzelis" }),
    r(x("T1N (2.2/2.7 CDI): pārbaudi sprauslas, turbīnu un rūsu uz kuģa un durvīm.", "T1N (2.2/2.7 CDI): check the injectors, turbo and rust on the body and doors.", "T1N (2.2/2.7 CDI): проверьте форсунки, турбину и ржавчину на кузове и дверях.", "T1N (2.2/2.7 CDI): patikrinkite purkštukus, turbiną ir rūdis ant kėbulo ir durų."), { g: ["T1N"] }),
    r(x("Pārbaudi nobraukumu pret stāvokli: komerciālie auto bieži braukti intensīvi.", "Compare mileage with condition: commercial vehicles are often driven hard.", "Сравните пробег с состоянием: коммерческие машины часто эксплуатируются интенсивно.", "Palyginkite rida su būkle: komerciniai automobiliai dažnai intensyviai naudojami.")),
  ],
  "Volkswagen|Touareg": [
    r(AIR, { g: ["7L", "7P", "CR"] }),
    r(x("Pirmās paaudzes 2.5 R5 TDI dzinējs ir vājākais – priekšroka V6 TDI.", "The first generation's 2.5 R5 TDI is the weakest engine – prefer the V6 TDI.", "У первого поколения 2.5 R5 TDI — самый слабый мотор; лучше V6 TDI.", "Pirmosios kartos 2.5 R5 TDI – silpniausias variklis; geriau V6 TDI."), { g: ["7L"], f: "Dīzelis" }),
    r(x("3.0 TDI V6 (7P): pārbaudi sadales ķēdi, DPF un eļļas patēriņu.", "On the 3.0 TDI V6 (7P) check the timing chain, DPF and oil consumption.", "У 3.0 TDI V6 (7P) проверьте цепь ГРМ, сажевый фильтр и расход масла.", "3.0 TDI V6 (7P): patikrinkite grandinę, DPF ir alyvos sąnaudas."), { g: ["7P"], f: "Dīzelis" }),
    r(x("Pārbaudi reduktoru un pilnpiedziņas sistēmu; troksnis vai vibrācija ir brīdinājums.", "Check the transfer case and AWD system; noise or vibration is a warning sign.", "Проверьте раздатку и систему полного привода; шум или вибрация — тревожный признак.", "Patikrinkite skirstymo dėžę ir visų ratų pavaros sistemą; triukšmas ar vibracija yra perspėjimas."), { g: ["7L", "7P"] }),
    r(PHEV, { g: ["CR"], f: "Hibrīds" }),
  ],
  "Opel|Zafira": [
    r(x("Zafira B: pārbaudi, vai izpildīts atsaukums par salona ventilatora rezistoru (aizdegšanās risks).", "Zafira B: check that the recall for the heater blower resistor (fire risk) was done.", "Zafira B: проверьте, выполнен ли отзыв по резистору вентилятора печки (риск возгорания).", "Zafira B: patikrinkite, ar atliktas atšaukimas dėl salono ventiliatoriaus rezistoriaus (gaisro rizika)."), { g: ["B"] }),
    r(M32, { g: ["B", "C (Tourer)"], a: "Manuāla" }),
    r(x("1.9 CDTI dīzeļiem pārbaudi virpuļvārstus un EGR.", "On the 1.9 CDTI diesels check the swirl flaps and EGR.", "У дизелей 1.9 CDTI проверьте вихревые заслонки и EGR.", "1.9 CDTI dyzeliuose patikrinkite sūkurines sklendes ir EGR."), { g: ["B"], f: "Dīzelis" }),
    r(x("1.4 turbo benzīnam pārbaudi dzesēšanas sistēmu un eļļas patēriņu; 2.0 CDTI – DPF un zobsiksnas maiņu.", "On the 1.4 turbo petrol check the cooling system and oil consumption; on the 2.0 CDTI the DPF and timing belt.", "У бензинового 1.4 турбо проверьте систему охлаждения и расход масла; у 2.0 CDTI — сажевый фильтр и ремень ГРМ.", "1.4 turbo benzininiame patikrinkite aušinimo sistemą ir alyvos sąnaudas; 2.0 CDTI – DPF ir paskirstymo diržą."), { g: ["C (Tourer)"] }),
    r(RUST, { g: ["A"] }),
  ],
  "Volkswagen|Caddy": [
    r(DSGOIL, { g: ["Mk3 (2K)", "Mk4", "Mk5"], a: "Automāts" }),
    r(DIESEL, { f: "Dīzelis" }),
    r(RUST, { g: ["Mk2", "Mk3 (2K)"] }),
    r(x("2.0 TDI (CR): pārbaudi sprauslas un eļļas siltummaini.", "On the 2.0 TDI (CR) check the injectors and the oil cooler.", "У 2.0 TDI (CR) проверьте форсунки и масляный радиатор.", "2.0 TDI (CR): patikrinkite purkštukus ir alyvos aušintuvą."), { g: ["Mk3 (2K)", "Mk4"], f: "Dīzelis" }),
    r(x("Pārbaudi, vai auto nav izmantots kā darba furgons: nolietojums, bīdāmās durvis un grīda.", "Check whether the van was used for work: wear, sliding doors and floor.", "Проверьте, не использовался ли фургон для работы: износ, сдвижные двери и пол.", "Patikrinkite, ar furgonas nebuvo naudotas darbui: dėvėjimasis, slankiojančios durys ir grindys.")),
  ],
  "Honda|CR-V": [
    r(x("Pilnpiedziņai pajautā par aizmugures diferenciāļa šķidruma maiņu (vaimanāšana pagriezienos).", "For all-wheel drive ask about rear differential fluid changes (groaning in turns).", "Для полного привода спросите о замене жидкости заднего дифференциала (гул в поворотах).", "Visų ratų pavarai paklauskite apie galinio diferencialo skysčio keitimą (ūžimas posūkiuose).")),
    r(x("2.2 i-CTDi dīzelim pārbaudi sadales ķēdi un EGR; benzīna 2.0 – eļļas noplūdes.", "On the 2.2 i-CTDi diesel check the timing chain and EGR; on the 2.0 petrol oil leaks.", "У дизеля 2.2 i-CTDi проверьте цепь ГРМ и EGR; у бензинового 2.0 — течи масла.", "2.2 i-CTDi dyzelyje patikrinkite grandinę ir EGR; 2.0 benzininiame – alyvos nuotėkius."), { g: ["3. paaudze", "4. paaudze"] }),
    r(x("1.6 i-DTEC dīzelim pārbaudi DPF un EGR, īpaši pilsētas braukšanā.", "On the 1.6 i-DTEC diesel check the DPF and EGR, especially after city driving.", "У дизеля 1.6 i-DTEC проверьте сажевый фильтр и EGR, особенно при городской езде.", "1.6 i-DTEC dyzelyje patikrinkite DPF ir EGR, ypač po važinėjimo mieste."), { g: ["4. paaudze"], f: "Dīzelis" }),
    r(RUST, { g: ["2. paaudze", "3. paaudze"] }),
    r(HYBRID, { g: ["5. paaudze", "6. paaudze"], f: "Hibrīds" }),
  ],
  "Toyota|Auris": [
    r(MMT, { g: ["E150"], a: "Automāts" }),
    r(x("1.4 D-4D un 2.0 D-4D dīzeļiem pārbaudi sprauslas, turbīnu un DPF.", "On the 1.4 D-4D and 2.0 D-4D diesels check the injectors, turbo and DPF.", "У дизелей 1.4 D-4D и 2.0 D-4D проверьте форсунки, турбину и сажевый фильтр.", "1.4 D-4D ir 2.0 D-4D dyzeliuose patikrinkite purkštukus, turbiną ir DPF."), { f: "Dīzelis" }),
    r(x("1.6 Valvematic benzīnam pārbaudi eļļas patēriņu.", "On the 1.6 Valvematic petrol check the oil consumption.", "У бензинового 1.6 Valvematic проверьте расход масла.", "1.6 Valvematic benzininiame patikrinkite alyvos sąnaudas."), { f: "Benzīns" }),
    r(HYBRID, { g: ["E180"], f: "Hibrīds" }),
  ],
  "Peugeot|308": [
    r(x("1.6 THP benzīnam (apm. 2007–2015) pārbaudi sadales ķēdi un eļļas patēriņu.", "On the 1.6 THP petrol (about 2007–2015) check the timing chain and oil consumption.", "У бензинового 1.6 THP (примерно 2007–2015) проверьте цепь ГРМ и расход масла.", "1.6 THP benzininiame (apie 2007–2015) patikrinkite grandinę ir alyvos sąnaudas."), { g: ["T7", "T9"], f: "Benzīns" }),
    r(x("1.2 PureTech (apm. 2014–2022) zobsiksna darbojas eļļā un nolietojas ātrāk – pajautā, kad mainīta.", "The 1.2 PureTech (about 2014–2022) has a wet timing belt that wears early – ask when it was replaced.", "У 1.2 PureTech (примерно 2014–2022) ремень ГРМ работает в масле и быстро изнашивается — спросите, когда меняли.", "1.2 PureTech (apie 2014–2022) paskirstymo diržas veikia alyvoje ir greičiau dyla – paklauskite, kada keistas."), { g: ["T9", "P5"], f: "Benzīns" }),
    r(x("1.6 HDi/BlueHDi dīzeļiem pārbaudi sprauslas, DPF un EGR.", "On the 1.6 HDi/BlueHDi diesels check the injectors, DPF and EGR.", "У дизелей 1.6 HDi/BlueHDi проверьте форсунки, сажевый фильтр и EGR.", "1.6 HDi/BlueHDi dyzeliuose patikrinkite purkštukus, DPF ir EGR."), { f: "Dīzelis" }),
    r(x("EAT6/EAT8 automātiskajai kārbai pajautā par eļļas maiņu.", "On the EAT6/EAT8 automatic ask about oil changes.", "У автомата EAT6/EAT8 спросите о замене масла.", "EAT6/EAT8 automatinei dėžei paklauskite apie alyvos keitimą."), { g: ["T9", "P5"], a: "Automāts" }),
  ],
  "Lexus|RX": [
    r(HYBRID, { f: "Hibrīds" }),
    r(x("RX 400h: pārbaudi, vai izpildīti atsaukumi (piem. invertora dzesēšanas sūknis).", "RX 400h: check that recalls were done (e.g. the inverter cooling pump).", "RX 400h: проверьте выполнение отзывов (например, помпа охлаждения инвертора).", "RX 400h: patikrinkite, ar atlikti atšaukimai (pvz., inverterio aušinimo pompa)."), { g: ["XU30"], f: "Hibrīds" }),
    r(x("Pārbaudi pneimatisko piekari (ja ir), eļļas noplūdes un gaismas elementus.", "Check the air suspension (if fitted), oil leaks and the lights.", "Проверьте пневмоподвеску (если есть), течи масла и фары.", "Patikrinkite pneumatinę pakabą (jei yra), alyvos nuotėkius ir žibintus."), { g: ["XU30", "AL10"] }),
    r(x("Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "Check that recalls and software updates have been done.", "Проверьте, выполнены ли отзывные кампании и обновления ПО.", "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), { g: ["AL20", "5. paaudze"] }),
  ],
  "Porsche|Cayenne": [
    r(x("Pirmās paaudzes V8: plastmasas dzesēšanas caurules zem ieplūdes kolektora mēdz tecēt.", "First-generation V8: the plastic coolant pipes under the intake manifold tend to leak.", "V8 первого поколения: пластиковые патрубки охлаждения под впуском склонны течь.", "Pirmosios kartos V8: plastikiniai aušinimo vamzdžiai po įsiurbimo kolektoriumi linkę tekėti."), { g: ["9PA (E1)"], f: "Benzīns" }),
    r(AIR, {}),
    r(x("S Hybrid un E-Hybrid: pārbaudi akumulatoru, lādēšanu un apkopju vēsturi.", "On the S Hybrid and E-Hybrid check the battery, charging and the service history.", "У S Hybrid и E-Hybrid проверьте батарею, зарядку и историю обслуживания.", "S Hybrid ir E-Hybrid: patikrinkite bateriją, įkrovimą ir priežiūros istoriją."), { f: "Hibrīds" }),
    r(x("Dīzeļiem pārbaudi DPF, EGR un sadales ķēdes (V6/V8 TDI).", "On diesels check the DPF, EGR and timing chains (V6/V8 TDI).", "У дизелей проверьте сажевый фильтр, EGR и цепи ГРМ (V6/V8 TDI).", "Dyzeliuose patikrinkite DPF, EGR ir grandines (V6/V8 TDI)."), { g: ["9PA (E1)", "92A (E2)"], f: "Dīzelis" }),
    r(x("Pārbaudi pilnpiedziņas sajūgu un sadales kārbu – klikšķi vai raustīšanās ir brīdinājums.", "Check the AWD clutch and transfer case – clicking or jerking is a warning sign.", "Проверьте муфту полного привода и раздатку — щелчки или рывки — тревожный признак.", "Patikrinkite visų ratų pavaros sankabą ir skirstymo dėžę – spragsėjimas ar trūkčiojimas yra perspėjimas."), {}),
  ],
  "Ford|Transit": [
    r(RUST, {}),
    r(DMF, { g: ["Mk7", "Mk8"] }),
    r(x("2.2/2.4 TDCi (Mk7): pārbaudi sprauslas, turbīnu un sadales ķēdi/siksnu.", "On the 2.2/2.4 TDCi (Mk7) check the injectors, turbo and timing chain/belt.", "У 2.2/2.4 TDCi (Mk7) проверьте форсунки, турбину и цепь/ремень ГРМ.", "2.2/2.4 TDCi (Mk7): patikrinkite purkštukus, turbiną ir grandinę/diržą."), { g: ["Mk7"], f: "Dīzelis" }),
    r(x("2.0 EcoBlue (Mk8): pārbaudi eļļas siltummaini, dzesēšanas sistēmu un sadales siksnu eļļā.", "On the 2.0 EcoBlue (Mk8) check the oil cooler, the cooling system and the wet-belt condition.", "У 2.0 EcoBlue (Mk8) проверьте масляный радиатор, систему охлаждения и состояние ремня в масле.", "2.0 EcoBlue (Mk8): patikrinkite alyvos aušintuvą, aušinimo sistemą ir diržo būklę alyvoje."), { g: ["Mk8"], f: "Dīzelis" }),
    r(x("Pārbaudi, vai nav rūsas uz grīdas, durvīm un aizmugures ass stiprinājumiem; nobraukums komerciāliem auto parasti liels.", "Check for rust on the floor, doors and rear axle mounts; commercial vans usually have high mileage.", "Проверьте ржавчину на полу, дверях и креплениях задней оси; пробег у коммерческих машин обычно большой.", "Patikrinkite rūdis ant grindų, durų ir galinės ašies tvirtinimų; komercinių automobilių rida paprastai didelė.")),
  ],
  "Jeep|Grand Cherokee": [
    r(x("WK2 Quadra-Lift pneimatiskā piekare ir dārga remontā.", "The WK2's Quadra-Lift air suspension is costly to repair.", "Пневмоподвеска Quadra-Lift у WK2 дорогая в ремонте.", "WK2 Quadra-Lift pneumatinė pakaba brangi taisyti."), { g: ["WK2", "WL"] }),
    r(x("3.0 CRD dīzelim pārbaudi sadales ķēdi, DPF un EGR.", "On the 3.0 CRD diesel check the timing chain, DPF and EGR.", "У дизеля 3.0 CRD проверьте цепь ГРМ, сажевый фильтр и EGR.", "3.0 CRD dyzelyje patikrinkite grandinę, DPF ir EGR."), { f: "Dīzelis" }),
    r(x("3.6 Pentastar V6: pārbaudi eļļas noplūdes un dzesēšanas sistēmu.", "On the 3.6 Pentastar V6 check for oil leaks and the cooling system.", "У 3.6 Pentastar V6 проверьте течи масла и систему охлаждения.", "3.6 Pentastar V6: patikrinkite alyvos nuotėkius ir aušinimo sistemą."), { g: ["WK2"], f: "Benzīns" }),
    r(x("Pārbaudi elektroniku, reduktoru un pilnpiedziņas darbību; ASV tirgus auto bieži ar vēsturi.", "Check the electronics, the transfer case and the AWD system; US-market cars often have a history.", "Проверьте электронику, раздатку и полный привод; машины с рынка США часто имеют историю.", "Patikrinkite elektroniką, skirstymo dėžę ir visų ratų pavarą; JAV rinkos automobiliai dažnai turi istoriją."), {}),
  ],
  "Mercedes-Benz|S klase": [
    r(AIR, { g: ["W220", "W221", "W222"] }),
    r(ELEC, {}),
    r(x("W220/W221: pārbaudi, vai Airmatic/ABC piekare, kompresors un vadības bloki darbojas bez kļūdām.", "W220/W221: check that the Airmatic/ABC suspension, compressor and control units work without faults.", "W220/W221: проверьте, что подвеска Airmatic/ABC, компрессор и блоки управления работают без ошибок.", "W220/W221: patikrinkite, ar Airmatic/ABC pakaba, kompresorius ir valdymo blokai veikia be klaidų."), { g: ["W220", "W221"] }),
    r(x("Dīzeļiem pārbaudi DPF un EGR; V8 benzīna versijām – eļļas noplūdes un dzesēšanu.", "On diesels check the DPF and EGR; on V8 petrol cars oil leaks and cooling.", "У дизелей проверьте сажевый фильтр и EGR; у V8 бензиновых — течи масла и охлаждение.", "Dyzeliuose patikrinkite DPF ir EGR; V8 benzininėse – alyvos nuotėkius ir aušinimą."), { g: ["W221", "W222"] }),
    r(PHEV, { g: ["W222", "W223"], f: "Hibrīds" }),
  ],
  "Hyundai|Tucson": [
    r(x("7 pakāpju DCT kārbai pārbaudi raustīšanos lēnā braukšanā.", "On the 7-speed DCT check for judder at low speed.", "У 7-ступенчатого DCT проверьте рывки на малой скорости.", "7 pavarų DCT patikrinkite trūkčiojimą važiuojant lėtai."), { g: ["TL", "NX4"], a: "Automāts" }),
    r(x("1.6 GDI/T-GDI benzīna dzinējiem pārbaudi eļļas patēriņu un sadales ķēdi.", "On the 1.6 GDI/T-GDI petrol engines check the oil consumption and timing chain.", "У бензиновых 1.6 GDI/T-GDI проверьте расход масла и цепь ГРМ.", "1.6 GDI/T-GDI benzininiuose patikrinkite alyvos sąnaudas ir grandinę."), { g: ["LM (ix35)", "TL"], f: "Benzīns" }),
    r(x("1.7/2.0 CRDi dīzeļiem pārbaudi DPF, EGR un sprauslas.", "On the 1.7/2.0 CRDi diesels check the DPF, EGR and injectors.", "У дизелей 1.7/2.0 CRDi проверьте сажевый фильтр, EGR и форсунки.", "1.7/2.0 CRDi dyzeliuose patikrinkite DPF, EGR ir purkštukus."), { g: ["LM (ix35)", "TL", "NX4"], f: "Dīzelis" }),
    r(RUST, { g: ["JM", "LM (ix35)"] }),
    r(x("Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "Check that recalls and software updates have been done.", "Проверьте, выполнены ли отзывные кампании и обновления ПО.", "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), { g: ["NX4"] }),
  ],
  "Volvo|XC70": [
    r(x("Pārbaudi leņķa reduktoru (angle gear) un Haldex sajūgu.", "Check the angle gear and Haldex coupling.", "Проверьте угловой редуктор (angle gear) и муфту Haldex.", "Patikrinkite kampinį reduktorių (angle gear) ir Haldex sankabą.")),
    r(x("D5 dīzeļiem pārbaudi DPF, EGR un sprauslas.", "On the D5 diesels check the DPF, EGR and injectors.", "У дизелей D5 проверьте сажевый фильтр, EGR и форсунки.", "D5 dyzeliuose patikrinkite DPF, EGR ir purkštukus."), { g: ["P3"], f: "Dīzelis" }),
    r(x("P2 automātiskajai kārbai AW55 pārbaudi, vai pārslēgšanās ir gluda.", "On the P2's AW55 automatic check that shifts are smooth.", "У автомата AW55 (P2) проверьте плавность переключений.", "P2 automatinėje AW55 dėžėje patikrinkite, ar pavaros perjungiamos sklandžiai."), { g: ["P2"], a: "Automāts" }),
    r(RUST, { g: ["V70 XC", "P2"] }),
  ],
  "Volvo|S60": [
    r(x("Pirmās paaudzes automātiskajai kārbai AW55 pārbaudi gludu pārslēgšanos.", "On the first generation's AW55 automatic check for smooth shifts.", "У автомата AW55 первого поколения проверьте плавность переключений.", "Pirmosios kartos AW55 automatinėje dėžėje patikrinkite sklandų perjungimą."), { g: ["1. paaudze"], a: "Automāts" }),
    r(DIESEL, { g: ["2. paaudze", "3. paaudze"], f: "Dīzelis" }),
    r(x("T6 Twin Engine un T8 plug-in hibrīdiem pārbaudi akumulatoru un lādēšanu.", "On the T6 Twin Engine and T8 plug-in hybrids check the battery and charging.", "У plug-in гибридов T6 Twin Engine и T8 проверьте батарею и зарядку.", "T6 Twin Engine ir T8 plug-in hibriduose patikrinkite bateriją ir įkrovimą."), { g: ["2. paaudze", "3. paaudze"], f: "Hibrīds" }),
    r(RUST, { g: ["1. paaudze"] }),
  ],
  "Nissan|X-Trail": [
    r(CVT, { g: ["T31", "T32", "T33"], a: "Automāts" }),
    r(x("2.0 dCi dīzelim pārbaudi DPF, EGR un sprauslas; T30 – arī rūsu.", "On the 2.0 dCi diesel check the DPF, EGR and injectors; on the T30 also rust.", "У дизеля 2.0 dCi проверьте сажевый фильтр, EGR и форсунки; у T30 — и ржавчину.", "2.0 dCi dyzelyje patikrinkite DPF, EGR ir purkštukus; T30 – ir rūdis."), { g: ["T30", "T31", "T32"], f: "Dīzelis" }),
    r(x("1.6 DIG-T benzīnam (T32) pārbaudi eļļas patēriņu.", "On the 1.6 DIG-T petrol (T32) check the oil consumption.", "У бензинового 1.6 DIG-T (T32) проверьте расход масла.", "1.6 DIG-T benzininiame (T32) patikrinkite alyvos sąnaudas."), { g: ["T32"], f: "Benzīns" }),
    r(x("Pilnpiedziņas sajūgam pārbaudi darbību un eļļas maiņu.", "On the AWD coupling check operation and oil changes.", "Проверьте работу муфты полного привода и замену масла.", "Visų ratų pavaros sankabą – patikrinkite veikimą ir alyvos keitimą."), { g: ["T31", "T32"] }),
  ],
  "BMW|X6": [
    r(x("4.4 V8 (N63, xDrive50i) mēdz patērēt eļļu, un turbīnas ir dārgas.", "The 4.4 V8 (N63, xDrive50i) tends to burn oil and its turbos are costly.", "4.4 V8 (N63, xDrive50i) склонен к расходу масла, турбины дорогие.", "4.4 V8 (N63, xDrive50i) linkęs naudoti alyvą, turbinos brangios."), { g: ["E71", "F16"], f: "Benzīns" }),
    r(x("Pārbaudi sadales kārbu – raustīšanās lēnos pagriezienos.", "Check the transfer case for jerking in slow turns.", "Проверьте раздатку — рывки в медленных поворотах.", "Patikrinkite skirstymo dėžę – trūkčiojimas lėtai sukant.")),
    r(x("3.0d dīzeļiem pārbaudi DPF, EGR un virpuļvārstus.", "On the 3.0d diesels check the DPF, EGR and swirl flaps.", "У дизелей 3.0d проверьте сажевый фильтр, EGR и вихревые заслонки.", "3.0d dyzeliuose patikrinkite DPF, EGR ir sūkurines sklendes."), { g: ["E71", "F16"], f: "Dīzelis" }),
    r(AIR, {}),
    r(PHEV, { g: ["G06"], f: "Hibrīds" }),
  ],
  "Ford|S-Max": [
    r(DIESEL, { f: "Dīzelis" }),
    r(DMF, {}),
    r(x("2.0 TDCi: pārbaudi sprauslas un sadales siksnu; pārbaudi arī PowerShift kārbu, ja ir.", "On the 2.0 TDCi check the injectors and timing belt; also the PowerShift gearbox if fitted.", "У 2.0 TDCi проверьте форсунки и ремень ГРМ; также коробку PowerShift, если есть.", "2.0 TDCi: patikrinkite purkštukus ir paskirstymo diržą; taip pat PowerShift dėžę, jei yra."), { g: ["1. paaudze"], f: "Dīzelis" }),
    r(x("2.0 EcoBlue un 1.5 EcoBoost: pārbaudi dzesēšanas sistēmu un atsaukumus.", "On the 2.0 EcoBlue and 1.5 EcoBoost check the cooling system and recalls.", "У 2.0 EcoBlue и 1.5 EcoBoost проверьте систему охлаждения и отзывы.", "2.0 EcoBlue ir 1.5 EcoBoost: patikrinkite aušinimo sistemą ir atšaukimus."), { g: ["2. paaudze"] }),
  ],
  "Ford|Kuga": [
    r(x("1.5/1.6 EcoBoost (apm. 2012–2019): pārbaudi dzesēšanas šķidruma noplūdes un atsaukumus.", "1.5/1.6 EcoBoost (about 2012–2019): check for coolant leaks and recalls.", "1.5/1.6 EcoBoost (примерно 2012–2019): проверьте утечки антифриза и отзывы.", "1.5/1.6 EcoBoost (apie 2012–2019): patikrinkite aušinimo skysčio nuotėkius ir atšaukimus."), { g: ["2. paaudze"], f: "Benzīns" }),
    r(DIESEL, { f: "Dīzelis" }),
    r(x("Pārbaudi PowerShift automātu (sajūga raustīšanās) un pilnpiedziņas sajūgu.", "Check the PowerShift automatic (clutch judder) and the AWD coupling.", "Проверьте автомат PowerShift (рывки сцепления) и муфту полного привода.", "Patikrinkite PowerShift automatą (sankabos trūkčiojimas) ir visų ratų pavaros sankabą."), { g: ["1. paaudze", "2. paaudze"], a: "Automāts" }),
    r(PHEV, { g: ["3. paaudze"], f: "Hibrīds" }),
  ],
  "Subaru|Outback": [
    r(CVT, { g: ["BS", "BT", "BR"], a: "Automāts" }),
    r(x("Agrīnajam 2.0D boxer dīzelim (apm. 2008–2011) zināmas kloķvārpstas problēmas.", "The early 2.0D boxer diesel (about 2008–2011) has known crankshaft problems.", "У раннего оппозитного дизеля 2.0D (примерно 2008–2011) известны проблемы коленвала.", "Ankstyvas 2.0D boxer dyzelis (apie 2008–2011) turi žinomų alkūninio veleno problemų."), { y: [2008, 2012], f: "Dīzelis" }),
    r(x("2.5 boxer benzīnam pārbaudi eļļas patēriņu un galvas blīvi (īpaši vecākām versijām).", "On the 2.5 boxer petrol check oil consumption and the head gasket (especially on older versions).", "У бензинового 2.5 boxer проверьте расход масла и прокладку ГБЦ (особенно у старых версий).", "2.5 boxer benzininiame patikrinkite alyvos sąnaudas ir galvutės tarpinę (ypač senesnėse versijose)."), { g: ["BH", "BP", "BR"], f: "Benzīns" }),
    r(RUST, { g: ["BH", "BP"] }),
  ],
  "Peugeot|5008": [
    r(PURETECH, { g: ["2. paaudze", "3. paaudze"], f: "Benzīns" }),
    r(x("1.6 THP benzīnam (apm. 2009–2015) pārbaudi sadales ķēdi un eļļas patēriņu.", "On the 1.6 THP petrol (about 2009–2015) check the timing chain and oil consumption.", "У бензинового 1.6 THP (примерно 2009–2015) проверьте цепь ГРМ и расход масла.", "1.6 THP benzininiame (apie 2009–2015) patikrinkite grandinę ir alyvos sąnaudas."), { g: ["1. paaudze"], f: "Benzīns" }),
    r(x("1.6/2.0 HDi un BlueHDi dīzeļiem pārbaudi DPF, EGR un sprauslas.", "On the 1.6/2.0 HDi and BlueHDi diesels check the DPF, EGR and injectors.", "У дизелей 1.6/2.0 HDi и BlueHDi проверьте сажевый фильтр, EGR и форсунки.", "1.6/2.0 HDi ir BlueHDi dyzeliuose patikrinkite DPF, EGR ir purkštukus."), { f: "Dīzelis" }),
    r(x("EAT6/EAT8 automātiskajai kārbai pajautā par eļļas maiņu.", "On the EAT6/EAT8 automatic ask about oil changes.", "У автомата EAT6/EAT8 спросите о замене масла.", "EAT6/EAT8 automatinei dėžei paklauskite apie alyvos keitimą."), { g: ["2. paaudze", "3. paaudze"], a: "Automāts" }),
  ],
  "Renault|Trafic": [
    r(DMF, {}),
    r(RUST, {}),
    r(x("2.0 dCi (agrīnajām versijām): pārbaudi sprauslas un turbīnu; 1.6 dCi – sadales ķēdi un dzesēšanu.", "On the 2.0 dCi (early versions) check the injectors and turbo; on the 1.6 dCi the timing chain and cooling.", "У 2.0 dCi (ранних версий) проверьте форсунки и турбину; у 1.6 dCi — цепь ГРМ и охлаждение.", "2.0 dCi (ankstyvosios versijos): patikrinkite purkštukus ir turbiną; 1.6 dCi – grandinę ir aušinimą."), { f: "Dīzelis" }),
    r(x("Pārbaudi nobraukumu pret stāvokli: komerciālie auto bieži braukti intensīvi.", "Compare mileage with condition: commercial vehicles are often driven hard.", "Сравните пробег с состоянием: коммерческие машины часто эксплуатируются интенсивно.", "Palyginkite rida su būkle: komerciniai automobiliai dažnai intensyviai naudojami.")),
  ],
  "Mazda|CX-5": [
    r(x("2.2 Skyactiv-D: pilsētas braukšanā degviela var nonākt eļļā – pārbaudi eļļas līmeni un apkopes.", "2.2 Skyactiv-D: in town driving fuel can dilute the oil – check the oil level and servicing.", "2.2 Skyactiv-D: при городской езде топливо может попадать в масло — проверьте уровень масла и ТО.", "2.2 Skyactiv-D: važinėjant mieste kuras gali patekti į alyvą – patikrinkite alyvos lygį ir priežiūrą."), { f: "Dīzelis" }),
    r(RUST, {}),
    r(x("Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "Check that recalls and software updates have been done.", "Проверьте, выполнены ли отзывные кампании и обновления ПО.", "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), { g: ["3. paaudze"] }),
  ],
  // --- modeļi bez paaudžu tabulas (MODEL_INFO): noteikumi pēc gadiem ---
  "Ford|Mondeo": [
    r(DMF, { f: "Dīzelis" }),
    r(x("Mk4 ar 6 pakāpju Powershift automātu (apm. 2010–2014): zināmas sajūga raustīšanās problēmas.", "Mk4 with the six-speed Powershift automatic (about 2010–2014): known clutch judder problems.", "Mk4 с 6-ступенчатым Powershift (примерно 2010–2014): известны рывки сцепления.", "Mk4 su 6 pavarų Powershift (apie 2010–2014): žinomos sankabos trūkčiojimo problemos."), { y: [2010, 2014], a: "Automāts" }),
    r(DIESEL, { f: "Dīzelis" }),
    r(RUST, { y: [1993, 2007] }),
    r(HYBRID, { f: "Hibrīds" }),
  ],
  "Volkswagen|Multivan": [
    r(DMF, {}),
    r(RUST, {}),
    r(DSGOIL, { a: "Automāts" }),
    r(x("2.5 TDI (T5, apm. 2003–2009): pārbaudi sprauslas un sadales siksni; klausies motora troksni.", "On the 2.5 TDI (T5, about 2003–2009) check the injectors and timing belt; listen to the engine.", "У 2.5 TDI (T5, примерно 2003–2009) проверьте форсунки и ремень ГРМ; прислушайтесь к мотору.", "2.5 TDI (T5, apie 2003–2009): patikrinkite purkštukus ir paskirstymo diržą; klausykitės variklio."), { y: [2003, 2009], f: "Dīzelis" }),
  ],
  "Renault|Master": [
    r(DMF, {}),
    r(RUST, {}),
    r(x("2.3 dCi: pārbaudi sprauslas, turbīnu un sadales ķēdi; klausies motora troksni.", "On the 2.3 dCi check the injectors, turbo and timing chain; listen to the engine.", "У 2.3 dCi проверьте форсунки, турбину и цепь ГРМ; прислушайтесь к мотору.", "2.3 dCi: patikrinkite purkštukus, turbiną ir grandinę; klausykitės variklio."), { f: "Dīzelis" }),
    r(x("Pārbaudi nobraukumu pret stāvokli: komerciālie auto bieži braukti intensīvi.", "Compare mileage with condition: commercial vehicles are often driven hard.", "Сравните пробег с состоянием: коммерческие машины часто эксплуатируются интенсивно.", "Palyginkite rida su būkle: komerciniai automobiliai dažnai intensyviai naudojami.")),
  ],
  "Opel|Mokka": [
    r(x("1.4 turbo benzīnam pārbaudi eļļas patēriņu un dzesēšanas sistēmu.", "On the 1.4 turbo petrol check the oil consumption and cooling system.", "У бензинового 1.4 турбо проверьте расход масла и систему охлаждения.", "1.4 turbo benzininiame patikrinkite alyvos sąnaudas ir aušinimo sistemą."), { y: [2012, 2020], f: "Benzīns" }),
    r(x("1.6 CDTI dīzelim pārbaudi sadales ķēdi, DPF un EGR.", "On the 1.6 CDTI diesel check the timing chain, DPF and EGR.", "У дизеля 1.6 CDTI проверьте цепь ГРМ, сажевый фильтр и EGR.", "1.6 CDTI dyzelyje patikrinkite grandinę, DPF ir EGR."), { y: [2012, 2020], f: "Dīzelis" }),
    r(PURETECH, { y: [2020, NOW], f: "Benzīns" }),
    r(EV, { f: "Elektro" }),
  ],
  "Hyundai|Santa Fe": [
    r(x("2.2 CRDi dīzelim pārbaudi DPF, EGR un sprauslas; pajautā apkopju vēsturi.", "On the 2.2 CRDi diesel check the DPF, EGR and injectors, and ask for the service history.", "У дизеля 2.2 CRDi проверьте сажевый фильтр, EGR и форсунки; спросите историю обслуживания.", "2.2 CRDi dyzelyje patikrinkite DPF, EGR ir purkštukus; paprašykite priežiūros istorijos."), { f: "Dīzelis" }),
    r(RUST, { y: [2000, 2012] }),
    r(x("Pārbaudi pilnpiedziņas sajūgu un automātiskās kārbas eļļas maiņu.", "Check the AWD coupling and that the automatic gearbox oil has been changed.", "Проверьте муфту полного привода и замену масла в автоматической коробке.", "Patikrinkite visų ratų pavaros sankabą ir ar keista automatinės dėžės alyva."), {}),
  ],
  "Opel|Vivaro": [
    r(DMF, {}),
    r(RUST, {}),
    r(x("2.0 CDTI/1.6 CDTI: pārbaudi sprauslas, turbīnu un dzesēšanas sistēmu.", "On the 2.0 CDTI/1.6 CDTI check the injectors, turbo and cooling system.", "У 2.0 CDTI/1.6 CDTI проверьте форсунки, турбину и систему охлаждения.", "2.0 CDTI/1.6 CDTI: patikrinkite purkštukus, turbiną ir aušinimo sistemą."), { f: "Dīzelis" }),
  ],
  "Volvo|V40": [
    r(DIESEL, { f: "Dīzelis" }),
    r(x("T5 un D4 versijām ar pilnpiedziņu pārbaudi Haldex sajūga eļļu.", "On the T5 and D4 AWD versions ask about the Haldex coupling oil.", "У T5 и D4 с полным приводом спросите о масле муфты Haldex.", "T5 ir D4 su visų ratų pavara paklauskite apie Haldex sankabos alyvą."), {}),
    r(ELEC, { y: [2012, 2019] }),
  ],
  "Mercedes-Benz|GL": [
    r(AIR, {}),
    r(x("OM642 3.0 CDI dīzelim pārbaudi eļļas noplūdes, DPF un EGR.", "On the OM642 3.0 CDI diesel check for oil leaks, the DPF and EGR.", "У дизеля OM642 3.0 CDI проверьте течи масла, сажевый фильтр и EGR.", "OM642 3.0 CDI dyzelyje patikrinkite alyvos nuotėkius, DPF ir EGR."), { f: "Dīzelis" }),
    r(x("Pārbaudi pilnpiedziņas sistēmu un reduktoru; dārgs remonts, ja ir trokšņi.", "Check the AWD system and transfer case; repairs are costly if there is noise.", "Проверьте систему полного привода и раздатку; при шумах ремонт дорогой.", "Patikrinkite visų ratų pavaros sistemą ir skirstymo dėžę; jei yra triukšmas, remontas brangus."), {}),
    r(ELEC, {}),
  ],
  "Audi|A6 Allroad": [
    r(AIR, {}),
    r(x("3.0 TDI (apm. 2005–2008) sadales ķēdes ir motora aizmugurē – klausies troksni.", "On early 3.0 TDI (about 2005–2008) the timing chains are at the back of the engine – listen for noise.", "У ранних 3.0 TDI (примерно 2005–2008) цепи ГРМ сзади мотора — прислушайтесь к шуму.", "Ankstyvuose 3.0 TDI (apie 2005–2008) grandinės variklio gale – klausykitės triukšmo."), { y: [2005, 2008], f: "Dīzelis" }),
    r(x("7 pakāpju S tronic kārbai pārbaudi pārslēgšanos un pajautā par eļļas maiņu.", "On the 7-speed S tronic check the shifts and ask about oil changes.", "У 7-ступенчатой S tronic проверьте переключения и спросите о замене масла.", "7 pavarų S tronic patikrinkite perjungimą ir paklauskite apie alyvos keitimą."), { y: [2012, NOW], a: "Automāts" }),
  ],
  "Volkswagen|Crafter": [
    r(DMF, {}),
    r(RUST, {}),
    r(x("2.5 TDI (2006–2016): pārbaudi sprauslas, turbīnu un dzesēšanas sistēmu; klausies motora troksni.", "On the 2.5 TDI (2006–2016) check the injectors, turbo and cooling system; listen to the engine.", "У 2.5 TDI (2006–2016) проверьте форсунки, турбину и систему охлаждения; прислушайтесь к мотору.", "2.5 TDI (2006–2016): patikrinkite purkštukus, turbiną ir aušinimo sistemą; klausykitės variklio."), { y: [2006, 2016], f: "Dīzelis" }),
    r(x("Pārbaudi nobraukumu pret stāvokli: komerciālie auto bieži braukti intensīvi.", "Compare mileage with condition: commercial vehicles are often driven hard.", "Сравните пробег с состоянием: коммерческие машины часто эксплуатируются интенсивно.", "Palyginkite rida su būkle: komerciniai automobiliai dažnai intensyviai naudojami.")),
  ],
  "Mercedes-Benz|M klase": [
    r(AIR, { y: [2005, 2015] }),
    r(x("OM642 3.0 CDI dīzelim pārbaudi eļļas noplūdes, DPF un EGR.", "On the OM642 3.0 CDI diesel check for oil leaks, the DPF and EGR.", "У дизеля OM642 3.0 CDI проверьте течи масла, сажевый фильтр и EGR.", "OM642 3.0 CDI dyzelyje patikrinkite alyvos nuotėkius, DPF ir EGR."), { f: "Dīzelis" }),
    r(RUST, { y: [1997, 2005] }),
    r(x("Pārbaudi pilnpiedziņu un automātiskās kārbas (7G-Tronic) pārslēgšanos.", "Check the AWD and that the automatic gearbox (7G-Tronic) shifts smoothly.", "Проверьте полный привод и плавность переключений автомата (7G-Tronic).", "Patikrinkite visų ratų pavarą ir ar automatinė dėžė (7G-Tronic) sklandžiai perjungia."), { a: "Automāts" }),
  ],
  "Kia|Ceed": [
    r(x("7 pakāpju DCT kārbai pārbaudi raustīšanos lēnā braukšanā.", "On the 7-speed DCT check for judder at low speed.", "У 7-ступенчатого DCT проверьте рывки на малой скорости.", "7 pavarų DCT patikrinkite trūkčiojimą važiuojant lėtai."), { a: "Automāts" }),
    r(x("1.6 CRDi dīzelim pārbaudi DPF un EGR, īpaši pilsētas braukšanā.", "On the 1.6 CRDi diesel check the DPF and EGR, especially after city driving.", "У дизеля 1.6 CRDi проверьте сажевый фильтр и EGR, особенно при городской езде.", "1.6 CRDi dyzelyje patikrinkite DPF ir EGR, ypač po važinėjimo mieste."), { f: "Dīzelis" }),
    r(x("1.6 GDI/T-GDI benzīnam pārbaudi eļļas patēriņu.", "On the 1.6 GDI/T-GDI petrol check the oil consumption.", "У бензинового 1.6 GDI/T-GDI проверьте расход масла.", "1.6 GDI/T-GDI benzininiame patikrinkite alyvos sąnaudas."), { f: "Benzīns" }),
  ],
  "Volkswagen|Sharan": [
    r(DSGOIL, { a: "Automāts" }),
    r(x("2.0 TDI: pārbaudi sprauslas, DPF un eļļas siltummaini; bīdāmajām durvīm – vadus un slēdzenes.", "On the 2.0 TDI check the injectors, DPF and oil cooler; on the sliding doors the cables and locks.", "У 2.0 TDI проверьте форсунки, сажевый фильтр и масляный радиатор; у сдвижных дверей — тросики и замки.", "2.0 TDI: patikrinkite purkštukus, DPF ir alyvos aušintuvą; slankiojančias duris – trosus ir spynas."), { f: "Dīzelis" }),
    r(RUST, { y: [1996, 2010] }),
  ],
  "Peugeot|2008": [
    r(PURETECH, { f: "Benzīns" }),
    r(x("1.5/1.6 BlueHDi dīzeļiem pārbaudi DPF, EGR un sprauslas.", "On the 1.5/1.6 BlueHDi diesels check the DPF, EGR and injectors.", "У дизелей 1.5/1.6 BlueHDi проверьте сажевый фильтр, EGR и форсунки.", "1.5/1.6 BlueHDi dyzeliuose patikrinkite DPF, EGR ir purkštukus."), { f: "Dīzelis" }),
    r(x("EAT6/EAT8 automātiskajai kārbai pajautā par eļļas maiņu.", "On the EAT6/EAT8 automatic ask about oil changes.", "У автомата EAT6/EAT8 спросите о замене масла.", "EAT6/EAT8 automatinei dėžei paklauskite apie alyvos keitimą."), { a: "Automāts" }),
    r(EV, { f: "Elektro" }),
  ],
  "Volvo|V50": [
    r(x("Pārbaudi rūsu uz aizmugures arkām un dzesēšanas sistēmu; 2.0D un D5 dīzeļiem – DPF un EGR.", "Check for rust on the rear arches and the cooling system; on the 2.0D and D5 diesels the DPF and EGR.", "Проверьте ржавчину на задних арках и систему охлаждения; у дизелей 2.0D и D5 — сажевый фильтр и EGR.", "Patikrinkite rūdis ant galinių arkų ir aušinimo sistemą; 2.0D ir D5 dyzeliuose – DPF ir EGR."), {}),
    r(x("Powershift robotizētajai kārbai (ja ir) pārbaudi raustīšanos un kļūdas.", "On the Powershift dual-clutch (if fitted) check for judder and faults.", "У роботизированной коробки Powershift (если есть) проверьте рывки и ошибки.", "Powershift robotizuotoje dėžėje (jei yra) patikrinkite trūkčiojimą ir klaidas."), { a: "Automāts" }),
  ],
  "Toyota|Prius": [
    r(HYBRID, {}),
    r(x("Pārbaudi hibrīda akumulatora veselību (diagnostika) un dzesēšanas ventilatora filtru.", "Check the hybrid battery health (diagnostics) and the cooling fan filter.", "Проверьте состояние гибридной батареи (диагностика) и фильтр вентилятора охлаждения.", "Patikrinkite hibridinės baterijos būklę (diagnostika) ir aušinimo ventiliatoriaus filtrą."), {}),
    r(x("Pārbaudi bremžu sistēmu un 12 V akumulatoru – hibrīdiem tie ir svarīgi.", "Check the brake system and the 12 V battery – both matter on hybrids.", "Проверьте тормозную систему и 12-вольтовый аккумулятор — для гибридов это важно.", "Patikrinkite stabdžių sistemą ir 12 V akumuliatorių – hibriduose tai svarbu."), {}),
  ],
  "Mercedes-Benz|GLC": [
    r(PHEV, { f: "Hibrīds" }),
    r(x("OM651/OM654 dīzeļiem pārbaudi sprauslas, DPF un EGR.", "On the OM651/OM654 diesels check the injectors, DPF and EGR.", "У дизелей OM651/OM654 проверьте форсунки, сажевый фильтр и EGR.", "OM651/OM654 dyzeliuose patikrinkite purkštukus, DPF ir EGR."), { f: "Dīzelis" }),
    r(AIR, {}),
    r(ELEC, {}),
  ],
  "Volkswagen|Polo": [
    r(DQ200, { a: "Automāts" }),
    r(TSI14, { y: [2010, 2014], f: "Benzīns" }),
    r(x("1.4 TDI/1.6 TDI: pārbaudi sprauslas, DPF un sadales siksnu.", "On the 1.4 TDI/1.6 TDI check the injectors, DPF and timing belt.", "У 1.4 TDI/1.6 TDI проверьте форсунки, сажевый фильтр и ремень ГРМ.", "1.4 TDI/1.6 TDI: patikrinkite purkštukus, DPF ir paskirstymo diržą."), { f: "Dīzelis" }),
    r(RUST, { y: [1995, 2005] }),
  ],
  "Mitsubishi|Outlander": [
    r(PHEV, { f: "Hibrīds" }),
    r(CVT, { a: "Automāts" }),
    r(x("2.2 DI-D dīzelim pārbaudi sadales ķēdi, DPF un EGR.", "On the 2.2 DI-D diesel check the timing chain, DPF and EGR.", "У дизеля 2.2 DI-D проверьте цепь ГРМ, сажевый фильтр и EGR.", "2.2 DI-D dyzelyje patikrinkite grandinę, DPF ir EGR."), { f: "Dīzelis" }),
    r(RUST, { y: [2003, 2012] }),
  ],
  "Nissan|Juke": [
    r(x("1.2 DIG-T un 1.6 DIG-T pārbaudi eļļas patēriņu un sadales ķēdi.", "On the 1.2 DIG-T and 1.6 DIG-T check the oil consumption and timing chain.", "У 1.2 DIG-T и 1.6 DIG-T проверьте расход масла и цепь ГРМ.", "1.2 DIG-T ir 1.6 DIG-T patikrinkite alyvos sąnaudas ir grandinę."), { f: "Benzīns" }),
    r(CVT, { a: "Automāts" }),
    r(x("1.5 dCi dīzelim pārbaudi sprauslas un turbīnu.", "On the 1.5 dCi diesel check the injectors and turbo.", "У дизеля 1.5 dCi проверьте форсунки и турбину.", "1.5 dCi dyzelyje patikrinkite purkštukus ir turbiną."), { f: "Dīzelis" }),
  ],
  "Porsche|Macan": [
    r(x("Dārga apkope: pārbaudi apkopju vēsturi, bremzes un piekari.", "Servicing is expensive: check the service history, brakes and suspension.", "Обслуживание дорогое: проверьте историю обслуживания, тормоза и подвеску.", "Priežiūra brangi: patikrinkite priežiūros istoriją, stabdžius ir pakabą."), {}),
    r(x("2.0 turbo benzīnam pārbaudi eļļas patēriņu un noplūdes; S/GTS V6 – dzesēšanas sistēmu.", "On the 2.0 turbo petrol check oil consumption and leaks; on the S/GTS V6 the cooling system.", "У 2.0 турбо проверьте расход масла и течи; у S/GTS V6 — систему охлаждения.", "2.0 turbo benzininiame patikrinkite alyvos sąnaudas ir nuotėkius; S/GTS V6 – aušinimo sistemą."), { f: "Benzīns" }),
    r(x("PDK kārbai pajautā par eļļas maiņu; pārbaudi, vai nav raustīšanās.", "On the PDK gearbox ask about oil changes and check for judder.", "У коробки PDK спросите о замене масла; проверьте, нет ли рывков.", "PDK dėžei paklauskite apie alyvos keitimą; patikrinkite, ar netrūkčioja."), { a: "Automāts" }),
    r(EV, { f: "Elektro" }),
  ],
  "Renault|Megane": [
    r(x("1.5 dCi dīzelim pārbaudi sprauslas, turbīnu un DPF; klausies motora troksni.", "On the 1.5 dCi diesel check the injectors, turbo and DPF; listen to the engine.", "У дизеля 1.5 dCi проверьте форсунки, турбину и сажевый фильтр; прислушайтесь к мотору.", "1.5 dCi dyzelyje patikrinkite purkštukus, turbiną ir DPF; klausykitės variklio."), { f: "Dīzelis" }),
    r(DMF, { f: "Dīzelis" }),
    r(ELEC, {}),
    r(x("1.2/1.3 TCe benzīnam pārbaudi eļļas patēriņu un atsaukumus.", "On the 1.2/1.3 TCe petrol check oil consumption and recalls.", "У бензиновых 1.2/1.3 TCe проверьте расход масла и отзывы.", "1.2/1.3 TCe benzininiuose patikrinkite alyvos sąnaudas ir atšaukimus."), { y: [2012, NOW], f: "Benzīns" }),
  ],
  "Volkswagen|Golf Plus": [
    r(DQ200, { a: "Automāts" }),
    r(TSI14, { y: [2007, 2012], f: "Benzīns" }),
    r(x("1.9/2.0 TDI: pārbaudi sprauslas (PD) un DPF.", "On the 1.9/2.0 TDI check the (PD) injectors and DPF.", "У 1.9/2.0 TDI проверьте форсунки (PD) и сажевый фильтр.", "1.9/2.0 TDI: patikrinkite purkštukus (PD) ir DPF."), { f: "Dīzelis" }),
  ],
  "Lexus|NX": [
    r(HYBRID, { f: "Hibrīds" }),
    r(x("Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "Check that recalls and software updates have been done.", "Проверьте, выполнены ли отзывные кампании и обновления ПО.", "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), {}),
  ],
  "Audi|A5": [
    r(TFSI20, { y: [2008, 2012], f: "Benzīns" }),
    r(x("Priekšpiedziņas versijām ar Multitronic (CVT) kārbu pārbaudi raustīšanos.", "On front-wheel-drive cars with the Multitronic (CVT) check for judder.", "У переднеприводных с Multitronic (CVT) проверьте рывки.", "Priekinių ratų versijose su Multitronic (CVT) patikrinkite trūkčiojimą."), { y: [2007, 2012], a: "Automāts" }),
    r(x("2.0 TDI un 3.0 TDI: pārbaudi DPF, EGR un eļļas patēriņu; 7 pakāpju S tronic – eļļas maiņu.", "On the 2.0 TDI and 3.0 TDI check the DPF, EGR and oil consumption; on the 7-speed S tronic the oil changes.", "У 2.0 TDI и 3.0 TDI проверьте сажевый фильтр, EGR и расход масла; у 7-ступенчатой S tronic — замену масла.", "2.0 TDI ir 3.0 TDI: patikrinkite DPF, EGR ir alyvos sąnaudas; 7 pavarų S tronic – alyvos keitimą."), { f: "Dīzelis" }),
  ],
  "Volvo|S80": [
    r(x("P2 automātiskajai kārbai AW55 pārbaudi, vai pārslēgšanās ir gluda.", "On the P2's AW55 automatic check that shifts are smooth.", "У автомата AW55 (P2) проверьте плавность переключений.", "P2 automatinėje AW55 dėžėje patikrinkite, ar pavaros perjungiamos sklandžiai."), { y: [1998, 2006], a: "Automāts" }),
    r(DIESEL, { f: "Dīzelis" }),
    r(x("Pilnpiedziņas versijām pārbaudi Haldex sajūgu un leņķa reduktoru.", "On AWD versions check the Haldex coupling and angle gear.", "У полноприводных версий проверьте муфту Haldex и угловой редуктор.", "Visų ratų pavaros versijose patikrinkite Haldex sankabą ir kampinį reduktorių."), {}),
  ],
  "Audi|Q3": [
    r(x("7 pakāpju S tronic kārbai pārbaudi pārslēgšanos un pajautā par eļļas maiņu.", "On the 7-speed S tronic check the shifts and ask about oil changes.", "У 7-ступенчатой S tronic проверьте переключения и спросите о замене масла.", "7 pavarų S tronic patikrinkite perjungimą ir paklauskite apie alyvos keitimą."), { a: "Automāts" }),
    r(x("2.0 TDI: pārbaudi DPF, EGR un eļļas siltummaini; 2.0 TFSI – eļļas patēriņu.", "On the 2.0 TDI check the DPF, EGR and oil cooler; on the 2.0 TFSI the oil consumption.", "У 2.0 TDI проверьте сажевый фильтр, EGR и масляный радиатор; у 2.0 TFSI — расход масла.", "2.0 TDI: patikrinkite DPF, EGR ir alyvos aušintuvą; 2.0 TFSI – alyvos sąnaudas."), {}),
    r(PHEV, { f: "Hibrīds" }),
  ],
  "Mercedes-Benz|A klase": [
    r(x("W169/W245 ar CVT (Autotronic) kārbu pārbaudi raustīšanos un troksni.", "On the W169/W245 with the CVT (Autotronic) check for judder and noise.", "У W169/W245 с вариатором (Autotronic) проверьте рывки и шум.", "W169/W245 su CVT (Autotronic) patikrinkite trūkčiojimą ir triukšmą."), { y: [2004, 2012], a: "Automāts" }),
    r(x("7G-DCT kārbai (W176) pārbaudi pārslēgšanos un pajautā par eļļas maiņu.", "On the 7G-DCT (W176) check the shifts and ask about oil changes.", "У 7G-DCT (W176) проверьте переключения и спросите о замене масла.", "7G-DCT (W176) patikrinkite perjungimą ir paklauskite apie alyvos keitimą."), { y: [2012, NOW], a: "Automāts" }),
    r(DIESEL, { f: "Dīzelis" }),
    r(PHEV, { f: "Hibrīds" }),
  ],
  "Subaru|Forester": [
    r(CVT, { y: [2013, NOW], a: "Automāts" }),
    r(x("2.0/2.5 boxer benzīnam pārbaudi eļļas patēriņu un galvas blīvi (īpaši vecākām versijām).", "On the 2.0/2.5 boxer petrol check oil consumption and the head gasket (especially on older versions).", "У бензинового 2.0/2.5 boxer проверьте расход масла и прокладку ГБЦ (особенно у старых версий).", "2.0/2.5 boxer benzininiame patikrinkite alyvos sąnaudas ir galvutės tarpinę (ypač senesnėse versijose)."), { f: "Benzīns" }),
    r(x("Agrīnajam 2.0D boxer dīzelim (apm. 2008–2011) zināmas kloķvārpstas problēmas.", "The early 2.0D boxer diesel (about 2008–2011) has known crankshaft problems.", "У раннего оппозитного дизеля 2.0D (примерно 2008–2011) известны проблемы коленвала.", "Ankstyvas 2.0D boxer dyzelis (apie 2008–2011) turi žinomų alkūninio veleno problemų."), { y: [2008, 2012], f: "Dīzelis" }),
    r(RUST, { y: [1997, 2008] }),
  ],
  "Land Rover|Range Rover Sport": [
    r(AIR, {}),
    r(ELEC, {}),
    r(x("3.0 TDV6/SDV6 un 4.4 V8 dīzeļiem pārbaudi dzesēšanas sistēmu, eļļas noplūdes un turbīnas.", "On the 3.0 TDV6/SDV6 and 4.4 V8 diesels check the cooling system, oil leaks and turbos.", "У дизелей 3.0 TDV6/SDV6 и 4.4 V8 проверьте систему охлаждения, течи масла и турбины.", "3.0 TDV6/SDV6 ir 4.4 V8 dyzeliuose patikrinkite aušinimo sistemą, alyvos nuotėkius ir turbinas."), { f: "Dīzelis" }),
    r(x("Dārga apkope un remonts – pārbaudi pilnu apkopju vēsturi un rēķinu par nolietotajām daļām.", "Servicing and repairs are expensive – ask for the full service history and costs of worn parts.", "Обслуживание и ремонт дорогие — запросите полную историю обслуживания и расходы на изношенные детали.", "Priežiūra ir remontas brangūs – paprašykite pilnos priežiūros istorijos ir susidėvėjusių dalių išlaidų."), {}),
  ],
  "Peugeot|508": [
    r(THP, { y: [2010, 2018], f: "Benzīns" }),
    r(PURETECH, { y: [2018, NOW], f: "Benzīns" }),
    r(x("2.0 HDi/BlueHDi dīzelim pārbaudi DPF, EGR un sprauslas.", "On the 2.0 HDi/BlueHDi diesel check the DPF, EGR and injectors.", "У дизеля 2.0 HDi/BlueHDi проверьте сажевый фильтр, EGR и форсунки.", "2.0 HDi/BlueHDi dyzelyje patikrinkite DPF, EGR ir purkštukus."), { f: "Dīzelis" }),
    r(PHEV, { f: "Hibrīds" }),
  ],
  "Ford|Galaxy": [
    r(DIESEL, { f: "Dīzelis" }),
    r(DMF, {}),
    r(RUST, { y: [1995, 2006] }),
    r(x("Powershift robotizētajai kārbai (ja ir) pārbaudi raustīšanos un kļūdas.", "On the Powershift dual-clutch (if fitted) check for judder and faults.", "У роботизированной коробки Powershift (если есть) проверьте рывки и ошибки.", "Powershift robotizuotoje dėžėje (jei yra) patikrinkite trūkčiojimą ir klaidas."), { a: "Automāts" }),
  ],
  "BMW|X4": [
    r(x("2.0d dīzelim pārbaudi sadales ķēdi (N47), DPF un EGR.", "On the 2.0d diesel check the timing chain (N47), DPF and EGR.", "У дизеля 2.0d проверьте цепь ГРМ (N47), сажевый фильтр и EGR.", "2.0d dyzelyje patikrinkite grandinę (N47), DPF ir EGR."), { y: [2014, 2016], f: "Dīzelis" }),
    r(B47, { y: [2016, NOW], f: "Dīzelis" }),
    r(x("Pārbaudi sadales kārbu un pilnpiedziņas darbību – raustīšanās lēnos pagriezienos.", "Check the transfer case and the AWD operation – jerking in slow turns.", "Проверьте раздаточную коробку и работу полного привода — рывки в медленных поворотах.", "Patikrinkite skirstymo dėžę ir visų ratų pavaros veikimą – trūkčiojimas lėtai sukant."), {}),
  ],
  "Mercedes-Benz|GLE": [
    r(AIR, {}),
    r(PHEV, { f: "Hibrīds" }),
    r(x("OM642/OM651 dīzeļiem pārbaudi sprauslas, DPF, EGR un eļļas noplūdes.", "On the OM642/OM651 diesels check the injectors, DPF, EGR and oil leaks.", "У дизелей OM642/OM651 проверьте форсунки, сажевый фильтр, EGR и течи масла.", "OM642/OM651 dyzeliuose patikrinkite purkštukus, DPF, EGR ir alyvos nuotėkius."), { f: "Dīzelis" }),
    r(ELEC, {}),
  ],
  "Seat|Leon": [
    r(DQ200, { a: "Automāts" }),
    r(TSI14, { y: [2007, 2012], f: "Benzīns" }),
    r(x("2.0 TDI: pārbaudi sprauslas, DPF un eļļas siltummaini.", "On the 2.0 TDI check the injectors, DPF and oil cooler.", "У 2.0 TDI проверьте форсунки, сажевый фильтр и масляный радиатор.", "2.0 TDI: patikrinkite purkštukus, DPF ir alyvos aušintuvą."), { f: "Dīzelis" }),
    r(PHEV, { f: "Hibrīds" }),
  ],
  "Ford|C-Max": [
    r(x("1.0 EcoBoost (apm. 2012–2019): pārbaudi dzesēšanas sistēmu un atsaukumus.", "1.0 EcoBoost (about 2012–2019): check the cooling system and recalls.", "1.0 EcoBoost (примерно 2012–2019): проверьте систему охлаждения и отзывы.", "1.0 EcoBoost (apie 2012–2019): patikrinkite aušinimo sistemą ir atšaukimus."), { y: [2012, 2019], f: "Benzīns" }),
    r(DMF, { f: "Dīzelis" }),
    r(x("Powershift robotizētajai kārbai (ja ir) pārbaudi raustīšanos un kļūdas.", "On the Powershift dual-clutch (if fitted) check for judder and faults.", "У роботизированной коробки Powershift (если есть) проверьте рывки и ошибки.", "Powershift robotizuotoje dėžėje (jei yra) patikrinkite trūkčiojimą ir klaidas."), { a: "Automāts" }),
    r(HYBRID, { f: "Hibrīds" }),
  ],
  "Opel|Meriva": [
    r(x("1.4 turbo benzīnam pārbaudi eļļas patēriņu un dzesēšanas sistēmu.", "On the 1.4 turbo petrol check the oil consumption and cooling system.", "У бензинового 1.4 турбо проверьте расход масла и систему охлаждения.", "1.4 turbo benzininiame patikrinkite alyvos sąnaudas ir aušinimo sistemą."), { f: "Benzīns" }),
    r(x("1.3/1.7 CDTI dīzeļiem pārbaudi sprauslas, DPF un EGR.", "On the 1.3/1.7 CDTI diesels check the injectors, DPF and EGR.", "У дизелей 1.3/1.7 CDTI проверьте форсунки, сажевый фильтр и EGR.", "1.3/1.7 CDTI dyzeliuose patikrinkite purkštukus, DPF ir EGR."), { f: "Dīzelis" }),
    r(x("Easytronic robotizētajai kārbai (ja ir) pārbaudi raustīšanos.", "On the Easytronic automated manual (if fitted) check for jerking.", "У роботизированной коробки Easytronic (если есть) проверьте рывки.", "Easytronic robotizuotoje dėžėje (jei yra) patikrinkite trūkčiojimą."), { a: "Automāts" }),
  ],
  "Honda|Civic": [
    r(x("1.6 i-DTEC dīzelim pārbaudi DPF un EGR, īpaši pilsētas braukšanā.", "On the 1.6 i-DTEC diesel check the DPF and EGR, especially after city driving.", "У дизеля 1.6 i-DTEC проверьте сажевый фильтр и EGR, особенно при городской езде.", "1.6 i-DTEC dyzelyje patikrinkite DPF ir EGR, ypač po važinėjimo mieste."), { f: "Dīzelis" }),
    r(x("1.5 VTEC Turbo (apm. 2016+) mēdz atšķaidīt eļļu ar degvielu – pārbaudi eļļas līmeni un apkopes.", "The 1.5 VTEC Turbo (about 2016+) can dilute its oil with fuel – check the oil level and servicing.", "У 1.5 VTEC Turbo (примерно с 2016) масло может разбавляться топливом — проверьте уровень масла и ТО.", "1.5 VTEC Turbo (apie 2016+) alyva gali skiestis kuru – patikrinkite alyvos lygį ir priežiūrą."), { y: [2016, NOW], f: "Benzīns" }),
    r(RUST, { y: [1995, 2006] }),
    r(HYBRID, { f: "Hibrīds" }),
  ],
  "Škoda|Fabia": [
    r(TSI14, { y: [2010, 2014], f: "Benzīns" }),
    r(DQ200, { a: "Automāts" }),
    r(x("1.4/1.9 TDI: pārbaudi sprauslas (PD) un sadales siksnu; 1.2 TDI – turbīnu.", "On the 1.4/1.9 TDI check the (PD) injectors and timing belt; on the 1.2 TDI the turbo.", "У 1.4/1.9 TDI проверьте форсунки (PD) и ремень ГРМ; у 1.2 TDI — турбину.", "1.4/1.9 TDI: patikrinkite purkštukus (PD) ir paskirstymo diržą; 1.2 TDI – turbiną."), { f: "Dīzelis" }),
    r(RUST, { y: [1999, 2007] }),
  ],
  "Toyota|Land Cruiser": [
    r(x("3.0 D-4D dīzelim (J120/J150) pārbaudi sprauslas, DPF un EGR.", "On the 3.0 D-4D diesel (J120/J150) check the injectors, DPF and EGR.", "У дизеля 3.0 D-4D (J120/J150) проверьте форсунки, сажевый фильтр и EGR.", "3.0 D-4D dyzelyje (J120/J150) patikrinkite purkštukus, DPF ir EGR."), { f: "Dīzelis" }),
    r(RUST, {}),
    r(x("Pārbaudi pilnpiedziņu, reduktoru un pneimatisko/KDSS piekari; liels nobraukums ir normāls, bet svarīgi apkopju vēsture.", "Check the 4WD, transfer case and air/KDSS suspension; high mileage is normal but the service history matters.", "Проверьте полный привод, раздатку и пневмо/KDSS подвеску; большой пробег — норма, но важна история обслуживания.", "Patikrinkite visų ratų pavarą, skirstymo dėžę ir pneumatinę/KDSS pakabą; didelė rida įprasta, bet svarbi priežiūros istorija."), {}),
  ],
  "BMW|4. sērija": [
    r(x("2.0 turbo benzīnam (N20, apm. 2013–2016) pārbaudi sadales ķēdes nodilumu.", "On the 2.0 turbo petrol (N20, about 2013–2016) check for timing chain wear.", "У бензинового 2.0 турбо (N20, примерно 2013–2016) проверьте износ цепи ГРМ.", "2.0 turbo benzininiame (N20, apie 2013–2016) patikrinkite grandinės nusidėvėjimą."), { y: [2013, 2016], f: "Benzīns" }),
    r(x("Dīzeļiem (N47/B47) pārbaudi sadales ķēdi (N47), DPF un EGR.", "On diesels (N47/B47) check the timing chain (N47), DPF and EGR.", "У дизелей (N47/B47) проверьте цепь ГРМ (N47), сажевый фильтр и EGR.", "Dyzeliuose (N47/B47) patikrinkite grandinę (N47), DPF ir EGR."), { f: "Dīzelis" }),
    r(PHEV, { f: "Hibrīds" }),
  ],
  "Kia|Sorento": [
    r(x("2.2 CRDi dīzelim pārbaudi DPF, EGR un sprauslas.", "On the 2.2 CRDi diesel check the DPF, EGR and injectors.", "У дизеля 2.2 CRDi проверьте сажевый фильтр, EGR и форсунки.", "2.2 CRDi dyzelyje patikrinkite DPF, EGR ir purkštukus."), { f: "Dīzelis" }),
    r(RUST, { y: [2002, 2009] }),
    r(PHEV, { f: "Hibrīds" }),
  ],
  "Fiat|Ducato": [
    r(DMF, {}),
    r(RUST, {}),
    r(x("2.3 JTD/Multijet: pārbaudi sprauslas, turbīnu un dzesēšanas sistēmu.", "On the 2.3 JTD/Multijet check the injectors, turbo and cooling system.", "У 2.3 JTD/Multijet проверьте форсунки, турбину и систему охлаждения.", "2.3 JTD/Multijet: patikrinkite purkštukus, turbiną ir aušinimo sistemą."), { f: "Dīzelis" }),
    r(x("Pārbaudi nobraukumu pret stāvokli: komerciālie auto bieži braukti intensīvi.", "Compare mileage with condition: commercial vehicles are often driven hard.", "Сравните пробег с состоянием: коммерческие машины часто эксплуатируются интенсивно.", "Palyginkite rida su būkle: komerciniai automobiliai dažnai intensyviai naudojami.")),
  ],
  "Škoda|Karoq": [
    r(DSGOIL, { a: "Automāts" }),
    r(x("2.0 TDI: pārbaudi DPF, EGR un eļļas siltummaini; 1.5 TSI – eļļas patēriņu.", "On the 2.0 TDI check the DPF, EGR and oil cooler; on the 1.5 TSI the oil consumption.", "У 2.0 TDI проверьте сажевый фильтр, EGR и масляный радиатор; у 1.5 TSI — расход масла.", "2.0 TDI: patikrinkite DPF, EGR ir alyvos aušintuvą; 1.5 TSI – alyvos sąnaudas."), {}),
    r(HALDEX, {}),
  ],
  "Volvo|XC40": [
    r(EV, { f: "Elektro" }),
    r(PHEV, { f: "Hibrīds" }),
    r(ELEC, {}),
    r(DIESEL, { f: "Dīzelis" }),
  ],
  "Opel|Corsa": [
    r(x("1.2 PureTech (apm. 2018+) zobsiksna darbojas eļļā un nolietojas ātrāk – pajautā, kad mainīta.", "The 1.2 PureTech (about 2018+) has a wet timing belt that wears early – ask when it was replaced.", "У 1.2 PureTech (примерно с 2018) ремень ГРМ работает в масле и быстро изнашивается — спросите, когда меняли.", "1.2 PureTech (apie 2018+) paskirstymo diržas veikia alyvoje ir greičiau dyla – paklauskite, kada keistas."), { y: [2018, NOW], f: "Benzīns" }),
    r(x("Easytronic robotizētajai kārbai (ja ir) pārbaudi raustīšanos.", "On the Easytronic automated manual (if fitted) check for jerking.", "У роботизированной коробки Easytronic (если есть) проверьте рывки.", "Easytronic robotizuotoje dėžėje (jei yra) patikrinkite trūkčiojimą."), { a: "Automāts" }),
    r(x("1.3 CDTI: pārbaudi sprauslas, DPF un EGR; 1.4 turbo – eļļas patēriņu.", "On the 1.3 CDTI check the injectors, DPF and EGR; on the 1.4 turbo the oil consumption.", "У 1.3 CDTI проверьте форсунки, сажевый фильтр и EGR; у 1.4 турбо — расход масла.", "1.3 CDTI: patikrinkite purkštukus, DPF ir EGR; 1.4 turbo – alyvos sąnaudas."), { y: [2006, 2019] }),
    r(EV, { f: "Elektro" }),
  ],
  "Toyota|Verso": [
    r(x("2.0/2.2 D-4D dīzeļiem pārbaudi sprauslas, EGR un galvas blīvi.", "On the 2.0/2.2 D-4D diesels check the injectors, EGR and head gasket.", "У дизелей 2.0/2.2 D-4D проверьте форсунки, EGR и прокладку ГБЦ.", "2.0/2.2 D-4D dyzeliuose patikrinkite purkštukus, EGR ir galvutės tarpinę."), { f: "Dīzelis" }),
    r(x("1.6/1.8 Valvematic benzīnam pārbaudi eļļas patēriņu.", "On the 1.6/1.8 Valvematic petrol check the oil consumption.", "У бензиновых 1.6/1.8 Valvematic проверьте расход масла.", "1.6/1.8 Valvematic benzininiuose patikrinkite alyvos sąnaudas."), { f: "Benzīns" }),
    r(MMT, { a: "Automāts" }),
  ],
  "Toyota|Proace": [
    r(DMF, {}),
    r(RUST, {}),
    r(DIESEL, { f: "Dīzelis" }),
  ],
  "Audi|A8": [
    r(AIR, {}),
    r(ELEC, {}),
    r(x("4.2 TDI/3.0 TDI: pārbaudi sadales ķēdes, DPF un eļļas noplūdes; benzīna V8 – dzesēšanas sistēmu.", "On the 4.2 TDI/3.0 TDI check the timing chains, DPF and oil leaks; on petrol V8s the cooling system.", "У 4.2 TDI/3.0 TDI проверьте цепи ГРМ, сажевый фильтр и течи масла; у бензиновых V8 — охлаждение.", "4.2 TDI/3.0 TDI: patikrinkite grandines, DPF ir alyvos nuotėkius; benzininiuose V8 – aušinimą."), {}),
    r(x("Pārbaudi pilnpiedziņas (quattro) un automātiskās kārbas darbību.", "Check the quattro AWD and the automatic gearbox operation.", "Проверьте работу полного привода quattro и автоматической коробки.", "Patikrinkite quattro pavaros ir automatinės dėžės veikimą."), {}),
  ],
  "Mercedes-Benz|B klase": [
    r(x("W245 ar CVT (Autotronic) kārbu pārbaudi raustīšanos un troksni.", "On the W245 with the CVT (Autotronic) check for judder and noise.", "У W245 с вариатором (Autotronic) проверьте рывки и шум.", "W245 su CVT (Autotronic) patikrinkite trūkčiojimą ir triukšmą."), { y: [2005, 2011], a: "Automāts" }),
    r(x("W246 ar 7G-DCT kārbu pārbaudi pārslēgšanos un pajautā par eļļas maiņu.", "On the W246 with the 7G-DCT check the shifts and ask about oil changes.", "У W246 с 7G-DCT проверьте переключения и спросите о замене масла.", "W246 su 7G-DCT patikrinkite perjungimą ir paklauskite apie alyvos keitimą."), { y: [2011, 2018], a: "Automāts" }),
    r(DIESEL, { f: "Dīzelis" }),
    r(EV, { f: "Elektro" }),
  ],
  "Ford|Fiesta": [
    r(x("1.0 EcoBoost (apm. 2012–2019): pārbaudi dzesēšanas sistēmu un atsaukumus.", "1.0 EcoBoost (about 2012–2019): check the cooling system and recalls.", "1.0 EcoBoost (примерно 2012–2019): проверьте систему охлаждения и отзывы.", "1.0 EcoBoost (apie 2012–2019): patikrinkite aušinimo sistemą ir atšaukimus."), { y: [2012, 2019], f: "Benzīns" }),
    r(x("Powershift robotizētajai kārbai (ja ir) pārbaudi raustīšanos un kļūdas.", "On the Powershift dual-clutch (if fitted) check for judder and faults.", "У роботизированной коробки Powershift (если есть) проверьте рывки и ошибки.", "Powershift robotizuotoje dėžėje (jei yra) patikrinkite trūkčiojimą ir klaidas."), { a: "Automāts" }),
    r(x("1.5/1.6 TDCi dīzeļiem pārbaudi sprauslas, turbīnu un DPF.", "On the 1.5/1.6 TDCi diesels check the injectors, turbo and DPF.", "У дизелей 1.5/1.6 TDCi проверьте форсунки, турбину и сажевый фильтр.", "1.5/1.6 TDCi dyzeliuose patikrinkite purkštukus, turbiną ir DPF."), { f: "Dīzelis" }),
    r(RUST, { y: [1996, 2008] }),
  ],
  "Ford|Transit Custom": [
    r(DMF, {}),
    r(RUST, {}),
    r(x("2.2 TDCi/2.0 EcoBlue: pārbaudi sprauslas, turbīnu un dzesēšanas sistēmu; EcoBlue – zobsiksnu eļļā.", "On the 2.2 TDCi/2.0 EcoBlue check the injectors, turbo and cooling system; on the EcoBlue the wet belt.", "У 2.2 TDCi/2.0 EcoBlue проверьте форсунки, турбину и систему охлаждения; у EcoBlue — ремень в масле.", "2.2 TDCi/2.0 EcoBlue: patikrinkite purkštukus, turbiną ir aušinimo sistemą; EcoBlue – diržą alyvoje."), { f: "Dīzelis" }),
    r(PHEV, { f: "Hibrīds" }),
  ],
  "Mercedes-Benz|CLA": [
    r(x("7G-DCT kārbai pārbaudi pārslēgšanos un pajautā par eļļas maiņu.", "On the 7G-DCT check the shifts and ask about oil changes.", "У 7G-DCT проверьте переключения и спросите о замене масла.", "7G-DCT patikrinkite perjungimą ir paklauskite apie alyvos keitimą."), { a: "Automāts" }),
    r(DIESEL, { f: "Dīzelis" }),
    r(PHEV, { f: "Hibrīds" }),
    r(x("Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.", "Check that recalls and software updates have been done.", "Проверьте, выполнены ли отзывные кампании и обновления ПО.", "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai."), {}),
  ],
  "Mini|Countryman": [
    r(x("1.6 turbo benzīnam (Prince, apm. 2007–2013) pārbaudi sadales ķēdi un eļļas patēriņu.", "On the 1.6 turbo petrol (Prince, about 2007–2013) check the timing chain and oil consumption.", "У бензинового 1.6 турбо (Prince, примерно 2007–2013) проверьте цепь ГРМ и расход масла.", "1.6 turbo benzininiame (Prince, apie 2007–2013) patikrinkite grandinę ir alyvos sąnaudas."), { y: [2007, 2013], f: "Benzīns" }),
    r(x("Pārbaudi dzesēšanas sistēmu, eļļas noplūdes un piekares detaļas.", "Check the cooling system, oil leaks and the suspension parts.", "Проверьте систему охлаждения, течи масла и детали подвески.", "Patikrinkite aušinimo sistemą, alyvos nuotėkius ir pakabos dalis."), {}),
    r(PHEV, { f: "Hibrīds" }),
  ],
  "Volvo|V90": [
    r(DIESEL, { f: "Dīzelis" }),
    r(PHEV, { f: "Hibrīds" }),
    r(ELEC, {}),
  ],
  "Hyundai|i30": [
    r(x("7 pakāpju DCT kārbai pārbaudi raustīšanos lēnā braukšanā.", "On the 7-speed DCT check for judder at low speed.", "У 7-ступенчатого DCT проверьте рывки на малой скорости.", "7 pavarų DCT patikrinkite trūkčiojimą važiuojant lėtai."), { a: "Automāts" }),
    r(x("1.6 CRDi dīzelim pārbaudi DPF un EGR.", "On the 1.6 CRDi diesel check the DPF and EGR.", "У дизеля 1.6 CRDi проверьте сажевый фильтр и EGR.", "1.6 CRDi dyzelyje patikrinkite DPF ir EGR."), { f: "Dīzelis" }),
    r(x("1.4/1.6 benzīnam pārbaudi eļļas patēriņu.", "On the 1.4/1.6 petrol check the oil consumption.", "У бензиновых 1.4/1.6 проверьте расход масла.", "1.4/1.6 benzininiuose patikrinkite alyvos sąnaudas."), { f: "Benzīns" }),
  ],
  "Dacia|Duster": [
    r(x("1.5 dCi dīzelim pārbaudi sprauslas un turbīnu; pilnpiedziņai – sajūgu.", "On the 1.5 dCi diesel check the injectors and turbo; on AWD the coupling.", "У дизеля 1.5 dCi проверьте форсунки и турбину; у полного привода — муфту.", "1.5 dCi dyzelyje patikrinkite purkštukus ir turbiną; visų ratų pavarai – sankabą."), { f: "Dīzelis" }),
    r(RUST, {}),
    r(x("TCe benzīnam pārbaudi eļļas patēriņu un atsaukumus.", "On the TCe petrol check oil consumption and recalls.", "У бензинового TCe проверьте расход масла и отзывы.", "TCe benzininiame patikrinkite alyvos sąnaudas ir atšaukimus."), { f: "Benzīns" }),
  ],
  "Mercedes-Benz|Vito": [
    r(DMF, {}),
    r(RUST, {}),
    r(x("OM651 dīzeļiem (apm. 2009–2011) zināmas sprauslu problēmas.", "OM651 diesels (about 2009–2011) have known injector problems.", "У дизелей OM651 (примерно 2009–2011) известны проблемы форсунок.", "OM651 dyzeliai (apie 2009–2011) turi žinomų purkštukų problemų."), { y: [2009, 2012], f: "Dīzelis" }),
    r(x("Pārbaudi nobraukumu pret stāvokli: komerciālie auto bieži braukti intensīvi.", "Compare mileage with condition: commercial vehicles are often driven hard.", "Сравните пробег с состоянием: коммерческие машины часто эксплуатируются интенсивно.", "Palyginkite rida su būkle: komerciniai automobiliai dažnai intensyviai naudojami.")),
  ],
  "Mazda|6": [
    r(RUST, {}),
    r(x("2.2 Skyactiv-D: pilsētas braukšanā degviela var nonākt eļļā – pārbaudi eļļas līmeni un apkopes.", "2.2 Skyactiv-D: in town driving fuel can dilute the oil – check the oil level and servicing.", "2.2 Skyactiv-D: при городской езде топливо может попадать в масло — проверьте уровень масла и ТО.", "2.2 Skyactiv-D: važinėjant mieste kuras gali patekti į alyvą – patikrinkite alyvos lygį ir priežiūrą."), { y: [2012, NOW], f: "Dīzelis" }),
    r(x("2.0 MZR-CD dīzelim (apm. 2005–2010) pārbaudi sprauslas un turbīnu.", "On the 2.0 MZR-CD diesel (about 2005–2010) check the injectors and turbo.", "У дизеля 2.0 MZR-CD (примерно 2005–2010) проверьте форсунки и турбину.", "2.0 MZR-CD dyzelyje (apie 2005–2010) patikrinkite purkštukus ir turbiną."), { y: [2005, 2010], f: "Dīzelis" }),
  ],
  "Land Rover|Range Rover": [
    r(AIR, {}),
    r(ELEC, {}),
    r(x("Dārga apkope un remonts – pārbaudi pilnu apkopju vēsturi un rēķinu par nolietotajām daļām.", "Servicing and repairs are expensive – ask for the full service history and costs of worn parts.", "Обслуживание и ремонт дорогие — запросите полную историю обслуживания и расходы на изношенные детали.", "Priežiūra ir remontas brangūs – paprašykite pilnos priežiūros istorijos ir susidėvėjusių dalių išlaidų."), {}),
    r(DIESEL, { f: "Dīzelis" }),
  ],
  "Mercedes-Benz|CLS": [
    r(AIR, {}),
    r(DIESEL, { f: "Dīzelis" }),
    r(ELEC, {}),
    r(x("W219: pārbaudi rūsu uz arkām un slieksņiem; V6/V8 benzīnam – dzesēšanas sistēmu.", "W219: check for rust on the arches and sills; on the V6/V8 petrol the cooling system.", "W219: проверьте ржавчину на арках и порогах; у V6/V8 бензиновых — систему охлаждения.", "W219: patikrinkite rūdis ant arkų ir slenksčių; V6/V8 benzininiuose – aušinimo sistemą."), { y: [2004, 2010] }),
  ],
  "Mercedes-Benz|V klase": [
    r(DMF, {}),
    r(RUST, {}),
    r(DIESEL, { f: "Dīzelis" }),
    r(x("Pārbaudi bīdāmās durvis un pārslēgšanās gludumu automātiskajai kārbai.", "Check the sliding doors and that the automatic gearbox shifts smoothly.", "Проверьте сдвижные двери и плавность переключений автоматической коробки.", "Patikrinkite slankiojančias duris ir ar automatinė dėžė sklandžiai perjungia."), {}),
  ],
  "Audi|A7": [
    r(x("7 pakāpju S tronic kārbai pārbaudi pārslēgšanos un pajautā par eļļas maiņu.", "On the 7-speed S tronic check the shifts and ask about oil changes.", "У 7-ступенчатой S tronic проверьте переключения и спросите о замене масла.", "7 pavarų S tronic patikrinkite perjungimą ir paklauskite apie alyvos keitimą."), { a: "Automāts" }),
    r(x("Agrīnajiem 3.0 TDI sadales ķēdes ir motora aizmugurē – klausies troksni; pārbaudi DPF un EGR.", "On early 3.0 TDI the timing chains are at the back of the engine – listen for noise; check the DPF and EGR.", "У ранних 3.0 TDI цепи ГРМ сзади мотора — прислушайтесь к шуму; проверьте сажевый фильтр и EGR.", "Ankstyvuose 3.0 TDI grandinės variklio gale – klausykitės triukšmo; patikrinkite DPF ir EGR."), { y: [2010, 2014], f: "Dīzelis" }),
    r(AIR, {}),
    r(PHEV, { f: "Hibrīds" }),
  ],
};

// --- kopīgi noteikumu komplekti pārējiem modeļiem (marku/segmentu līmenī; konkrētākas piezīmes pievieno augstāk) ---
const RECALLS: C = one(
  "Pārbaudi, vai izpildīti atsaukumi un programmatūras atjauninājumi.",
  "Check that recalls and software updates have been done.",
  "Проверьте, выполнены ли отзывные кампании и обновления ПО.",
  "Patikrinkite, ar atlikti atšaukimai ir programinės įrangos atnaujinimai.",
);
const WORKVAN: C = one(
  "Pārbaudi nobraukumu pret stāvokli: komerciālie auto bieži braukti intensīvi.",
  "Compare mileage with condition: commercial vehicles are often driven hard.",
  "Сравните пробег с состоянием: коммерческие машины часто эксплуатируются интенсивно.",
  "Palyginkite rida su būkle: komerciniai automobiliai dažnai intensyviai naudojami.",
);
const USIMPORT: C = one(
  "ASV tirgus auto bieži nāk no izsolēm: pārbaudi bojājumu vēsturi pēc VIN un to, vai remonts veikts kvalitatīvi.",
  "US-market cars often come from auctions: check the damage history by VIN and the quality of any repairs.",
  "Автомобили с рынка США часто идут с аукционов: проверьте историю повреждений по VIN и качество ремонта.",
  "JAV rinkos automobiliai dažnai ateina iš aukcionų: patikrinkite žalos istoriją pagal VIN ir remonto kokybę.",
);
const USPARTS: C = one(
  "Pārbaudi rezerves daļu pieejamību un cenas Eiropā – dažām detaļām jāgaida piegāde.",
  "Check the availability and price of spare parts in Europe – some parts need to be ordered in.",
  "Проверьте доступность и цены запчастей в Европе — некоторые детали придётся ждать.",
  "Patikrinkite atsarginių dalių prieinamumą ir kainas Europoje – kai kurias dalis reikia užsakyti.",
);
const SOFT: C = one(
  "Pārbaudi virsbūves paneļu atstarpes un krāsojumu, piekares troksni un ekrāna darbību.",
  "Check the body panel gaps and paint, suspension noise and that the screen works.",
  "Проверьте зазоры кузовных панелей и покраску, шум подвески и работу экрана.",
  "Patikrinkite kėbulo plokščių tarpus ir dažus, pakabos triukšmą ir ekrano veikimą.",
);
const EAT: C = one(
  "EAT6/EAT8 automātiskajai kārbai pajautā par eļļas maiņu.",
  "On the EAT6/EAT8 automatic ask about oil changes.",
  "У автомата EAT6/EAT8 спросите о замене масла.",
  "EAT6/EAT8 automatinei dėžei paklauskite apie alyvos keitimą.",
);
const DCI: C = one(
  "1.5/1.6 dCi dīzeļiem pārbaudi sprauslas, turbīnu un dzesēšanas sistēmu; klausies motora troksni.",
  "On the 1.5/1.6 dCi diesels check the injectors, turbo and cooling system; listen to the engine.",
  "У дизелей 1.5/1.6 dCi проверьте форсунки, турбину и систему охлаждения; прислушайтесь к мотору.",
  "1.5/1.6 dCi dyzeliuose patikrinkite purkštukus, turbiną ir aušinimo sistemą; klausykitės variklio.",
);
const MINIPRINCE: C = one(
  "1.6 turbo benzīnam (Prince, apm. 2007–2013) pārbaudi sadales ķēdi un eļļas patēriņu.",
  "On the 1.6 turbo petrol (Prince, about 2007–2013) check the timing chain and oil consumption.",
  "У бензинового 1.6 турбо (Prince, примерно 2007–2013) проверьте цепь ГРМ и расход масла.",
  "1.6 turbo benzininiame (Prince, apie 2007–2013) patikrinkite grandinę ir alyvos sąnaudas.",
);
const LEAF: C = one(
  "Akumulators nav aktīvi dzesēts, tāpēc vecākām versijām degradācija var būt lielāka – pārbaudi akumulatora veselību (SOH).",
  "The battery is not actively cooled, so older cars can show more degradation – check the battery health (SOH).",
  "Батарея не имеет активного охлаждения, поэтому у старых версий деградация может быть выше — проверьте состояние батареи (SOH).",
  "Baterija neaušinama aktyviai, todėl senesnėse versijose degradacija gali būti didesnė – patikrinkite baterijos būklę (SOH).",
);

const same = (keys: string[], rules: Rule[]) => { for (const k of keys) MODEL_CHECKS[k] ??= rules; };

// Elektroauto
same(
  ["Tesla|Model 3", "Tesla|Model Y", "Tesla|Model S", "Tesla|Model X"],
  [r(EV, { f: "Elektro" }), r(SOFT, {})],
);
same(["Nissan|Leaf"], [r(LEAF, {}), r(EV, { f: "Elektro" })]);
same(
  ["Volkswagen|ID.3", "Volkswagen|ID.4", "Volkswagen|ID.5", "Škoda|Enyaq", "Audi|e-tron", "Audi|Q4 e-tron", "Cupra|Born", "Renault|Zoe", "Mercedes-Benz|EQC", "Mercedes-Benz|EQS", "Mercedes-Benz|EQE", "BMW|i3", "BMW|i4", "BMW|iX", "Porsche|Taycan", "Ford|Mustang Mach-E", "Hyundai|Ioniq", "Hyundai|Kona", "Kia|Niro"],
  [r(EV, { f: "Elektro" }), r(PHEV, { f: "Hibrīds" }), r(HYBRID, {}), r(RECALLS, {})],
);

// ASV tirgus auto
same(
  ["Chrysler|Pacifica", "Chrysler|Grand Voyager", "Chrysler|Voyager", "Chrysler|Town & Country", "Chrysler|300C", "Lancia|Voyager", "Dodge|Durango", "Dodge|RAM", "Dodge|Challenger", "Dodge|Charger", "Dodge|Grand Caravan", "Jeep|Wrangler", "Jeep|Cherokee", "Jeep|Compass", "Ford|Mustang", "Ford|Explorer", "Ford|F-150", "Ford|Edge", "Ford|Fusion", "Chevrolet|Camaro", "Chevrolet|Corvette", "Chevrolet|Captiva", "Chevrolet|Cruze", "Buick|Encore"],
  [r(USIMPORT, {}), r(USPARTS, {}), r(ELEC, {})],
);

// VAG kompakti un mazie krosoveri
same(
  ["Volkswagen|T-Roc", "Volkswagen|T-Cross", "Volkswagen|Taigo", "Volkswagen|Jetta", "Volkswagen|Beetle", "Volkswagen|Scirocco", "Volkswagen|Eos", "Volkswagen|Bora", "Volkswagen|Golf Sportsvan", "Škoda|Kamiq", "Škoda|Scala", "Škoda|Rapid", "Škoda|Yeti", "Škoda|Roomster", "Seat|Ibiza", "Seat|Altea", "Seat|Altea XL", "Seat|Arona", "Cupra|Formentor", "Audi|Q2", "Audi|A1", "Audi|TT"],
  [r(DQ200, { a: "Automāts" }), r(TSI14, { y: [2007, 2012], f: "Benzīns" }), r(DIESEL, { f: "Dīzelis" }), r(PHEV, { f: "Hibrīds" })],
);
// VAG lielie modeļi
same(
  ["Volkswagen|Arteon", "Volkswagen|Passat CC", "Volkswagen|Passat Alltrack", "Volkswagen|Tiguan Allspace", "Volkswagen|Tayron", "Volkswagen|Amarok", "Volkswagen|Caravelle", "Seat|Ateca", "Seat|Tarraco", "Seat|Alhambra", "Audi|Q8", "Audi|SQ5", "Audi|SQ7", "Audi|Q5 Sportback", "Audi|A5 Sportback", "Audi|A4 Allroad", "Audi|S4", "Audi|S5", "Audi|S6", "Audi|RS5", "Audi|80", "Audi|100", "Audi|quattro", "Škoda|Octavia Scout", "Volkswagen|Phaeton"],
  [r(DSGOIL, { a: "Automāts" }), r(DIESEL, { f: "Dīzelis" }), r(HALDEX, {}), r(PHEV, { f: "Hibrīds" })],
);
same(["Volkswagen|LT"], [r(DMF, {}), r(RUST, {}), r(WORKVAN, {})]);

// Komerciālie un furgoni
same(
  ["Peugeot|Boxer", "Peugeot|Partner", "Peugeot|Expert", "Peugeot|Rifter", "Citroën|Jumper", "Citroën|Jumpy", "Citroën|Berlingo", "Opel|Movano", "Opel|Combo", "Iveco|Daily", "Fiat|Doblo", "Nissan|Primastar", "Renault|Kangoo", "Ford|Transit Connect", "Ford|Tourneo Custom", "Ford|Tourneo Connect", "MAN|TGE", "Hyundai|H-1", "Mercedes-Benz|Viano"],
  [r(DMF, {}), r(RUST, {}), r(DIESEL, { f: "Dīzelis" }), r(WORKVAN, {})],
);
same(["Toyota|Hilux", "Ford|Ranger", "Nissan|Navara", "Mitsubishi|L200"], [r(RUST, {}), r(DIESEL, { f: "Dīzelis" }), r(x("Pārbaudi, vai pikaps nav izmantots smagam darbam: piekare, rāmis un pilnpiedziņa.", "Check whether the pickup was used for heavy work: suspension, frame and four-wheel drive.", "Проверьте, не использовался ли пикап на тяжёлых работах: подвеска, рама и полный привод.", "Patikrinkite, ar pikapas nebuvo naudotas sunkiems darbams: pakaba, rėmas ir visų ratų pavara."), {})]);

// Citroën / Peugeot / DS
same(
  ["Citroën|C4", "Citroën|C4 Picasso", "Citroën|C3", "Citroën|C3 Aircross", "Citroën|C4 Cactus", "Citroën|C5 Aircross", "Citroën|DS4", "Citroën|DS5", "Citroën|C-Crosser", "Peugeot|208", "Peugeot|207", "Peugeot|307", "Peugeot|407", "Peugeot|408", "Peugeot|206", "Peugeot|4007"],
  [r(PURETECH, { y: [2014, NOW], f: "Benzīns" }), r(THP, { y: [2007, 2015], f: "Benzīns" }), r(DIESEL, { f: "Dīzelis" }), r(EAT, { y: [2014, NOW], a: "Automāts" })],
);
same(
  ["Citroën|C5"],
  [r(x("Hidropneimatiskā (Hydractive) piekare: pārbaudi sfēras un noplūdes; remonts var būt dārgs.", "Hydractive hydropneumatic suspension: check the spheres and leaks; repairs can be costly.", "Гидропневматическая подвеска (Hydractive): проверьте сферы и течи; ремонт может быть дорогим.", "Hidropneumatinė (Hydractive) pakaba: patikrinkite sferas ir nuotėkius; remontas gali būti brangus."), { y: [2001, 2017] }), r(DIESEL, { f: "Dīzelis" }), r(ELEC, {})],
);

// Renault / Dacia
same(
  ["Renault|Scenic", "Renault|Grand Scenic", "Renault|Espace", "Renault|Clio", "Renault|Captur", "Renault|Kadjar", "Renault|Koleos", "Renault|Talisman", "Renault|Laguna", "Renault|Arkana", "Renault|Austral", "Dacia|Sandero", "Dacia|Lodgy"],
  [r(DCI, { f: "Dīzelis" }), r(DMF, { f: "Dīzelis" }), r(ELEC, {}), r(x("1.2/1.3 TCe benzīnam pārbaudi eļļas patēriņu un atsaukumus.", "On the 1.2/1.3 TCe petrol check oil consumption and recalls.", "У бензиновых 1.2/1.3 TCe проверьте расход масла и отзывы.", "1.2/1.3 TCe benzininiuose patikrinkite alyvos sąnaudas ir atšaukimus."), { y: [2012, NOW], f: "Benzīns" })],
);

// Opel
same(
  ["Opel|Grandland", "Opel|Crossland", "Opel|Antara", "Opel|Vectra", "Opel|Signum"],
  [r(PURETECH, { y: [2018, NOW], f: "Benzīns" }), r(DIESEL, { f: "Dīzelis" }), r(RUST, { y: [1995, 2008] })],
);

// Ford (pārējie)
same(
  ["Ford|EcoSport", "Ford|Puma", "Ford|Grand C-Max", "Ford|B-Max"],
  [r(x("1.0 EcoBoost (apm. 2012–2019): pārbaudi dzesēšanas sistēmu un atsaukumus.", "1.0 EcoBoost (about 2012–2019): check the cooling system and recalls.", "1.0 EcoBoost (примерно 2012–2019): проверьте систему охлаждения и отзывы.", "1.0 EcoBoost (apie 2012–2019): patikrinkite aušinimo sistemą ir atšaukimus."), { y: [2012, 2019], f: "Benzīns" }), r(x("Powershift robotizētajai kārbai (ja ir) pārbaudi raustīšanos un kļūdas.", "On the Powershift dual-clutch (if fitted) check for judder and faults.", "У роботизированной коробки Powershift (если есть) проверьте рывки и ошибки.", "Powershift robotizuotoje dėžėje (jei yra) patikrinkite trūkčiojimą ir klaidas."), { a: "Automāts" }), r(DIESEL, { f: "Dīzelis" })],
);

// Japāņu un korejiešu modeļi
same(
  ["Mitsubishi|Pajero", "Mitsubishi|ASX", "Mitsubishi|Eclipse Cross", "Mitsubishi|Lancer", "Mitsubishi|Colt", "Nissan|Murano", "Nissan|Patrol", "Nissan|Pathfinder", "Nissan|Note", "Nissan|Micra", "Nissan|Pulsar", "Nissan|Qashqai+2", "Suzuki|Vitara", "Suzuki|SX4", "Suzuki|Swift", "Mazda|3", "Mazda|5", "Mazda|CX-3", "Mazda|CX-7", "Mazda|CX-30", "Honda|HR-V", "Honda|Accord", "Honda|Jazz", "Honda|CR", "Toyota|Camry", "Toyota|Highlander", "Toyota|Sienna", "Toyota|Corolla Cross", "Toyota|Yaris Cross", "Toyota|Aygo", "Toyota|Corolla Verso", "Subaru|XV", "Subaru|Legacy", "Subaru|Impreza", "Lexus|IS", "Lexus|CT", "Lexus|ES", "Lexus|GS", "Lexus|UX", "Lexus|LS", "Kia|Optima", "Kia|Carens", "Kia|XCeed", "Kia|ProCeed", "Hyundai|ix35", "Hyundai|i40", "Hyundai|i20"],
  [r(HYBRID, { f: "Hibrīds" }), r(CVT, { a: "Automāts" }), r(DIESEL, { f: "Dīzelis" }), r(RUST, { y: [1995, 2008] }), r(RECALLS, {})],
);

// Premium un citi
same(["Mini|Cooper", "Mini|Cooper S", "Mini|One", "Mini|Clubman"], [r(MINIPRINCE, { y: [2007, 2013], f: "Benzīns" }), r(x("Pārbaudi dzesēšanas sistēmu, eļļas noplūdes un piekares detaļas.", "Check the cooling system, oil leaks and the suspension parts.", "Проверьте систему охлаждения, течи масла и детали подвески.", "Patikrinkite aušinimo sistemą, alyvos nuotėkius ir pakabos dalis."), {}), r(DIESEL, { f: "Dīzelis" })]);
same(
  ["Jaguar|XF", "Jaguar|XJ", "Jaguar|F-Pace", "Land Rover|Discovery", "Land Rover|Discovery Sport", "Land Rover|Range Rover Velar", "Land Rover|Range Rover Evoque", "Land Rover|Freelander", "Land Rover|Defender"],
  [r(ELEC, {}), r(AIR, {}), r(DIESEL, { f: "Dīzelis" }), r(x("Dārga apkope un remonts – pārbaudi pilnu apkopju vēsturi un rēķinu par nolietotajām daļām.", "Servicing and repairs are expensive – ask for the full service history and costs of worn parts.", "Обслуживание и ремонт дорогие — запросите полную историю обслуживания и расходы на изношенные детали.", "Priežiūra ir remontas brangūs – paprašykite pilnos priežiūros istorijos ir susidėvėjusių dalių išlaidų."), {})],
);
same(["Mercedes-Benz|GLS", "Mercedes-Benz|GLK", "Mercedes-Benz|GLA", "Mercedes-Benz|GLB", "Mercedes-Benz|G klase", "Mercedes-Benz|SL", "Mercedes-Benz|CLK", "Mercedes-Benz|R klase", "Mercedes-Benz|AMG GT"], [r(AIR, { y: [2005, NOW] }), r(DIESEL, { f: "Dīzelis" }), r(ELEC, {}), r(PHEV, { f: "Hibrīds" })]);
same(["Porsche|Cayenne Coupe", "Porsche|Panamera", "Porsche|911"], [r(x("Dārga apkope: pārbaudi apkopju vēsturi, bremzes un piekari.", "Servicing is expensive: check the service history, brakes and suspension.", "Обслуживание дорогое: проверьте историю обслуживания, тормоза и подвеску.", "Priežiūra brangi: patikrinkite priežiūros istoriją, stabdžius ir pakabą."), {}), r(PHEV, { f: "Hibrīds" }), r(ELEC, {})]);
same(["BMW|2. sērija", "BMW|6. sērija", "BMW|X2", "BMW|X7", "BMW|M2", "BMW|M3", "BMW|M4", "BMW|M5", "BMW|M8", "BMW|8. sērija", "BMW|X6 M", "BMW|Z4"], [r(N47, { y: [2007, 2015], f: "Dīzelis" }), r(B47, { y: [2015, NOW], f: "Dīzelis" }), r(PHEV, { f: "Hibrīds" }), r(ELEC, {})]);
same(["Saab|9-3", "Alfa Romeo|Stelvio", "Alfa Romeo|159", "Volvo|C30", "Volvo|S40", "Volvo|S90", "Volvo|V90 Cross Country", "Volvo|V60 Cross Country", "Volvo|S60"], [r(DIESEL, { f: "Dīzelis" }), r(HALDEX, {}), r(RUST, { y: [1995, 2008] }), r(ELEC, {})]);

same(["Fiat|500"], [
  r(one("Dualogic robotizētajai kārbai (ja ir) pārbaudi raustīšanos un pārslēgšanās kļūdas.", "On the Dualogic automated manual (if fitted) check for jerking and shift faults.", "У роботизированной коробки Dualogic (если есть) проверьте рывки и ошибки переключения.", "Dualogic robotizuotoje dėžėje (jei yra) patikrinkite trūkčiojimą ir perjungimo klaidas."), { a: "Automāts" }),
  r(one("0.9 TwinAir benzīnam pārbaudi eļļas patēriņu un turbīnu; klausies motora troksni.", "On the 0.9 TwinAir petrol check the oil consumption and turbo; listen to the engine.", "У бензинового 0.9 TwinAir проверьте расход масла и турбину; прислушайтесь к мотору.", "0.9 TwinAir benzininiame patikrinkite alyvos sąnaudas ir turbiną; klausykitės variklio."), { f: "Benzīns" }),
  r(RUST, { y: [2007, 2016] }),
]);

// --- izvēle pēc konkrētā sludinājuma / modeļa lapai ---
const fuelOf = (f?: string | null): Fuel | null =>
  !f ? null : f === "Dīzelis" || f === "Hibrīds" || f === "Elektro" ? f : f.startsWith("Benzīns") ? "Benzīns" : null;

/** Vai noteikumu vispār var parādīt modelim (ir kāds noteikums). */
export const hasChecks = (make: string, model: string) => (MODEL_CHECKS[`${make}|${model}`]?.length ?? 0) > 0;

/** Sludinājumam piemērotie noteikumi (paaudzes kodi gens = tās, kas atbilst gadam). Trūkstošs gads/degviela/kārba → attiecīgie noteikumi izlaisti. */
export function checksFor(
  make: string,
  model: string,
  ctx: { year?: number | null; fuel?: string | null; gearbox?: string | null; gens: string[] },
  locale: Locale,
): string[] {
  const rules = MODEL_CHECKS[`${make}|${model}`] ?? [];
  const fuel = fuelOf(ctx.fuel);
  const out: string[] = [];
  for (const rule of rules) {
    if (rule.g && !(ctx.gens.length > 0 && rule.g.some((c) => ctx.gens.includes(c)))) continue;
    if (rule.y && !(ctx.year && ctx.year >= rule.y[0] && ctx.year <= rule.y[1])) continue;
    if (rule.f && rule.f !== fuel) continue;
    if (rule.a && rule.a !== ctx.gearbox) continue;
    for (const line of rule.c[locale] ?? rule.c.lv) if (!out.includes(line)) out.push(line);
  }
  return out.slice(0, CHECKS_MAX);
}

/** Modeļa lapai: visi noteikumi, grupēti pa paaudzēm / gadiem (bez nosacījumiem = „visām”). */
export function checkGroups(make: string, model: string, locale: Locale, t: (s: string) => string): { label: string | null; lines: string[] }[] {
  const rules = MODEL_CHECKS[`${make}|${model}`] ?? [];
  const groups = new Map<string | null, string[]>();
  for (const rule of rules) {
    const base = rule.g ? rule.g.join(", ") : rule.y ? `${rule.y[0]}–${rule.y[1] >= NOW ? t("šobrīd") : rule.y[1]}` : null;
    const extra = [rule.f ? t(rule.f) : null, rule.a ? t(rule.a) : null].filter(Boolean).join(", ");
    const label = base && extra ? `${base} · ${extra}` : base ?? (extra || null);
    const list = groups.get(label) ?? groups.set(label, []).get(label)!;
    for (const line of rule.c[locale] ?? rule.c.lv) if (!list.includes(line)) list.push(line);
  }
  return [...groups.entries()].map(([label, lines]) => ({ label, lines })).sort((a, b) => (a.label === null ? -1 : b.label === null ? 1 : 0));
}
