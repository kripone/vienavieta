# VienāVietā

Latvijas sludinājumu portāls: transports un nekustamais īpašums vienā meklētājā.

Šis ir portāla pirmkods. Pašlaik gatavs: sludinājumu pievienošana ar bildēm, sludinājuma lapa, mani sludinājumi, konti (pieteikšanās ar e-pastu un sociālajiem tīkliem, profils) un projekta pamats: datubāzes struktūra visām galvenajām funkcijām, vietu saraksts (novadi, pilsētas, rajoni, ciemi), transporta katalogs (vieglie auto, motocikli, kemperi, furgoni, kravas auto) un vienkārša sākumlapa. Tālākie soļi ir aprakstīti [docs/ROADMAP.md](docs/ROADMAP.md).

## Tehnoloģijas

- **Next.js 16** (React 19, TypeScript): lapas un serveris vienā projektā
- **PostgreSQL 16**: datubāze
- **Drizzle ORM**: darbs ar datubāzi un migrācijas
- **Better Auth**: pieteikšanās ar e-pasta saiti, Google, Facebook un Apple
- Burti (Bricolage Grotesque, Figtree, JetBrains Mono) ir iekļauti projektā, tāpēc lapa nav atkarīga no Google Fonts

## Palaišana savā datorā

Vajadzīgs: [Node.js 20+](https://nodejs.org) un [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# 1. Lejupielādē kodu
git clone https://github.com/kripone/vienavieta.git
cd vienavieta

# 2. Uzstādi bibliotēkas
npm install

# 3. Izveido iestatījumu failu un ieraksti tajā BETTER_AUTH_SECRET
cp .env.example .env
openssl rand -base64 32

# 4. Palaid datubāzi
docker compose up -d

# 5. Izveido tabulas un ielādē vietas un katalogu
npm run db:migrate
npm run db:seed

# (pēc izvēles) pievieno dažus parauga sludinājumus
npm run db:seed:demo

# 6. Palaid portālu
npm run dev
```

Portāls atveras http://localhost:3000. Lai ielogotos izstrādē, ievadi jebkuru e-pastu: pieteikšanās saite parādīsies terminālī, kur darbojas `npm run dev`. E-pasta un sociālo tīklu iestatīšana: [docs/AUTH-SETUP.md](docs/AUTH-SETUP.md). Datubāzes stāvokli var pārbaudīt http://localhost:3000/api/health.

## Komandas

| Komanda | Ko dara |
| --- | --- |
| `npm run dev` | Izstrādes serveris ar automātisku pārlādi |
| `npm run build` / `npm start` | Produkcijas versijas būvēšana un palaišana |
| `npm run typecheck` | TypeScript pārbaude |
| `npm run db:generate` | Jauna migrācija pēc izmaiņām `src/db/schema.ts` |
| `npm run db:migrate` | Pielieto migrācijas datubāzei |
| `npm run db:seed` | Ielādē vietas un transporta katalogu (drīkst palaist atkārtoti) |
| `npm run db:seed:demo` | Pievieno parauga sludinājumus izstrādei |
| `npm run db:studio` | Datubāzes pārlūks pārlūkprogrammā |

## Projekta struktūra

```
src/
  app/            lapas un API (Next.js App Router)
  db/
    schema.ts     visas datubāzes tabulas
    seed.ts       sākuma dati
    migrate.ts    migrāciju palaišana
  lib/
    constants.ts  kopīgās vērtības: transporta veidi, īpašumu veidi, sērijas u.c.
data/
  locations.json        43 novadi un valstspilsētas, 233 vietas ar koordinātām
  vehicle-catalog.json  183 markas un ~1900 modeļi pa transporta veidiem
drizzle/          SQL migrācijas
docs/             plāns un dokumentācija
```

## Svarīgi

- `.env` fails ar parolēm un atslēgām **nekad** netiek augšupielādēts GitHub.
- Vietu saraksts pašlaik satur galvenās vietas. Produkcijai to aizstās ar pilnu VZD adrešu reģistru.
- Sludinājumu ievākšana no citiem portāliem netiek veidota, kamēr nav jurista atzinuma.
