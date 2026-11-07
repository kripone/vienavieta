# VienāVietā – norādes darbam ar kodu

- Saskarnes teksti, komentāri un dokumentācija ir latviski. Koda nosaukumi (mainīgie, funkcijas, tabulas) angliski.
- Datubāzes izmaiņas: labo `src/db/schema.ts`, tad `npm run db:generate` un iesniedz jauno failu no `drizzle/`. Esošās migrācijas nelabo.
- Kopīgās vērtības (transporta veidi, īpašumu veidi, sērijas, sūdzību iemesli, limiti) glabājas `src/lib/constants.ts`. Neatkārto tās citur.
- Cenas glabājas veselos eiro (`integer`). Maksājumu summas centos (`amount_cents`).
- Pirms commit: `npm run typecheck` un `npm run build`.
- Plāns un statuss: `docs/ROADMAP.md`. Pabeigtos punktus atzīmē tur.
- Citu portālu sludinājumi: 2026-11-07 lietotājs apstiprināja, ka jurists atļāvis ņemt ss.com lapas. Ievākšana: `src/lib/importers/ss-pages.ts` (sadaļas `SS_SECTIONS`, fona plānotājs `ss-scheduler.ts`, izslēdz ar `SS_CRAWL=off`). Lasām tikai sarakstu tabulas: faktus (marka, gads, cena, platība, vieta) un saiti; virsrakstu veidojam paši; sludinājumu lapas, bildes un pārdevēja tekstu neņemam. Pieprasījumi lēni (`SS_REQUEST_DELAY_MS`), ievērojot robots.txt. Saites uz oriģinālu: jaunā cilnē, `rel="nofollow noopener noreferrer"`, avots norādīts. Citus portālus pieslēdz tikai ar lietotāja apstiprinājumu katram portālam; robotu pārbaudes (Cloudflare u.c.) neapiet.
- Pieteikšanās: `src/lib/auth.ts` (Better Auth). Serverī lietotāju iegūst ar `getCurrentUser()` / `requireUser()` no `src/lib/session.ts`, kas arī izslēdz bloķētos.
- React 19 atiestata nekontrolētus formas laukus pēc servera darbības, tāpēc formās ar kļūdu paziņojumiem lieto kontrolētus laukus.
- Sludinājumu saglabāšana: `src/app/sludinajumi/actions.ts`; validācija `src/lib/listing-input.ts`; antispam `src/lib/antispam.ts`. Bildes: `src/lib/storage.ts` (lokāli vai S3) un `src/lib/images.ts`.
- Antispam pārbauda, vai forma aizpildīta ne ātrāk kā 4 s pēc lapas atvēršanas; automātiskajos testos pirms iesniegšanas jāpagaida.
- Meklēšana: parametri un SQL `src/lib/search.ts` (parseSearch → conditions); filtru UI `src/components/search-filters.tsx`; karte `src/components/search-map.tsx`. Jaunu filtru pievieno visās trijās vietās.
- `getCurrentUser()` sauc `headers()` ārpus try/catch un `unstable_rethrow`, lai neapklusinātu Next dinamiskās renderēšanas signālus.
- Bilžu krātuve: `STORAGE_DRIVER` = s3 | db | local; startējot `src/instrumentation.ts` pārbauda krātuvi un ieraksta rezultātu žurnālā.
