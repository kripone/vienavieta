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
