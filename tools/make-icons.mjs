// Raster favicons from public/favicon.svg: Google wants a crawlable icon in a multiple of 48px; apple-touch for iOS.
import sharp from 'sharp';
import fs from 'node:fs';
const svg = fs.readFileSync('public/favicon.svg');
const png = (n) => sharp(svg, { density: 600 }).resize(n, n).png().toBuffer();
fs.writeFileSync('public/favicon-48.png', await png(48));
fs.writeFileSync('public/favicon-192.png', await png(192));
fs.writeFileSync('public/apple-touch-icon.png', await png(180));
// favicon.ico with one embedded 48px PNG
const p = await png(48), h = Buffer.alloc(22);
h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4); h[6] = 48; h[7] = 48; h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12); h.writeUInt32LE(p.length, 14); h.writeUInt32LE(22, 18);
fs.writeFileSync('public/favicon.ico', Buffer.concat([h, p]));
console.log('icons ok');
