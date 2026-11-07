# Pieteikšanās iestatīšana

Portāls atbalsta pieteikšanos ar e-pasta saiti (bez paroles) un ar Google, Facebook un Apple kontu.
Visas atslēgas ieraksta `.env` failā (nekad GitHub). Ja kādai metodei atslēgu nav, tās poga netiek rādīta.

## 1. Slepenā atslēga (obligāti)

```bash
openssl rand -base64 32
```
Ielīmē rezultātu `.env` kā `BETTER_AUTH_SECRET`. Produkcijā `BETTER_AUTH_URL` ir portāla adrese, piem. `https://vienavieta.lv`.

## 2. E-pasta sūtīšana (obligāti produkcijā)

Izstrādē bez SMTP pieteikšanās saite parādās servera konsolē (`npm run dev` logā).

Produkcijai der jebkurš SMTP serviss, piemēram **Brevo** (ir bezmaksas plāns) vai **Postmark**:
1. Reģistrējies servisā un pievieno savu domēnu (piem. `vienavieta.lv`).
2. Domēna DNS iestatījumos pievieno servisa norādītos SPF, DKIM un DMARC ierakstus, lai vēstules nenonāktu surogātpastā.
3. Servisa iestatījumos atrodi SMTP datus un ieraksti `.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.

## 3. Google

1. Atver https://console.cloud.google.com → izveido projektu "VienāVietā".
2. **APIs & Services → OAuth consent screen**: lietotņu tips "External", nosaukums, logo, privātuma politikas saite.
3. **Credentials → Create credentials → OAuth client ID**, tips "Web application".
4. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (izstrādei)
   - `https://vienavieta.lv/api/auth/callback/google` (produkcijai)
5. Client ID un Client Secret ieraksti `.env` kā `GOOGLE_CLIENT_ID` un `GOOGLE_CLIENT_SECRET`.

## 4. Facebook

1. Atver https://developers.facebook.com → **My Apps → Create App** → "Authenticate and request data from users with Facebook Login".
2. Pievieno produktu **Facebook Login → Settings**.
3. **Valid OAuth Redirect URIs**: `https://vienavieta.lv/api/auth/callback/facebook`
4. **App settings → Basic**: App ID un App Secret ieraksti kā `FACEBOOK_CLIENT_ID` un `FACEBOOK_CLIENT_SECRET`.
5. Pirms publiskošanas Facebook prasa privātuma politikas saiti un lietotnes pārskatīšanu.

## 5. Apple

Vajadzīgs Apple Developer konts (99 USD gadā).
1. https://developer.apple.com → **Certificates, Identifiers & Profiles → Identifiers** → izveido **Services ID** (tas būs `APPLE_CLIENT_ID`).
2. Ieslēdz "Sign in with Apple", pievieno domēnu un atgriešanās adresi `https://vienavieta.lv/api/auth/callback/apple`.
3. **Keys** → izveido atslēgu ar "Sign in with Apple", lejupielādē `.p8` failu.
4. No atslēgas jāģenerē `APPLE_CLIENT_SECRET` (JWT, derīgs līdz 6 mēnešiem). To var izdarīt ar skriptu; palūdz to, kad nonāksim līdz šim solim.

Apple pieteikšanās strādā tikai ar īstu domēnu un HTTPS, ne `localhost`.

## Drošība

- Pieteikšanās saite ir derīga 15 minūtes un izmantojama vienu reizi.
- Vienai e-pasta adresei var pieprasīt ne vairāk kā 3 saites minūtē.
- Bloķētiem lietotājiem saite netiek sūtīta, un viņu sesija netiek atzīta.
- Ja lietotājs piesakās ar Google un pēc tam ar e-pastu, kas sakrīt, abi pieteikšanās veidi tiek piesaistīti vienam kontam.
