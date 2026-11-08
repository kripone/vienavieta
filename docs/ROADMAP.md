# Plāns

Prototips ar visām idejām: claude.ai artefakts "VienāVietā". Šeit veidojam īsto portālu soli pa solim.

## 1. Pamats ✅
- [x] Next.js + TypeScript + PostgreSQL + Drizzle
- [x] Datubāzes struktūra: lietotāji, sludinājumi, bildes, cenu vēsture, favorīti, saglabātās meklēšanas, sūdzības, ziņas, maksas pakalpojumi
- [x] Vietas (novadi, pilsētas, rajoni, ciemi) un transporta katalogs
- [x] Sākumlapa un veselības pārbaude

## 2. Konti ✅ (izņemot SMS)
- [x] Reģistrācija un pieteikšanās ar e-pastu (saite e-pastā, bez paroles)
- [x] Google, Facebook un Apple pieteikšanās (Better Auth; ieslēdzas, kad ir atslēgas, sk. docs/AUTH-SETUP.md)
- [ ] Tālruņa apstiprināšana ar SMS
- [x] Profils: vārds, tālrunis, privātpersona vai salons/aģentūra
- [x] Bloķētie lietotāji nevar pieteikties

## 3. Sludinājumi ✅ (izņemot kalkulatoru)
- [x] Pievienošanas un rediģēšanas forma (transports un īpašumi, lauki pēc veida)
- [x] Bilžu augšupielāde: samazināšana līdz 1600 px, sīktēli, EXIF/GPS dzēšana; lokāla mape vai S3/R2
- [x] Sludinājuma lapa ar galeriju, parametriem, aprakstu un kontaktiem pēc pieprasījuma
- [ ] Līzinga un hipotēkas kalkulators sludinājuma lapā
- [x] Mani sludinājumi: rediģēt, atzīmēt kā pārdotu, dzēst; cenu vēsture saglabājas
- [x] Antispam: limits diennaktī, saišu un surogātvārdu pārbaude, lielie burti, dublikāti, slēptais lauks, aizpildīšanas laiks

## 4. Meklēšana ✅ (izņemot cenas novērtējumu)
- [x] Filtri ar URL parametriem (dalāmas saites): visi transporta un īpašuma lauki, vieta, pārdevējs, teksts
- [x] Karte ar zonas apvilkšanu (Leaflet; ielas un satelīts no .env, sk. docs/MAPS.md)
- [x] Google karte un satelīts (Map Tiles API, NEXT_PUBLIC_GOOGLE_MAPS_KEY); rezerve OpenStreetMap
- [x] Kārtošana, lapas, TOP sludinājumi pirmie
- [x] Cenas novērtējums pret līdzīgiem sludinājumiem (Laba cena / Tirgus cena / Virs tirgus; auto pēc markas/modeļa/gada, īpašumi pēc €/m² reģionā)

## 5. Lietotāju funkcijas
- [x] Favorīti: sirsniņa kartītē un sludinājuma lapā, lapa /favoriti, cenas kritums kopš saglabāšanas
- [x] Cenu krituma paziņojumi e-pastā (favorīti)
- [x] Saglabātās meklēšanas ar e-pasta paziņojumiem (reizi stundā vai dienā), lapa /pazinojumi, atrakstīšanās no e-pasta
- [x] Paziņojumu kārta: /api/cron/notify, ko reizi stundā izsauc GitHub Actions (.github/workflows/notify.yml)
- [ ] Ziņas starp pircēju un pārdevēju
- [x] Salīdzināšana (līdz 4, labākā vērtība iezīmēta)

## 6. Moderācija
- [x] Sūdzības ("Ziņot par sludinājumu") un automātiska paslēpšana pēc 3 dažādu lietotāju sūdzībām
- [x] Moderatora panelis /moderacija: sūdzības (viss kārtībā / paslēpt / bloķēt autoru), paslēptie sludinājumi, lietotāju meklēšana un bloķēšana
- [x] Piekļuve: loma moderator/admin vai e-pasts ADMIN_EMAILS sarakstā
- [ ] Dublikātu meklēšana moderatoriem

## 7. Ienākumi un papildu
- [ ] Maksājumi (Stripe vai Montonio): TOP, izcelšana, uzcelšana
- [ ] Salonu un aģentūru abonementi
- [ ] Smart-ID / eParaksts identitātes apstiprināšana
- [ ] VIN vēstures pārbaude (partneris)
- [ ] Valodas: LV, RU, EN
- [ ] PWA lietotne ar paziņojumiem

## Izskats
- [x] Gaišā/tumšā tēma (pārslēgs galvenē, atceras izvēli)
- [x] Ilustrācijas sludinājumiem bez bildēm, transporta veidu ikonas, virsbūvju un īpašumu veidu josla ar skaitu
- [x] Ilustrācija sludinājuma krāsā; ārējiem auto virsbūve pēc modeļa (MODEL_BODY_HINTS)

## Lietuva ✅ (pamats)
- [x] Lietuvas apskritis, pilsētas un Viļņas/Kauņas/Klaipēdas rajoni; filtrs "Valsts"
- [x] Lietuva tikai transporta sadaļā; "Visi" un nekustamais īpašums rāda tikai Latviju
- [x] Karte ietver Lietuvu; Lietuvas tālruņi (+370)
- [ ] Lietuviešu valoda saskarnē
- [ ] Sadarbība ar autoplius.lt / aruodas.lt (abi pieder Baltic Classifieds Group, tāpat kā city24.lv)

## 8. Citu portālu sludinājumi
- [x] ss.com oficiālās RSS plūsmas (auto, moto, dzīvokļi, mājas, zeme): fakti + saite, bez bildēm un teksta; reizi stundā; avota filtrs
- [x] ss.com sarakstu lapas (pēc jurista atzinuma): visas lapas reizi diennaktī, jaunie ik 15 min, ss.com izdzēstie tiek noņemti
- [ ] Citu portālu RSS/partneru plūsmas (reklama.lv, city24.lv, autoplius.lt …)
- [x] ss.com sīktēli tieši no ss.com servera (neglabājam), ja nenāk: ilustrācija
- [x] Tirgus tendences /tirgus: populārākās markas, modeļi, cena pa gadiem, cena pret nobraukumu, €/m² pa reģioniem un vietām
- [x] Dienas tirgus momentuzņēmumi (market_stats) cenu dinamikai laikā
- [x] ss.com īpašumu ielas → precīza vieta kartē (Google Geocoding, kešs; ieslēdzas ar GOOGLE_GEOCODING_KEY)
- [x] Dublikātu apvienošana starp portāliem (marka/modelis/gads/cena/nobraukums vai veids/istabas/platība/vieta): viena kartīte, "Arī: ss.com ↗"
- [x] ss.com meži, biroji, tirdzniecības telpas, noliktavas, garāžas (SS_SECTIONS ss2:wood/offices/shops/storage/garages)
- [x] Sludinājuma vēsture (kā tirgusdati.lv): dienas tirgū, sākuma cena, cenu izmaiņas ar grafiku; /vesture pēc ss.com saites
- [x] /cenu-kritumi (24 h / 7 / 30 dienas) un kārtošana "Lielākais cenu kritums", "Visilgāk tirgū"; kartītē sākuma cena nosvītrota
- [x] ss.com auto no sludinājuma lapas (katra lapa vienreiz, ~24 minūtē): pilsēta, ātrumkārba, krāsa, virsbūve, vietu skaits, tehniskā apskate, aprīkojums
- [x] VZD darījumu cenas dzīvokļiem (data.gov.lv „Darījumi ar telpu grupām”, CC BY 4.0): tajā pašā mājā un ~400 m apkārtnē, €/m² salīdzinājums; atjauno reizi mēnesī
- [x] VZD atzīme dzīvokļu kartītēs („VZD: šajā mājā … €/m²”) un lapa /darijumi (meklēšana pēc adreses)
- [ ] VZD darījumi mājām un zemei (datu kopas „Darījumi ar zemes vienībām (un būvēm)”)

## Juridiskais
- [x] Privātuma politika, lietošanas noteikumi (ar DSA kontaktpunktu), lapa „Par mums” ar datu avotiem, kājene; 4 valodās (src/content/legal.ts)
- [ ] Uzturētāja dati (`OPERATOR` src/lib/constants.ts): nosaukums, reģ. nr., adrese, e-pasts — pirms publiskas palaišanas; tekstus pārskata jurists
- [x] robots.txt, sitemap.xml

## Palaišana produkcijā
- [x] Render Blueprint (render.yaml) un instrukcija docs/DEPLOY.md
- [x] Testa versija internetā: Render + Cloudflare R2 + Brevo + Google karte
- [x] Domēns, hostings, pārvaldīta PostgreSQL (vienavieta.lv: Cloudflare DNS → Render; vecā onrender adrese pāradresē)
- [x] E-pasta sūtīšana (Brevo API)
- [ ] Kļūdu uzraudzība, rezerves kopijas
- [ ] Lietošanas noteikumi, privātuma politika, sīkdatnes
