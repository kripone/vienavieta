// CSV paraugi importam (src/lib/importers/dealer-feed.ts saprot šos kolonnu nosaukumus).
const VEHICLE = `id;marka;modelis;gads;cena;nobraukums;degviela;atrumkarba;virsbuve;tilpums;krasa;pilseta;saite;bildes;apraksts
A123;Volkswagen;Golf;2019;13900;98000;Benzīns;Manuāla;Hečbeks;1.5;Balta;Rīga;https://www.jusu-salons.lv/auto/a123;https://www.jusu-salons.lv/img/a123-1.jpg|https://www.jusu-salons.lv/img/a123-2.jpg;Viens īpašnieks, servisa grāmata.
`;
const PROPERTY = `id;veids;darijums;cena;platiba;istabas;stavs;stavuskaits;zeme;pilseta;iela;saite;bildes;apraksts
D101;Dzīvoklis;pārdod;98000;56;2;3;5;;Rīga;Gaigalas iela 17;https://www.jusu-agentura.lv/d101;https://www.jusu-agentura.lv/img/d101-1.jpg|https://www.jusu-agentura.lv/img/d101-2.jpg;Renovēta māja, balkons.
M202;Māja;pārdod;245000;160;5;;2;1200;Ķekava;Liepu iela 4;https://www.jusu-agentura.lv/m202;https://www.jusu-agentura.lv/img/m202-1.jpg;Jauna māja ar dārzu.
I303;Dzīvoklis;īrē;650;48;2;2;9;;Rīga;Brīvības iela 120;https://www.jusu-agentura.lv/i303;https://www.jusu-agentura.lv/img/i303-1.jpg;Mēbelēts, uzreiz pieejams.
`;

export function GET(req: Request) {
  const property = new URL(req.url).searchParams.get("kind") === "property";
  return new Response("\uFEFF" + (property ? PROPERTY : VEHICLE), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="vienavieta-imports-${property ? "ipasumi" : "transports"}.csv"` },
  });
}
