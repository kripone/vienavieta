# VienāVietā – norādes darbam ar kodu

- Saskarnes teksti, komentāri un dokumentācija ir latviski. Koda nosaukumi (mainīgie, funkcijas, tabulas) angliski.
- Datubāzes izmaiņas: labo `src/db/schema.ts`, tad `npm run db:generate` un iesniedz jauno failu no `drizzle/`. Esošās migrācijas nelabo.
- Kopīgās vērtības (transporta veidi, īpašumu veidi, sērijas, sūdzību iemesli, limiti) glabājas `src/lib/constants.ts`. Neatkārto tās citur.
- Cenas glabājas veselos eiro (`integer`). Maksājumu summas centos (`amount_cents`).
- Pirms commit: `npm run typecheck` un `npm run build`.
- Plāns un statuss: `docs/ROADMAP.md`. Pabeigtos punktus atzīmē tur.
- Neveido citu portālu sludinājumu ievākšanu, kamēr lietotājs nav apstiprinājis jurista atzinumu.
