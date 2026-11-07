# Karte: ielas un satelīts

Karte izmanto bibliotēku Leaflet, un kartes attēlus (flīzes) var ņemt no jebkura pakalpojuma. Adreses ieraksta `.env`.

## Izstrādei
Neko nevajag: ja `NEXT_PUBLIC_MAP_TILES_URL` ir tukšs, tiek izmantota OpenStreetMap karte.
OpenStreetMap publiskie serveri **nav paredzēti** lielai portāla slodzei, tāpēc produkcijai izvēlies kādu no zemāk.

## Produkcijai (ieteicams MapTiler)
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
