// Ģenerē PWA ikonas no logotipa (node scripts/make-icons.mjs).
import sharp from "sharp";
const pin = `<path d="M32 12c-9 0-16 7-16 16 0 12 16 24 16 24s16-12 16-24c0-9-7-16-16-16zm0 22a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" fill="#fff"/>`;
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#9e3039"/>${pin}</svg>`;
const square = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#9e3039"/><g transform="translate(32 32) scale(${scale}) translate(-32 -32)">${pin}</g></svg>`;
const badge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g transform="translate(32 32) scale(1.25) translate(-32 -32)">${pin}</g></svg>`;
const out = "public/icons/";
await sharp(Buffer.from(rounded)).resize(192, 192).png().toFile(out + "icon-192.png");
await sharp(Buffer.from(rounded)).resize(512, 512).png().toFile(out + "icon-512.png");
await sharp(Buffer.from(square(0.8))).resize(512, 512).png().toFile(out + "maskable-512.png");
await sharp(Buffer.from(square(0.8))).resize(192, 192).png().toFile(out + "maskable-192.png");
await sharp(Buffer.from(badge)).resize(96, 96).png().toFile(out + "badge-96.png");
await sharp(Buffer.from(square(0.9))).resize(180, 180).png().toFile("src/app/apple-icon.png");

// Noklusējuma attēls kopīgošanai (Open Graph, 1200×630)
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f3f4f7"/>
  <rect x="0" y="560" width="1200" height="70" fill="#9e3039"/>
  <g transform="translate(110 150) scale(4.2)"><rect width="64" height="64" rx="14" fill="#9e3039"/>${pin}</g>
  <text x="420" y="270" font-family="DejaVu Sans, Arial, sans-serif" font-size="96" font-weight="800" fill="#181b24">Vienā<tspan fill="#9e3039">Vietā</tspan></text>
  <text x="424" y="350" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" fill="#5d6475">Visi Latvijas sludinājumi</text>
  <text x="424" y="400" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" fill="#5d6475">vienā meklētājā</text>
  <text x="110" y="607" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="#fff">Auto · Moto · Dzīvokļi · Mājas · Zeme · vienavieta.lv</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile("public/og.png");
