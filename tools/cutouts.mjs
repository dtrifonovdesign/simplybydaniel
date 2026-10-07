// Plain cutouts: the original photo pixels at full resolution, with only the background removed.
//   node tools/cutouts.mjs
import sharp from 'sharp';

const ROOT = 'C:/Users/Owner/AppData/Local/Temp/claude/C--Users-Owner--claude/59b7a229-95ca-4dfa-aaba-feb2f5c0794f';
const IMG = ROOT + '/images', SCR = ROOT + '/scratchpad';
const OUT = 'C:/Users/Owner/simply-site/public/images';
const W = 1333, H = 2000;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

for (const n of ['1', '2']) {
  const rgb = await sharp(`${IMG}/${n}.jpg`).removeAlpha().raw().toBuffer();
  const cut = await sharp(`${SCR}/cut-${n}.png`).ensureAlpha().raw().toBuffer();
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    let a = cut[i * 4 + 3];
    const y = (i / W) | 0;
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    // leftover red brick next to the shoe in the doorway photo
    if (n === '2' && y > 1600 && r - b > 4 && r - g > 14) a = 0;
    // the smiling photo stops at the knees: let the bottom edge fade out instead of ending in a hard line
    if (n === '1' && y > 1880) a = Math.round(a * (1 - smooth(1880, 1995, y)));
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = a;
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 93, alphaQuality: 100, effort: 5 })
    .toFile(`${OUT}/daniel-${n}-cut.webp`);
  console.log('wrote', n);
}
