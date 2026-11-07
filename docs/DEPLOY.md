# Testa versijas palaišana internetā

Ieteiktā kombinācija sākumam:
- **Render**: portāls un PostgreSQL datubāze (Frankfurtē, tuvu Baltijai)
- **Cloudflare R2**: bildes (10 GB bez maksas, bez maksas par lejupielādi)
- **Brevo**: e-pasta sūtīšana pieteikšanās saitēm (300 vēstules dienā bez maksas)

Aptuvenās izmaksas: Render ~7 $ portālam + ~6 $ datubāzei mēnesī. R2 un Brevo sākumā bez maksas. Cenas pārbaudi pakalpojumu lapās.

## 1. Cloudflare R2 (bildēm)

Bez R2 bildes var glabāt datubāzē (`STORAGE_DRIVER=db`). Pēc pārslēgšanas uz `s3` agrāk datubāzē saglabātās bildes joprojām tiek rādītas.
`MEDIA_PUBLIC_URL` nav obligāts: ja tas ir tukšs, bildes izsniedz pats portāls caur `/media/…`, un R2 publiskā piekļuve nav vajadzīga.
Pēc palaišanas servera žurnālā jābūt rindai `Bilžu krātuve (s3): darbojas`.

1. Cloudflare panelī atver **R2 Object Storage** un ieslēdz R2 (prasīs maksājuma karti, bet līdz 10 GB nemaksā).
2. **Create bucket**: nosaukums `vienavieta-photos`, atrašanās vieta "Automatic" vai "Eastern Europe".
3. Bucket iestatījumos **Public access → R2.dev subdomain → Allow**. Nokopē adresi (`https://pub-….r2.dev`), tā būs `MEDIA_PUBLIC_URL`. Vēlāk to var aizstāt ar savu domēnu, piem. `media.vienavieta.lv`.
4. **R2 → Manage API tokens → Create API token**: atļauja "Object Read & Write", tikai šim bucket.
   Saglabā: Access Key ID → `S3_ACCESS_KEY_ID`, Secret Access Key → `S3_SECRET_ACCESS_KEY`, un endpoint `https://<account-id>.r2.cloudflarestorage.com` → `S3_ENDPOINT`.
5. `S3_BUCKET=vienavieta-photos`

## 2. Brevo (e-pastam)
1. Reģistrējies https://www.brevo.com.
2. **Senders, Domains → Domains**: pievieno savu domēnu un DNS ierakstus. Kamēr domēna nav, var apstiprināt vienu sūtītāja e-pastu (piem. savu Gmail) testam.
3. **SMTP & API → SMTP**: `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER` (tavs Brevo login), `SMTP_PASS` (SMTP atslēga).
4. `EMAIL_FROM="VienāVietā <apstiprinatais@epasts>"`

## 3. Render (portāls un datubāze)
1. Reģistrējies https://render.com ar savu GitHub kontu.
2. **New → Blueprint** → izvēlies `kripone/vienavieta`. Render nolasa `render.yaml` un piedāvā izveidot portālu un datubāzi.
3. Aizpildi prasītās vērtības no 1. un 2. soļa. `APP_URL` un `BETTER_AUTH_URL` sākumā var atstāt tukšu.
4. Spied **Apply**. Pirmā būvēšana aizņem dažas minūtes.
5. Kad portāls darbojas, nokopē tā adresi (piem. `https://vienavieta.onrender.com`), ieraksti to `APP_URL` un `BETTER_AUTH_URL` un saglabā. Render pārstartēs portālu.
6. Pārbaude: atver `https://…onrender.com/api/health`, jābūt `{"ok":true,"db":"ok"}`.

Katrs jauns commit `main` zarā GitHub automātiski tiek palaists Render.

## Pēc tam
- **Savs domēns** (piem. `vienavieta.lv`): Render → Settings → Custom Domains; DNS var turēt Cloudflare.
- **Karte**: MapTiler atslēga, sk. docs/MAPS.md.
- **Google/Facebook pieteikšanās**: sk. docs/AUTH-SETUP.md (atgriešanās adresēs izmanto īsto domēnu).
