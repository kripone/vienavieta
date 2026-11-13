// /llms.txt: īss vietnes apraksts un svarīgākās lapas AI rīkiem (llmstxt.org formāts).
import { appBase } from "@/lib/seo";

export const dynamic = "force-dynamic";

export function GET() {
  const b = appBase();
  const body = `# VienāVietā

> Auto un nekustamā īpašuma sludinājumu meklētājs Latvijai (auto arī Lietuvai): apvieno sludinājumus no ss.com, city24.lv, autoplius.lt, zip.lv, pp.lv un auto salonu plūsmām vienā meklēšanā. Rāda cenu vēsturi, cenu kritumus, kvadrātmetra cenas pa apkaimēm un reālās dzīvokļu darījumu cenas no Valsts zemes dienesta datiem. Lapas latviešu (bez prefiksa), angļu (/en), krievu (/ru) un lietuviešu (/lt) valodā.

Skaitļi lapās tiek pārrēķināti katru dienu; citējot norādi avotu „VienāVietā (vienavieta.lv)” un datumu. Cenas ir sludinājumu (piedāvājuma) cenas, ja nav norādīts citādi.

## Statistika un pārskati

- [Dati un metodoloģija](${b}/dati): datu avoti, kā rēķinām mediānu, kvadrātmetra cenu, cenu kritumus un dublikātus
- [Mēneša tirgus pārskats](${b}/parskati): dzīvokļu €/m² Rīgas apkaimēs un pilsētās, populārākie lietotie auto, cenu kritumi
- [Dzīvokļu cenu karte](${b}/cenu-karte): kvadrātmetra cenas mediāna pa apkaimēm un pilsētām (pārdošana un īre)
- [Dzīvokļu darījumu cenas](${b}/darijumi): reālie darījumi pēc adreses (VZD, CC BY 4.0)
- [Cenu kritumi](${b}/cenu-kritumi): sludinājumi, kuru cena nesen samazināta
- [Cik vērts?](${b}/novertejums): auto vai dzīvokļa aptuvenā tirgus cena pēc līdzīgiem sludinājumiem

## Meklēšanas lapas

- [Lietoti auto](${b}/auto): pēc markas un modeļa (${b}/auto/volkswagen/passat), cenas (${b}/auto/lidz-5000), degvielas (${b}/auto/dizelis), virsbūves (${b}/auto/universals) un pilsētas (${b}/auto/riga)
- [Motocikli](${b}/moto)
- [Nekustamais īpašums](${b}/ipasumi): dzīvokļi, mājas, zeme un komercīpašumi pa novadiem un pilsētām (${b}/ipasumi/dzivokli/riga), dzīvokļi pēc istabu skaita (${b}/ipasumi/dzivokli/riga/2-istabu) un apkaimēm (${b}/ipasumi/dzivokli/riga/purvciems); īre: ${b}/ipasumi/dzivokli-ire/riga

## Par vietni

- [Par mums](${b}/par-mums)
- [Privātuma politika](${b}/privatums)
- Saziņa: info@vienavieta.lv
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
