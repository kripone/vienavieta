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

## 3. Sludinājumi
- [ ] Pievienošanas un rediģēšanas forma (transports un īpašumi, lauki pēc veida)
- [ ] Bilžu augšupielāde un samazināšana (S3 saderīga krātuve)
- [ ] Sludinājuma lapa ar bildēm, parametriem un kalkulatoru
- [ ] Antispam: limits diennaktī, saišu un surogātvārdu pārbaude, dublikāti, slēptais lauks

## 4. Meklēšana
- [ ] Filtri ar URL parametriem (dalāmas saites)
- [ ] Karte ar zonas apvilkšanu (Mapbox vai Google Maps, ielas un satelīts)
- [ ] Kārtošana, lapas
- [ ] Cenas novērtējums pret līdzīgiem sludinājumiem

## 5. Lietotāju funkcijas
- [ ] Favorīti un cenu krituma paziņojumi
- [ ] Saglabātās meklēšanas ar e-pasta paziņojumiem
- [ ] Ziņas starp pircēju un pārdevēju
- [ ] Salīdzināšana

## 6. Moderācija
- [ ] Sūdzības un automātiska paslēpšana pēc 3 sūdzībām
- [ ] Moderatora panelis: sūdzības, bloķēšana, dublikāti

## 7. Ienākumi un papildu
- [ ] Maksājumi (Stripe vai Montonio): TOP, izcelšana, uzcelšana
- [ ] Salonu un aģentūru abonementi
- [ ] Smart-ID / eParaksts identitātes apstiprināšana
- [ ] VIN vēstures pārbaude (partneris)
- [ ] Valodas: LV, RU, EN
- [ ] PWA lietotne ar paziņojumiem

## 8. Citu portālu sludinājumi
- [ ] Tikai pēc jurista atzinuma: partneru datu plūsmas vai ievākšana (virsraksts, cena, saite)
- [ ] Dublikātu apvienošana starp portāliem

## Palaišana produkcijā
- [ ] Domēns, hostings, pārvaldīta PostgreSQL
- [ ] E-pasta sūtīšana, kļūdu uzraudzība, rezerves kopijas
- [ ] Lietošanas noteikumi, privātuma politika, sīkdatnes
