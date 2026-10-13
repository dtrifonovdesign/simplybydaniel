// Gathers the files the Briks case study needs into public/case-studies/briks/.
// Run: node tools/prep-briks-case.mjs   (sources: the logo exploration export in the scratchpad and the Briks site folder)
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2] || 'C:/Users/Owner/AppData/Local/Temp/claude/C--Users-Owner--claude/59b7a229-95ca-4dfa-aaba-feb2f5c0794f/scratchpad/artifact-files/4650b237-f118-4dd7-8cb3-1c8c449b3df2/project';
const BRIKS = 'C:/Users/Owner/Documents/briks-site';
const OUT = path.resolve('public/case-studies/briks');
const mk = (d) => fs.mkdirSync(path.join(OUT, d), { recursive: true });
['explore', 'brief', 'tex', 'work'].forEach(mk);

// 1. logo explorations, in the order they were made
const LOGOS = ['A', 'C1', 'T3-gold', 'T2-gold', 'S3-gold', 'S1-gold', 'F', 'H', 'J', 'K', 'Et05', 'Ev03', 'E', 'E3-gold', 'Em01', 'EpD1', 'EqF1', 'EqL1', 'EqC4', 'EpM1'];
for (const n of LOGOS) fs.copyFileSync(path.join(SRC, 'logos', n + '.svg'), path.join(OUT, 'explore', n.replace('-gold', '') + '.svg'));

// 2. brief images
await sharp(path.join(SRC, 'brief/sketches.png')).webp({ quality: 88 }).toFile(path.join(OUT, 'brief/sketches.webp'));
await sharp(path.join(SRC, 'brief/moodboard.png')).webp({ quality: 90 }).toFile(path.join(OUT, 'brief/moodboard.webp'));

// 3. wood textures for the 3D plank, and the two real finished-floor photos
for (const f of ['plank-albedo.jpg', 'plank-normal.jpg', 'plank-rough.jpg']) fs.copyFileSync(path.join(BRIKS, 'public/tex', f), path.join(OUT, 'tex', f));
for (const f of ['work-kitchen.webp', 'work-dining.webp']) fs.copyFileSync(path.join(BRIKS, 'public/img', f), path.join(OUT, 'work', f));
fs.copyFileSync(path.join(BRIKS, 'public/lite/hero-land.webp'), path.join(OUT, 'work/felt.webp'));

// 4. the final logo's geometry (used to draw the wordmark and build the 3D plank)
const data = fs.readFileSync(path.join(BRIKS, 'src/core/logo-data.js'), 'utf8').replace(/^\/\/.*\n/, '');
fs.writeFileSync(path.resolve('src/briks/logo-data.js'), '// copied from the Briks site (scripts/build-logo.mjs there). The final logo, as outlines.\n' + data);
console.log('ok', fs.readdirSync(path.join(OUT, 'explore')).length, 'logos');

// 5. a flat, vertical wood face (one plank cut from the texture sheet) for the CSS "plank" panel
await sharp(path.join(OUT, 'tex/plank-albedo.jpg'))
  .extract({ left: 26, top: 343, width: 460, height: 82 })
  .rotate(90).resize(300, 1400, { fit: 'cover' }).modulate({ brightness: 1.06 })
  .webp({ quality: 86 }).toFile(path.join(OUT, 'tex/plank-face.webp'));

// 6. link preview image: Simply × Briks (1200x630)
const { LOGO } = await import(new URL('../src/briks/logo-data.js', import.meta.url).href);
const [vx, vy, vw, vh] = LOGO.viewBox;
const sc = 560 / vw;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9993F"/><stop offset="1" stop-color="#8A5F1F"/></linearGradient></defs>
  <rect width="1200" height="630" fill="#F4EEE3"/>
  <g transform="translate(110 190) scale(2.2)"><path d="M48 10H75A5 5 0 0 1 80 15V41A5 5 0 0 1 75 46H48A18 18 0 0 1 48 10Z" fill="#1A1816"/><path d="M52 54H25A5 5 0 0 0 20 59V85A5 5 0 0 0 25 90H52A18 18 0 0 0 52 54Z" fill="#B8935A"/></g>
  <text x="165" y="445" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="#1A1816" font-weight="700">Simply</text>
  <text x="438" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="#B8935A">×</text>
  <g transform="translate(500 ${290 - (vh * sc) / 2 - (267 - vy) * sc + 40}) scale(${sc}) translate(${-vx} 0)">
    <g fill="#0A0A0A">${LOGO.letters.map((d) => `<path d="${d}"/>`).join('')}</g>
    <polygon fill="url(#g)" points="${LOGO.plank}"/><path fill="#082219" d="${LOGO.contracting}"/>
  </g>
  <text x="600" y="545" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" letter-spacing="4" fill="#5C554B">CASE STUDY 01 · HOW SIMPLY BUILT BRIKS</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile(path.join(OUT, 'og.png'));
console.log('extras ok');
