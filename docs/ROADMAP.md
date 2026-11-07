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
- [ ] Cenas novērtējums pret līdzīgiem sludinājumiem

## 5. Lietotāju funkcijas
- [x] Favorīti: sirsniņa kartītē un sludinājuma lapā, lapa /favoriti, cenas kritums kopš saglabāšanas
- [x] Cenu krituma paziņojumi e-pastā (favorīti)
- [x] Saglabātās meklēšanas ar e-pasta paziņojumiem (reizi stundā vai dienā), lapa /pazinojumi, atrakstīšanās no e-pasta
- [x] Paziņojumu kārta: /api/cron/notify, ko reizi stundā izsauc GitHub Actions (.github/workflows/notify.yml)
- [ ] Ziņas starp pircēju un pārdevēju
- [ ] Salīdzināšana

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
- [ ] Bildes no citiem portāliem: netiek ņemtas
- [x] Dublikātu apvienošana starp portāliem (marka/modelis/gads/cena/nobraukums vai veids/istabas/platība/vieta): viena kartīte, "Arī: ss.com ↗"

## Palaišana produkcijā
- [x] Render Blueprint (render.yaml) un instrukcija docs/DEPLOY.md
- [x] Testa versija internetā: Render + Cloudflare R2 + Brevo + Google karte
- [ ] Domēns, hostings, pārvaldīta PostgreSQL
- [x] E-pasta sūtīšana (Brevo API)
- [ ] Kļūdu uzraudzība, rezerves kopijas
- [ ] Lietošanas noteikumi, privātuma politika, sīkdatnes
