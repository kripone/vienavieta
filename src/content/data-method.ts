// Lapa „Dati un metodoloģija” (/dati) visās valodās: no kurienes nāk skaitļi un kā tos rēķinām.
// Mainot aprēķinu (mediāna, dublikāti, sliekšņi), atjauno arī šo tekstu.
import type { Locale } from "@/i18n/core";

type Doc = {
  title: string;
  description: string;
  intro: string;
  sourcesH: string;
  sourcesNote: string;
  colSource: string;
  colVehicles: string;
  colProperty: string;
  sections: { h: string; p: string[] }[];
  citeH: string;
  cite: string;
};

export const DATA_METHOD: Record<Locale, Doc> = {
  lv: {
    title: "Dati un metodoloģija",
    description: "No kurienes nāk VienāVietā sludinājumi un cenu statistika, kā skaitām mediānu, kvadrātmetra cenu, cenu kritumus un dublikātus.",
    intro: "VienāVietā ir meklētājs, kas vienā vietā apvieno auto un nekustamā īpašuma sludinājumus no vairākiem Latvijas un Lietuvas portāliem. Šeit aprakstīts, no kurienes nāk dati un kā tiek rēķināti skaitļi, kurus rādām lapās, cenu kartē un mēneša tirgus pārskatos.",
    sourcesH: "Datu avoti",
    sourcesNote: "Aktīvo sludinājumu skaits šobrīd pa avotiem. Papildus izmantojam Valsts zemes dienesta datus par darījumiem ar dzīvokļiem (data.gov.lv, licence CC BY 4.0), kas parāda reālās darījumu cenas.",
    colSource: "Avots",
    colVehicles: "Transports",
    colProperty: "Īpašumi",
    sections: [
      { h: "Ko ņemam no citiem portāliem", p: [
        "Tikai faktus: marku, modeli, gadu, cenu, platību, istabu skaitu, vietu, saiti uz oriģinālo sludinājumu un sīktēla adresi. Pārdevēju aprakstus un kontaktus neņemam, un bildes neglabājam. Virsrakstus veidojam paši no faktiem.",
        "Jaunākos sludinājumus pārbaudām vairākas reizes stundā, bet pilnu katra portāla pārbaudi veicam reizi diennaktī. Sludinājums, kas oriģinālajā portālā vairs nav atrodams, pie mums tiek noņemts.",
      ] },
      { h: "Dublikāti", p: [
        "Viens un tas pats auto vai dzīvoklis bieži ir ievietots vairākos portālos. Šādus sludinājumus apvienojam grupā pēc faktiem (marka, modelis, gads, nobraukums vai adrese, platība, cena). Sarakstā rādām vienu kartīti ar saitēm uz visiem portāliem, un statistikā objekts skaitās vienreiz.",
      ] },
      { h: "Mediāna", p: [
        "Cenu kopsavilkumos rādām mediānu, nevis vidējo aritmētisko: puse sludinājumu ir lētāki par mediānu un puse dārgāki. Mediānu neizkropļo atsevišķi ļoti dārgi vai kļūdaini sludinājumi. Sludinājumi bez cenas vai ar cenu 0 netiek skaitīti.",
      ] },
      { h: "Kvadrātmetra cena", p: [
        "Kvadrātmetra cena ir sludinājuma cena, dalīta ar platību; skaitām tikai sludinājumus ar platību virs 10 m². Īrei tā ir mēneša īres maksa par kvadrātmetru.",
        "Cenu kartē katra vieta (Rīgas apkaime, pilsēta vai pagasts) parādīta tikai tad, ja tajā ir vismaz 5 aktīvi sludinājumi. Krāsu pakāpes ir kvintiles: katrā pakāpē ir aptuveni piektā daļa vietu.",
      ] },
      { h: "Cenu kritumi", p: [
        "Katra sludinājuma cenu saglabājam brīdī, kad to pirmo reizi redzam, un pēc katras izmaiņas. „Cenu kritums” nozīmē, ka pašreizējā cena ir zemāka par sākuma cenu; „pēdējās 30 dienās” — ka cena mainīta šajā laikā. Procents ir aprēķināts no sākuma cenas.",
      ] },
      { h: "Ierobežojumi", p: [
        "Sludinājumu cenas ir piedāvājuma cenas, nevis darījumu cenas. Reālās darījumu cenas dzīvokļiem rādām no VZD datiem, kas publicēti ar dažu mēnešu nobīdi.",
        "Transportam vieta parasti zināma tikai pilsētas vai novada līmenī. Lapas, kurās ir mazāk nekā 3 sludinājumi, meklētājiem nerādām, jo tik mazs skaits neko neizsaka.",
        "Mēneša pārskatā skaitām visus sludinājumus, kas tajā mēnesī bija pieejami; kamēr mēnesis turpinās, skaitļi mainās katru dienu.",
      ] },
    ],
    citeH: "Citēšana",
    cite: "Skaitļus drīkst citēt, norādot avotu „VienāVietā (vienavieta.lv)” un datumu, jo dati mainās katru dienu. Jautājumiem par datiem raksti uz info@vienavieta.lv.",
  },
  en: {
    title: "Data and methodology",
    description: "Where VienāVietā listings and price statistics come from, and how we calculate medians, price per square metre, price drops and duplicates.",
    intro: "VienāVietā is a search engine that brings together car and real estate listings from several Latvian and Lithuanian portals. This page explains where the data comes from and how we calculate the figures shown on our pages, the price map and the monthly market reports.",
    sourcesH: "Data sources",
    sourcesNote: "Number of active listings by source right now. We also use State Land Service data on apartment transactions (data.gov.lv, licence CC BY 4.0), which show actual transaction prices.",
    colSource: "Source",
    colVehicles: "Vehicles",
    colProperty: "Property",
    sections: [
      { h: "What we take from other portals", p: [
        "Only facts: make, model, year, price, area, number of rooms, location, a link to the original listing and the thumbnail address. We do not take sellers' descriptions or contact details, and we do not store photos. Titles are generated by us from the facts.",
        "The newest listings are checked several times an hour, and a full check of each portal runs once a day. A listing that can no longer be found on the original portal is removed from our site.",
      ] },
      { h: "Duplicates", p: [
        "The same car or apartment is often listed on several portals. We group such listings by their facts (make, model, year, mileage or address, area, price). The list shows one card with links to all portals, and the object is counted once in the statistics.",
      ] },
      { h: "Median", p: [
        "Price summaries show the median, not the arithmetic mean: half of the listings are cheaper than the median and half are more expensive. The median is not distorted by a few very expensive or mistaken listings. Listings without a price or with a price of 0 are not counted.",
      ] },
      { h: "Price per square metre", p: [
        "The price per square metre is the listing price divided by the area; only listings with an area above 10 m² are counted. For rentals it is the monthly rent per square metre.",
        "On the price map a place (a Riga neighbourhood, town or parish) is shown only if it has at least 5 active listings. The colour steps are quintiles: each step contains roughly one fifth of the places.",
      ] },
      { h: "Price drops", p: [
        "We record each listing's price when we first see it and after every change. A \"price drop\" means the current price is lower than the starting price; \"in the last 30 days\" means the price changed within that period. The percentage is calculated from the starting price.",
      ] },
      { h: "Limitations", p: [
        "Listing prices are asking prices, not transaction prices. Actual apartment transaction prices come from State Land Service data, which is published with a delay of a few months.",
        "For vehicles the location is usually known only at the town or municipality level. Pages with fewer than 3 listings are not shown to search engines, as such small numbers say little.",
        "The monthly report counts all listings available during that month; while the month is in progress the figures change every day.",
      ] },
    ],
    citeH: "Citing",
    cite: "You may quote the figures if you name the source \"VienāVietā (vienavieta.lv)\" and the date, as the data changes daily. Questions about the data: info@vienavieta.lv.",
  },
  ru: {
    title: "Данные и методология",
    description: "Откуда берутся объявления и ценовая статистика VienāVietā и как мы считаем медиану, цену за квадратный метр, снижения цен и дубликаты.",
    intro: "VienāVietā — поисковик, который собирает в одном месте объявления о продаже автомобилей и недвижимости с нескольких порталов Латвии и Литвы. Здесь описано, откуда берутся данные и как рассчитываются цифры на страницах, на карте цен и в ежемесячных обзорах рынка.",
    sourcesH: "Источники данных",
    sourcesNote: "Число активных объявлений по источникам на данный момент. Также мы используем данные Государственной земельной службы о сделках с квартирами (data.gov.lv, лицензия CC BY 4.0), которые показывают реальные цены сделок.",
    colSource: "Источник",
    colVehicles: "Транспорт",
    colProperty: "Недвижимость",
    sections: [
      { h: "Что мы берём с других порталов", p: [
        "Только факты: марку, модель, год, цену, площадь, число комнат, место, ссылку на оригинальное объявление и адрес миниатюры. Описания и контакты продавцов мы не берём и фотографии не храним. Заголовки составляем сами из фактов.",
        "Новые объявления проверяем несколько раз в час, полную проверку каждого портала проводим раз в сутки. Объявление, которого больше нет на исходном портале, удаляется и у нас.",
      ] },
      { h: "Дубликаты", p: [
        "Один и тот же автомобиль или квартира часто размещены на нескольких порталах. Такие объявления мы объединяем в группу по фактам (марка, модель, год, пробег или адрес, площадь, цена). В списке показываем одну карточку со ссылками на все порталы, а в статистике объект считается один раз.",
      ] },
      { h: "Медиана", p: [
        "В сводках цен мы показываем медиану, а не среднее арифметическое: половина объявлений дешевле медианы, половина дороже. Медиану не искажают отдельные очень дорогие или ошибочные объявления. Объявления без цены или с ценой 0 не учитываются.",
      ] },
      { h: "Цена за квадратный метр", p: [
        "Цена за квадратный метр — это цена объявления, делённая на площадь; учитываются только объявления с площадью более 10 м². Для аренды это месячная плата за квадратный метр.",
        "На карте цен место (район Риги, город или волость) показано, только если в нём не менее 5 активных объявлений. Цветовые ступени — квинтили: в каждой примерно пятая часть мест.",
      ] },
      { h: "Снижения цен", p: [
        "Цену каждого объявления мы сохраняем, когда видим его впервые, и после каждого изменения. «Снижение цены» значит, что текущая цена ниже начальной; «за последние 30 дней» — что цена менялась в этот период. Процент считается от начальной цены.",
      ] },
      { h: "Ограничения", p: [
        "Цены объявлений — это цены предложения, а не цены сделок. Реальные цены сделок с квартирами берутся из данных Государственной земельной службы, которые публикуются с задержкой в несколько месяцев.",
        "Для транспорта место обычно известно только на уровне города или края. Страницы, где меньше 3 объявлений, поисковикам не показываются, так как такое малое число мало что говорит.",
        "В ежемесячном обзоре учитываются все объявления, доступные в этом месяце; пока месяц не закончился, цифры меняются каждый день.",
      ] },
    ],
    citeH: "Цитирование",
    cite: "Цифры можно цитировать, указав источник «VienāVietā (vienavieta.lv)» и дату, так как данные меняются ежедневно. Вопросы о данных: info@vienavieta.lv.",
  },
  lt: {
    title: "Duomenys ir metodika",
    description: "Iš kur gaunami VienāVietā skelbimai ir kainų statistika, kaip skaičiuojame medianą, kvadratinio metro kainą, kainų sumažinimus ir dublikatus.",
    intro: "VienāVietā – paieškos sistema, vienoje vietoje surenkanti automobilių ir nekilnojamojo turto skelbimus iš kelių Latvijos ir Lietuvos portalų. Čia aprašyta, iš kur gaunami duomenys ir kaip skaičiuojami skaičiai, rodomi puslapiuose, kainų žemėlapyje ir mėnesio rinkos apžvalgose.",
    sourcesH: "Duomenų šaltiniai",
    sourcesNote: "Aktyvių skelbimų skaičius pagal šaltinius šiuo metu. Taip pat naudojame Latvijos valstybinės žemės tarnybos duomenis apie sandorius su butais (data.gov.lv, licencija CC BY 4.0), rodančius tikrąsias sandorių kainas.",
    colSource: "Šaltinis",
    colVehicles: "Transportas",
    colProperty: "Nekilnojamasis turtas",
    sections: [
      { h: "Ką imame iš kitų portalų", p: [
        "Tik faktus: markę, modelį, metus, kainą, plotą, kambarių skaičių, vietą, nuorodą į originalų skelbimą ir miniatiūros adresą. Pardavėjų aprašymų ir kontaktų neimame, nuotraukų nesaugome. Pavadinimus sudarome patys iš faktų.",
        "Naujausius skelbimus tikriname kelis kartus per valandą, o kiekvieną portalą visiškai patikriname kartą per parą. Skelbimas, kurio originaliame portale nebėra, pašalinamas ir pas mus.",
      ] },
      { h: "Dublikatai", p: [
        "Tas pats automobilis ar butas dažnai skelbiamas keliuose portaluose. Tokius skelbimus jungiame į grupę pagal faktus (markė, modelis, metai, rida arba adresas, plotas, kaina). Sąraše rodome vieną kortelę su nuorodomis į visus portalus, o statistikoje objektas skaičiuojamas vieną kartą.",
      ] },
      { h: "Mediana", p: [
        "Kainų suvestinėse rodome medianą, o ne aritmetinį vidurkį: pusė skelbimų pigesni už medianą, pusė – brangesni. Medianos neiškreipia pavieniai labai brangūs ar klaidingi skelbimai. Skelbimai be kainos arba su kaina 0 neskaičiuojami.",
      ] },
      { h: "Kvadratinio metro kaina", p: [
        "Kvadratinio metro kaina – skelbimo kaina, padalyta iš ploto; skaičiuojami tik skelbimai, kurių plotas didesnis nei 10 m². Nuomai tai mėnesio nuomos kaina už kvadratinį metrą.",
        "Kainų žemėlapyje vieta (Rygos mikrorajonas, miestas ar valsčius) rodoma tik tada, jei joje yra bent 5 aktyvūs skelbimai. Spalvų pakopos yra kvintiliai: kiekvienoje pakopoje maždaug penktadalis vietų.",
      ] },
      { h: "Kainų sumažinimai", p: [
        "Kiekvieno skelbimo kainą išsaugome, kai pirmą kartą jį pamatome, ir po kiekvieno pakeitimo. „Kainos sumažinimas“ reiškia, kad dabartinė kaina mažesnė už pradinę; „per paskutines 30 dienų“ – kad kaina keista per šį laikotarpį. Procentas skaičiuojamas nuo pradinės kainos.",
      ] },
      { h: "Apribojimai", p: [
        "Skelbimų kainos yra siūlomos, o ne sandorių kainos. Tikrosios butų sandorių kainos imamos iš Valstybinės žemės tarnybos duomenų, skelbiamų kelių mėnesių vėlavimu.",
        "Transportui vieta paprastai žinoma tik miesto ar savivaldybės lygmeniu. Puslapiai, kuriuose mažiau nei 3 skelbimai, paieškos sistemoms nerodomi, nes toks mažas skaičius mažai ką pasako.",
        "Mėnesio apžvalgoje skaičiuojami visi tą mėnesį prieinami skelbimai; kol mėnuo tęsiasi, skaičiai keičiasi kasdien.",
      ] },
    ],
    citeH: "Citavimas",
    cite: "Skaičius galima cituoti nurodant šaltinį „VienāVietā (vienavieta.lv)“ ir datą, nes duomenys keičiasi kasdien. Klausimai apie duomenis: info@vienavieta.lv.",
  },
};
