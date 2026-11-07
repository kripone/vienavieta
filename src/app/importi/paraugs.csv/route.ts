// CSV paraugs salonu importam (src/lib/importers/dealer-feed.ts saprot šos kolonnu nosaukumus).
const CSV = `id;marka;modelis;gads;cena;nobraukums;degviela;atrumkarba;virsbuve;tilpums;krasa;pilseta;saite;bildes;apraksts
A123;Volkswagen;Golf;2019;13900;98000;Benzīns;Manuāla;Hečbeks;1.5;Balta;Rīga;https://www.jusu-salons.lv/auto/a123;https://www.jusu-salons.lv/img/a123-1.jpg|https://www.jusu-salons.lv/img/a123-2.jpg;Viens īpašnieks, servisa grāmata.
`;

export function GET() {
  return new Response("﻿" + CSV, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="vienavieta-imports-paraugs.csv"' } });
}
