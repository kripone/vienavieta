# Karte: ielas un satelīts

Karte izmanto bibliotēku Leaflet, un kartes attēlus (flīzes) var ņemt no jebkura pakalpojuma. Adreses ieraksta `.env`.

## Izstrādei
Neko nevajag: ja `NEXT_PUBLIC_MAP_TILES_URL` ir tukšs, tiek izmantota OpenStreetMap karte.
OpenStreetMap publiskie serveri **nav paredzēti** lielai portāla slodzei, tāpēc produkcijai izvēlies kādu no zemāk.

## Google Maps (izmanto portāls)
Ja ir iestatīts `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, karte rāda Google ielu karti un satelītu caur oficiālo **Map Tiles API**.
Kods: `src/lib/google-tiles.ts` un `src/components/search-map.tsx`. Ja Google atbild ar kļūdu, karte pārslēdzas uz OpenStreetMap.

Iestatīšana:
1. https://console.cloud.google.com → izveido projektu (piem. "VienaVieta") un pievieno norēķinu kontu (Billing). Bez tā Google flīzes nedod, bet ir ikmēneša bezmaksas apjoms.
2. **APIs & Services → Library → Map Tiles API → Enable**.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Atslēgas iestatījumos:
   - **Application restrictions → Websites**: `https://vienavieta-omew.onrender.com/*` (vēlāk arī savs domēns, piem. `https://vienavieta.lv/*`);
   - **API restrictions → Restrict key → Map Tiles API**.
5. Render: `NEXT_PUBLIC_GOOGLE_MAPS_KEY=<atslēga>` un jauna būvēšana (mainīgais tiek iebūvēts lapā).
6. Ieteicams **Billing → Budgets & alerts** uzlikt budžetu (piem. 5 €), lai saņemtu brīdinājumu.

Google noteikumi, ko kods ievēro: kartes stūrī ir "Google Maps" un autortiesību teksts no `viewport` atbildes; flīzes netiek glabātas serverī.

## Citi pakalpojumi (MapTiler)
1. Reģistrējies https://www.maptiler.com (ir bezmaksas plāns sākumam).
2. Sadaļā **API keys** nokopē atslēgu un pievieno atļauto domēnu (piem. `vienavieta.lv`).
3. `.env`:
```
NEXT_PUBLIC_MAP_TILES_URL=https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=TAVA_ATSLEGA
NEXT_PUBLIC_MAP_TILES_ATTRIBUTION=&copy; MapTiler &copy; OpenStreetMap
NEXT_PUBLIC_MAP_SATELLITE_URL=https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=TAVA_ATSLEGA
NEXT_PUBLIC_MAP_SATELLITE_ATTRIBUTION=&copy; MapTiler
```

Līdzīgi var izmantot Mapbox (`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=…`).

`NEXT_PUBLIC_` mainīgie tiek iebūvēti lapā būvēšanas laikā, tāpēc pēc to maiņas jāpalaiž `npm run build` no jauna. Atslēgu obligāti ierobežo uz sava domēna pakalpojuma iestatījumos, jo tā ir redzama pārlūkā.

## Zonas apvilkšana
Poga "✎ Apvilkt zonu" ļauj ar peli vai pirkstu apvilkt vietu kartē. Zona tiek saglabāta saitē (`zone=…`), tāpēc meklēšanu ar zonu var nosūtīt citiem.
