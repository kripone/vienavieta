// Juridiskās lapas visās valodās (/privatums, /noteikumi, /par-mums).
// Vietturi: {operator} {email} {address} {regno} {limit} {reports} — aizpilda no OPERATOR (src/lib/constants.ts).
// Pirms palaišanas tekstus jāpārskata juristam.
import type { Locale } from "@/i18n/core";

export type LegalDoc = { title: string; intro: string; sections: { h: string; p: string[] }[] };
type Docs = { privacy: LegalDoc; terms: LegalDoc; about: LegalDoc; updated: string; placeholder: string; operatorH: string; operatorRows: [string, string][]; footer: { about: string; terms: string; privacy: string; sources: string } };

export const LEGAL: Record<Locale, Docs> = {
  lv: {
    updated: "Spēkā no",
    placeholder: "tiks norādīts",
    operatorH: "Pakalpojuma sniedzējs",
    operatorRows: [["Nosaukums / vārds", "{operator}"], ["Reģistrācijas numurs", "{regno}"], ["Adrese", "{address}"], ["E-pasts", "{email}"]],
    footer: { about: "Par mums", terms: "Lietošanas noteikumi", privacy: "Privātuma politika", sources: "Datu avoti" },
    privacy: {
      title: "Privātuma politika",
      intro: "Šeit skaidrots, kādus personas datus VienāVietā apstrādā, kāpēc un kā tu vari izmantot savas tiesības.",
      sections: [
        { h: "Pārzinis", p: ["Personas datu pārzinis ir {operator}. Jautājumiem par datiem raksti uz {email}."] },
        { h: "Kādus datus apstrādājam", p: [
          "Konta dati: e-pasta adrese, vārds, tālrunis (ja to norādi), uzņēmuma nosaukums saloniem un aģentūrām.",
          "Tavs saturs: sludinājumi, bildes, favorīti, saglabātās meklēšanas, sūdzības un salonu plūsmu saites.",
          "Tehniskie dati: IP adrese un pārlūka informācija pieteikšanās drošībai un ļaunprātības novēršanai, kā arī servera žurnāli.",
        ] },
        { h: "Kāpēc un uz kāda pamata", p: [
          "Lai sniegtu pakalpojumu (līguma izpilde): konts, sludinājumu publicēšana, favorīti, salonu imports.",
          "E-pasta paziņojumi par jauniem sludinājumiem un cenu kritumiem tiek sūtīti tikai tad, ja tos ieslēdz pats; atrakstīties var ar saiti katrā vēstulē.",
          "Leģitīmās intereses: drošība, krāpšanas un surogātpasta novēršana, moderācija.",
        ] },
        { h: "Kas redz tavus datus", p: [
          "Publiski redzams ir sludinājums un pārdevēja vārds vai uzņēmuma nosaukums. Tālruni un e-pastu rādām tikai pēc pogas „Rādīt tālruni”.",
          "Pakalpojuma nodrošināšanai izmantojam apstrādātājus: Render (serveri un datubāze, ES), Cloudflare (bilžu glabāšana), Brevo (e-pastu sūtīšana), Google (kartes un adrešu noteikšana; atverot karti, pārlūks sazinās ar Google serveriem). Ja ieslēdz paziņojumus ierīcē, tie tiek piegādāti caur tava pārlūka vai telefona ražotāja push servisu (Google, Apple, Mozilla vai Microsoft); glabājam tikai ierīces abonementa adresi un valodu, un tos var izslēgt sadaļā Paziņojumi. Cloudflare nodrošina arī domēna DNS un e-pastu pāradresāciju uz info@vienavieta.lv. Apmeklējumu statistikai izmantojam Cloudflare Web Analytics: tā neizmanto sīkdatnes un neseko atsevišķiem apmeklētājiem, mēs redzam tikai kopējus skaitļus (lapu skatījumi, valstis, ierīču un pārlūku veidi). Ja lapā rodas kļūda, saglabājam kļūdas aprakstu, lapas adresi un pārlūka veidu, lai to izlabotu (bez IP adreses).",
          "Datus nepārdodam un nenododam reklāmdevējiem.",
        ] },
        { h: "Sludinājumi no citiem portāliem", p: [
          "No publiski pieejamiem sludinājumiem citos portālos (piem. ss.com) rādām tikai faktus (marka, gads, cena, platība, vieta) un saiti uz oriģinālu. Pārdevēju kontaktus un aprakstus neņemam. Sīktēli tiek ielādēti tieši no avota servera.",
          "Ja tavs sludinājums no cita portāla redzams pie mums un vēlies to noņemt, raksti uz {email}.",
        ] },
        { h: "Cik ilgi glabājam", p: [
          "Konta datus — kamēr konts ir aktīvs. Pēc konta dzēšanas pieprasījuma datus dzēšam 30 dienu laikā, ja vien likums neprasa glabāt ilgāk.",
          "Dzēstu sludinājumu cenu vēsturi var glabāt anonīmi tirgus statistikai.",
        ] },
        { h: "Sīkdatnes", p: [
          "Izmantojam tikai darbībai nepieciešamās sīkdatnes: pieteikšanās sesija un izvēlētā valoda. Tēmu un salīdzināmos sludinājumus glabājam tavā pārlūkā. Analītikas un reklāmas sīkdatņu nav, tāpēc piekrišana nav vajadzīga.",
        ] },
        { h: "Tavas tiesības", p: [
          "Tev ir tiesības piekļūt saviem datiem, tos labot, dzēst, ierobežot apstrādi, iebilst un saņemt tos pārnešanai. Raksti uz {email}; atbildēsim mēneša laikā.",
          "Ja uzskati, ka dati apstrādāti nelikumīgi, vari iesniegt sūdzību Datu valsts inspekcijai (www.dvi.gov.lv).",
        ] },
        { h: "Izmaiņas", p: ["Par būtiskām izmaiņām paziņosim portālā. Spēkā esošā versija vienmēr ir šajā lapā."] },
      ],
    },
    terms: {
      title: "Lietošanas noteikumi",
      intro: "Lietojot VienāVietā, tu piekrīti šiem noteikumiem.",
      sections: [
        { h: "Pakalpojums", p: ["VienāVietā ir sludinājumu portāls un meklētājs, kas vienuviet rāda lietotāju sludinājumus un sludinājumus no citiem portāliem. Pakalpojumu sniedz {operator}."] },
        { h: "Konts", p: [
          "Pieteikšanās notiek ar saiti e-pastā. Viena persona drīkst izmantot vienu kontu. Tu atbildi par darbībām savā kontā un par to, lai profila dati būtu patiesi.",
          "Saloniem un aģentūrām profilā jānorāda uzņēmuma nosaukums.",
        ] },
        { h: "Sludinājumi", p: [
          "Ievieto tikai patiesu informāciju par to, ko drīksti pārdot vai izīrēt, un bildes, uz kurām tev ir tiesības.",
          "Aizliegts: nelikumīgas preces un pakalpojumi, krāpšana, maldinošas cenas, viena objekta dublikāti, svešu personas datu publicēšana, surogātpasts un aizskarošs saturs.",
          "Vienā dienā var ievietot līdz {limit} sludinājumiem.",
          "Ievietojot sludinājumu, tu atļauj mums to rādīt, glabāt un parādīt meklētājos, kamēr tas ir publicēts.",
        ] },
        { h: "Salonu imports", p: ["Salons, kas pievieno sludinājumu plūsmu, atbild par tās saturu un par tiesībām uz bildēm. Plūsmas sludinājumiem piemēro tos pašus noteikumus."] },
        { h: "Sludinājumi no citiem portāliem", p: [
          "Šiem sludinājumiem rādām tikai faktus un saiti uz oriģinālu. Par to saturu atbild sludinājuma publicētājs oriģinālajā portālā; darījumu slēdz tieši ar pārdevēju.",
        ] },
        { h: "Ziņošana un moderācija", p: [
          "Par jebkuru sludinājumu var ziņot ar pogu „Ziņot par sludinājumu”. Pēc {reports} sūdzībām sludinājums tiek paslēpts, līdz to pārbauda moderators.",
          "Ja noņemam tavu sludinājumu vai bloķējam kontu, paziņosim iemeslu. Ja nepiekrīti, raksti uz {email}, un lēmumu pārskatīsim.",
          "Kontaktpunkts iestādēm un lietotājiem saskaņā ar Digitālo pakalpojumu aktu: {email} (latviski vai angliski).",
        ] },
        { h: "Atbildība", p: [
          "Mēs neesam darījuma puse starp pircēju un pārdevēju. Pirms maksājuma pārliecinies par preci un pārdevēju.",
          "Cenu novērtējumi, tirgus statistika, sludinājumu vēsture un VZD darījumu dati ir informatīvi; negarantējam to pilnīgumu un precizitāti.",
        ] },
        { h: "Maksas pakalpojumi", p: ["Pašlaik portāls ir bezmaksas. Ja ieviesīsim maksas pakalpojumus, to noteikumi tiks pievienoti šeit pirms ieviešanas."] },
        { h: "Izmaiņas un strīdi", p: [
          "Noteikumus varam mainīt; par būtiskām izmaiņām paziņosim portālā. Strīdus vispirms risinām sarunās, rakstot uz {email}.",
        ] },
      ],
    },
    about: {
      title: "Par VienāVietā",
      intro: "VienāVietā ir meklētājs, kurā vienuviet redzami transporta sludinājumi Latvijā un Lietuvā un nekustamā īpašuma sludinājumi Latvijā: gan ievietotie pie mums, gan no citiem portāliem.",
      sections: [
        { h: "Datu avoti", p: [
          "ss.com: sludinājumu fakti un saites uz oriģinālu; sīktēli tiek ielādēti no ss.com servera.",
          "Valsts zemes dienests, NĪTIS darījumu dati (data.gov.lv, licence CC BY 4.0): dzīvokļu pirkuma darījumu cenas.",
          "Kartes: Google Maps. Adrešu noteikšana: Google Geocoding.",
          "Salonu un aģentūru sludinājumi no viņu pašu plūsmām.",
        ] },
        { h: "Kontakti", p: ["Jautājumi, ierosinājumi un sadarbība: {email}."] },
      ],
    },
  },

  en: {
    updated: "Effective from",
    placeholder: "to be added",
    operatorH: "Service provider",
    operatorRows: [["Name", "{operator}"], ["Registration number", "{regno}"], ["Address", "{address}"], ["Email", "{email}"]],
    footer: { about: "About", terms: "Terms of use", privacy: "Privacy policy", sources: "Data sources" },
    privacy: {
      title: "Privacy policy",
      intro: "This page explains what personal data VienāVietā processes, why, and how you can exercise your rights.",
      sections: [
        { h: "Controller", p: ["The data controller is {operator}. For questions about your data, write to {email}."] },
        { h: "What data we process", p: [
          "Account data: email address, name, phone (if you add it), company name for dealers and agencies.",
          "Your content: listings, photos, favourites, saved searches, reports and dealer feed links.",
          "Technical data: IP address and browser information for login security and abuse prevention, and server logs.",
        ] },
        { h: "Why and on what basis", p: [
          "To provide the service (performance of a contract): account, publishing listings, favourites, dealer import.",
          "Email alerts about new listings and price drops are sent only if you switch them on; every email has an unsubscribe link.",
          "Legitimate interests: security, preventing fraud and spam, moderation.",
        ] },
        { h: "Who sees your data", p: [
          "Your listing and your name or company name are public. Phone and email are shown only after pressing “Show phone”.",
          "We use processors to run the service: Render (servers and database, EU), Cloudflare (photo storage), Brevo (email delivery), Google (maps and address lookup; opening the map connects your browser to Google servers). If you turn on notifications on a device, they are delivered through your browser or phone maker's push service (Google, Apple, Mozilla or Microsoft); we only store the device subscription address and language, and you can turn them off under Notifications. Cloudflare also provides the domain's DNS and forwards email sent to info@vienavieta.lv. For visit statistics we use Cloudflare Web Analytics: it uses no cookies and does not track individual visitors; we only see totals (page views, countries, device and browser types). If a page error occurs, we store the error description, page address and browser type to fix it (no IP address).",
          "We do not sell data or pass it to advertisers.",
        ] },
        { h: "Listings from other portals", p: [
          "From publicly available listings on other portals (e.g. ss.com) we show only facts (make, year, price, area, location) and a link to the original. We do not take seller contacts or descriptions. Thumbnails load directly from the source server.",
          "If your listing from another portal appears here and you want it removed, write to {email}.",
        ] },
        { h: "How long we keep data", p: [
          "Account data — while the account is active. After a deletion request we delete data within 30 days unless the law requires longer storage.",
          "Price history of deleted listings may be kept anonymously for market statistics.",
        ] },
        { h: "Cookies", p: ["We use only cookies needed for the site to work: login session and chosen language. Theme and compared listings are stored in your browser. There are no analytics or advertising cookies, so no consent is needed."] },
        { h: "Your rights", p: [
          "You have the right to access, correct and delete your data, restrict processing, object, and receive it for portability. Write to {email}; we reply within one month.",
          "If you believe your data is processed unlawfully, you can complain to the Latvian Data State Inspectorate (www.dvi.gov.lv).",
        ] },
        { h: "Changes", p: ["We will announce significant changes on the site. The current version is always on this page."] },
      ],
    },
    terms: {
      title: "Terms of use",
      intro: "By using VienāVietā you agree to these terms.",
      sections: [
        { h: "Service", p: ["VienāVietā is a classifieds site and search engine showing user listings and listings from other portals in one place. The service is provided by {operator}."] },
        { h: "Account", p: [
          "You log in with a link sent by email. One person may use one account. You are responsible for activity in your account and for keeping your profile accurate.",
          "Dealers and agencies must state their company name in the profile.",
        ] },
        { h: "Listings", p: [
          "Post only true information about what you are entitled to sell or rent, and photos you have rights to.",
          "Prohibited: illegal goods and services, fraud, misleading prices, duplicates of the same item, publishing other people's personal data, spam and offensive content.",
          "You can post up to {limit} listings per day.",
          "By posting a listing you allow us to show it, store it and display it in search engines while it is published.",
        ] },
        { h: "Dealer import", p: ["A dealer who adds a listings feed is responsible for its content and for the rights to its photos. The same rules apply to feed listings."] },
        { h: "Listings from other portals", p: ["For these listings we show only facts and a link to the original. The publisher on the original portal is responsible for their content; you deal directly with the seller."] },
        { h: "Reporting and moderation", p: [
          "Anyone can report a listing with the “Report listing” button. After {reports} reports a listing is hidden until a moderator reviews it.",
          "If we remove your listing or block your account, we will tell you why. If you disagree, write to {email} and we will review the decision.",
          "Point of contact for authorities and users under the Digital Services Act: {email} (Latvian or English).",
        ] },
        { h: "Liability", p: [
          "We are not a party to deals between buyers and sellers. Check the item and the seller before paying.",
          "Price ratings, market statistics, listing history and Land Service deal data are for information only; we do not guarantee they are complete or accurate.",
        ] },
        { h: "Paid services", p: ["The site is currently free. If we introduce paid services, their terms will be added here before launch."] },
        { h: "Changes and disputes", p: ["We may change these terms and will announce significant changes on the site. We first try to resolve disputes by talking: write to {email}."] },
      ],
    },
    about: {
      title: "About VienāVietā",
      intro: "VienāVietā is a search engine that shows vehicle listings in Latvia and Lithuania and real estate listings in Latvia in one place: both those posted here and those from other portals.",
      sections: [
        { h: "Data sources", p: [
          "ss.com: listing facts and links to the original; thumbnails load from the ss.com server.",
          "State Land Service of Latvia, NĪTIS deal data (data.gov.lv, CC BY 4.0 licence): apartment sale prices.",
          "Maps: Google Maps. Address lookup: Google Geocoding.",
          "Dealer and agency listings from their own feeds.",
        ] },
        { h: "Contact", p: ["Questions, suggestions and partnerships: {email}."] },
      ],
    },
  },

  ru: {
    updated: "Действует с",
    placeholder: "будет указано",
    operatorH: "Поставщик услуги",
    operatorRows: [["Название / имя", "{operator}"], ["Регистрационный номер", "{regno}"], ["Адрес", "{address}"], ["E-mail", "{email}"]],
    footer: { about: "О нас", terms: "Правила пользования", privacy: "Политика конфиденциальности", sources: "Источники данных" },
    privacy: {
      title: "Политика конфиденциальности",
      intro: "Здесь объясняется, какие персональные данные обрабатывает VienāVietā, зачем и как ты можешь воспользоваться своими правами.",
      sections: [
        { h: "Оператор данных", p: ["Оператор персональных данных — {operator}. Вопросы о данных отправляй на {email}."] },
        { h: "Какие данные мы обрабатываем", p: [
          "Данные аккаунта: e-mail, имя, телефон (если указан), название компании для салонов и агентств.",
          "Твой контент: объявления, фото, избранное, сохранённые поиски, жалобы и ссылки на потоки салонов.",
          "Технические данные: IP-адрес и данные браузера для безопасности входа и предотвращения злоупотреблений, а также журналы сервера.",
        ] },
        { h: "Зачем и на каком основании", p: [
          "Для оказания услуги (исполнение договора): аккаунт, публикация объявлений, избранное, импорт салонов.",
          "Письма о новых объявлениях и снижении цен отправляются, только если ты их включил; в каждом письме есть ссылка для отписки.",
          "Законные интересы: безопасность, предотвращение мошенничества и спама, модерация.",
        ] },
        { h: "Кто видит твои данные", p: [
          "Публично видно объявление и имя продавца или название компании. Телефон и e-mail показываем только после нажатия «Показать телефон».",
          "Для работы сервиса используем обработчиков: Render (серверы и база данных, ЕС), Cloudflare (хранение фото), Brevo (отправка писем), Google (карты и определение адресов; при открытии карты браузер связывается с серверами Google). Если вы включите уведомления на устройстве, они доставляются через push-сервис производителя браузера или телефона (Google, Apple, Mozilla или Microsoft); мы храним только адрес подписки устройства и язык, отключить их можно в разделе «Уведомления». Cloudflare также обеспечивает DNS домена и пересылку писем на info@vienavieta.lv. Для статистики посещений используем Cloudflare Web Analytics: он не использует cookie и не отслеживает отдельных посетителей, мы видим только общие цифры (просмотры страниц, страны, типы устройств и браузеров). При ошибке на странице сохраняем описание ошибки, адрес страницы и тип браузера, чтобы её исправить (без IP-адреса).",
          "Мы не продаём данные и не передаём их рекламодателям.",
        ] },
        { h: "Объявления с других порталов", p: [
          "Из общедоступных объявлений на других порталах (напр. ss.com) показываем только факты (марка, год, цена, площадь, место) и ссылку на оригинал. Контакты и описания продавцов не берём. Миниатюры загружаются прямо с сервера источника.",
          "Если твоё объявление с другого портала видно у нас и ты хочешь его убрать, напиши на {email}.",
        ] },
        { h: "Сколько храним", p: [
          "Данные аккаунта — пока аккаунт активен. После запроса на удаление удаляем данные в течение 30 дней, если закон не требует хранить дольше.",
          "История цен удалённых объявлений может храниться анонимно для рыночной статистики.",
        ] },
        { h: "Cookies", p: ["Используем только необходимые cookies: сессия входа и выбранный язык. Тема и сравниваемые объявления хранятся в твоём браузере. Аналитических и рекламных cookies нет, поэтому согласие не требуется."] },
        { h: "Твои права", p: [
          "Ты вправе получить доступ к своим данным, исправить и удалить их, ограничить обработку, возразить и получить их для переноса. Пиши на {email}; ответим в течение месяца.",
          "Если считаешь, что данные обрабатываются незаконно, можешь подать жалобу в Государственную инспекцию данных Латвии (www.dvi.gov.lv).",
        ] },
        { h: "Изменения", p: ["О существенных изменениях сообщим на сайте. Действующая версия всегда на этой странице."] },
      ],
    },
    terms: {
      title: "Правила пользования",
      intro: "Пользуясь VienāVietā, ты соглашаешься с этими правилами.",
      sections: [
        { h: "Услуга", p: ["VienāVietā — портал объявлений и поисковик, который в одном месте показывает объявления пользователей и объявления с других порталов. Услугу оказывает {operator}."] },
        { h: "Аккаунт", p: [
          "Вход — по ссылке из e-mail. Один человек может пользоваться одним аккаунтом. Ты отвечаешь за действия в своём аккаунте и за достоверность профиля.",
          "Салоны и агентства должны указать в профиле название компании.",
        ] },
        { h: "Объявления", p: [
          "Размещай только правдивую информацию о том, что вправе продавать или сдавать, и фото, на которые у тебя есть права.",
          "Запрещено: незаконные товары и услуги, мошенничество, вводящие в заблуждение цены, дубликаты одного объекта, публикация чужих персональных данных, спам и оскорбительный контент.",
          "В день можно разместить до {limit} объявлений.",
          "Размещая объявление, ты разрешаешь нам показывать, хранить его и показывать в поисковиках, пока оно опубликовано.",
        ] },
        { h: "Импорт салонов", p: ["Салон, добавивший поток объявлений, отвечает за его содержание и права на фото. К объявлениям из потока применяются те же правила."] },
        { h: "Объявления с других порталов", p: ["Для таких объявлений показываем только факты и ссылку на оригинал. За их содержание отвечает публикатор на оригинальном портале; сделку заключаешь напрямую с продавцом."] },
        { h: "Жалобы и модерация", p: [
          "На любое объявление можно пожаловаться кнопкой «Пожаловаться». После {reports} жалоб объявление скрывается до проверки модератором.",
          "Если мы удалим твоё объявление или заблокируем аккаунт, сообщим причину. Если не согласен, напиши на {email}, и мы пересмотрим решение.",
          "Контактный пункт для органов власти и пользователей по Акту о цифровых услугах: {email} (на латышском или английском).",
        ] },
        { h: "Ответственность", p: [
          "Мы не являемся стороной сделки между покупателем и продавцом. Перед оплатой проверь товар и продавца.",
          "Оценки цен, рыночная статистика, история объявлений и данные сделок VZD носят информационный характер; мы не гарантируем их полноту и точность.",
        ] },
        { h: "Платные услуги", p: ["Сейчас портал бесплатный. Если введём платные услуги, их условия будут добавлены сюда до запуска."] },
        { h: "Изменения и споры", p: ["Мы можем менять правила и сообщим о существенных изменениях на сайте. Споры сначала решаем переговорами: пиши на {email}."] },
      ],
    },
    about: {
      title: "О VienāVietā",
      intro: "VienāVietā — поисковик, в котором в одном месте видны объявления о транспорте в Латвии и Литве и о недвижимости в Латвии: и размещённые у нас, и с других порталов.",
      sections: [
        { h: "Источники данных", p: [
          "ss.com: факты объявлений и ссылки на оригинал; миниатюры загружаются с сервера ss.com.",
          "Государственная земельная служба Латвии, данные сделок NĪTIS (data.gov.lv, лицензия CC BY 4.0): цены сделок с квартирами.",
          "Карты: Google Maps. Определение адресов: Google Geocoding.",
          "Объявления салонов и агентств из их собственных потоков.",
        ] },
        { h: "Контакты", p: ["Вопросы, предложения и сотрудничество: {email}."] },
      ],
    },
  },

  lt: {
    updated: "Galioja nuo",
    placeholder: "bus nurodyta",
    operatorH: "Paslaugos teikėjas",
    operatorRows: [["Pavadinimas / vardas", "{operator}"], ["Registracijos numeris", "{regno}"], ["Adresas", "{address}"], ["El. paštas", "{email}"]],
    footer: { about: "Apie mus", terms: "Naudojimo taisyklės", privacy: "Privatumo politika", sources: "Duomenų šaltiniai" },
    privacy: {
      title: "Privatumo politika",
      intro: "Čia paaiškinta, kokius asmens duomenis tvarko VienāVietā, kodėl ir kaip gali pasinaudoti savo teisėmis.",
      sections: [
        { h: "Duomenų valdytojas", p: ["Asmens duomenų valdytojas yra {operator}. Klausimus apie duomenis siųsk adresu {email}."] },
        { h: "Kokius duomenis tvarkome", p: [
          "Paskyros duomenys: el. pašto adresas, vardas, telefonas (jei nurodai), įmonės pavadinimas salonams ir agentūroms.",
          "Tavo turinys: skelbimai, nuotraukos, mėgstami, išsaugotos paieškos, skundai ir salonų srautų nuorodos.",
          "Techniniai duomenys: IP adresas ir naršyklės informacija prisijungimo saugumui ir piktnaudžiavimo prevencijai, taip pat serverio žurnalai.",
        ] },
        { h: "Kodėl ir kokiu pagrindu", p: [
          "Paslaugai teikti (sutarties vykdymas): paskyra, skelbimų skelbimas, mėgstami, salonų importas.",
          "Laiškai apie naujus skelbimus ir kainų kritimus siunčiami tik tada, jei juos įjungi pats; kiekviename laiške yra nuoroda atsisakyti.",
          "Teisėti interesai: saugumas, sukčiavimo ir šlamšto prevencija, moderavimas.",
        ] },
        { h: "Kas mato tavo duomenis", p: [
          "Viešai matomas skelbimas ir pardavėjo vardas arba įmonės pavadinimas. Telefoną ir el. paštą rodome tik paspaudus „Rodyti telefoną“.",
          "Paslaugai teikti naudojame duomenų tvarkytojus: Render (serveriai ir duomenų bazė, ES), Cloudflare (nuotraukų saugojimas), Brevo (laiškų siuntimas), Google (žemėlapiai ir adresų nustatymas; atidarius žemėlapį naršyklė jungiasi prie Google serverių). Jei įrenginyje įjungsite pranešimus, jie pristatomi per jūsų naršyklės ar telefono gamintojo push paslaugą (Google, Apple, Mozilla arba Microsoft); saugome tik įrenginio prenumeratos adresą ir kalbą, o išjungti juos galite skiltyje „Pranešimai“. Cloudflare taip pat teikia domeno DNS ir peradresuoja laiškus, siunčiamus info@vienavieta.lv. Lankomumo statistikai naudojame Cloudflare Web Analytics: ji nenaudoja slapukų ir neseka atskirų lankytojų, matome tik bendrus skaičius (puslapių peržiūras, šalis, įrenginių ir naršyklių tipus). Įvykus puslapio klaidai, saugome klaidos aprašą, puslapio adresą ir naršyklės tipą, kad ją ištaisytume (be IP adreso).",
          "Duomenų neparduodame ir neperduodame reklamuotojams.",
        ] },
        { h: "Skelbimai iš kitų portalų", p: [
          "Iš viešai prieinamų kitų portalų skelbimų (pvz., ss.com) rodome tik faktus (markė, metai, kaina, plotas, vieta) ir nuorodą į originalą. Pardavėjų kontaktų ir aprašymų neimame. Miniatiūros įkeliamos tiesiai iš šaltinio serverio.",
          "Jei tavo skelbimas iš kito portalo matomas pas mus ir nori jį pašalinti, rašyk {email}.",
        ] },
        { h: "Kiek laiko saugome", p: [
          "Paskyros duomenis — kol paskyra aktyvi. Gavę prašymą ištrinti, duomenis ištriname per 30 dienų, nebent įstatymas reikalauja saugoti ilgiau.",
          "Ištrintų skelbimų kainų istorija gali būti saugoma anonimiškai rinkos statistikai.",
        ] },
        { h: "Slapukai", p: ["Naudojame tik veikimui būtinus slapukus: prisijungimo sesija ir pasirinkta kalba. Tema ir lyginami skelbimai saugomi tavo naršyklėje. Analitikos ir reklamos slapukų nėra, todėl sutikimo nereikia."] },
        { h: "Tavo teisės", p: [
          "Turi teisę susipažinti su savo duomenimis, juos ištaisyti, ištrinti, apriboti tvarkymą, nesutikti ir gauti juos perkėlimui. Rašyk {email}; atsakysime per mėnesį.",
          "Jei manai, kad duomenys tvarkomi neteisėtai, gali pateikti skundą Latvijos duomenų valstybinei inspekcijai (www.dvi.gov.lv).",
        ] },
        { h: "Pakeitimai", p: ["Apie esminius pakeitimus pranešime portale. Galiojanti versija visada yra šiame puslapyje."] },
      ],
    },
    terms: {
      title: "Naudojimo taisyklės",
      intro: "Naudodamasis VienāVietā sutinki su šiomis taisyklėmis.",
      sections: [
        { h: "Paslauga", p: ["VienāVietā yra skelbimų portalas ir paieškos sistema, vienoje vietoje rodanti naudotojų skelbimus ir skelbimus iš kitų portalų. Paslaugą teikia {operator}."] },
        { h: "Paskyra", p: [
          "Prisijungiama per nuorodą el. laiške. Vienas asmuo gali naudoti vieną paskyrą. Atsakai už veiksmus savo paskyroje ir už tai, kad profilio duomenys būtų teisingi.",
          "Salonai ir agentūros profilyje turi nurodyti įmonės pavadinimą.",
        ] },
        { h: "Skelbimai", p: [
          "Skelbk tik teisingą informaciją apie tai, ką turi teisę parduoti ar nuomoti, ir nuotraukas, į kurias turi teises.",
          "Draudžiama: neteisėtos prekės ir paslaugos, sukčiavimas, klaidinančios kainos, to paties objekto dublikatai, svetimų asmens duomenų skelbimas, šlamštas ir įžeidus turinys.",
          "Per dieną galima įdėti iki {limit} skelbimų.",
          "Įdėdamas skelbimą leidi mums jį rodyti, saugoti ir rodyti paieškos sistemose, kol jis paskelbtas.",
        ] },
        { h: "Salonų importas", p: ["Salonas, pridėjęs skelbimų srautą, atsako už jo turinį ir teises į nuotraukas. Srauto skelbimams taikomos tos pačios taisyklės."] },
        { h: "Skelbimai iš kitų portalų", p: ["Šiems skelbimams rodome tik faktus ir nuorodą į originalą. Už jų turinį atsako skelbėjas originaliame portale; sandorį sudarai tiesiogiai su pardavėju."] },
        { h: "Pranešimai ir moderavimas", p: [
          "Apie bet kurį skelbimą galima pranešti mygtuku „Pranešti apie skelbimą“. Po {reports} skundų skelbimas paslepiamas, kol jį patikrina moderatorius.",
          "Jei pašalinsime tavo skelbimą ar užblokuosime paskyrą, nurodysime priežastį. Jei nesutinki, rašyk {email}, ir sprendimą peržiūrėsime.",
          "Kontaktinis punktas institucijoms ir naudotojams pagal Skaitmeninių paslaugų aktą: {email} (latviškai arba angliškai).",
        ] },
        { h: "Atsakomybė", p: [
          "Nesame pirkėjo ir pardavėjo sandorio šalis. Prieš mokėdamas patikrink prekę ir pardavėją.",
          "Kainų įvertinimai, rinkos statistika, skelbimų istorija ir VZD sandorių duomenys yra informacinio pobūdžio; negarantuojame jų išsamumo ir tikslumo.",
        ] },
        { h: "Mokamos paslaugos", p: ["Šiuo metu portalas nemokamas. Jei įvesime mokamas paslaugas, jų sąlygos bus pridėtos čia prieš paleidimą."] },
        { h: "Pakeitimai ir ginčai", p: ["Taisykles galime keisti; apie esminius pakeitimus pranešime portale. Ginčus pirmiausia sprendžiame derybomis: rašyk {email}."] },
      ],
    },
    about: {
      title: "Apie VienāVietā",
      intro: "VienāVietā yra paieškos sistema, kurioje vienoje vietoje matyti transporto skelbimai Latvijoje ir Lietuvoje bei nekilnojamojo turto skelbimai Latvijoje: ir įdėti pas mus, ir iš kitų portalų.",
      sections: [
        { h: "Duomenų šaltiniai", p: [
          "ss.com: skelbimų faktai ir nuorodos į originalą; miniatiūros įkeliamos iš ss.com serverio.",
          "Latvijos valstybinė žemės tarnyba, NĪTIS sandorių duomenys (data.gov.lv, licencija CC BY 4.0): butų sandorių kainos.",
          "Žemėlapiai: Google Maps. Adresų nustatymas: Google Geocoding.",
          "Salonų ir agentūrų skelbimai iš jų pačių srautų.",
        ] },
        { h: "Kontaktai", p: ["Klausimai, pasiūlymai ir bendradarbiavimas: {email}."] },
      ],
    },
  },
};
