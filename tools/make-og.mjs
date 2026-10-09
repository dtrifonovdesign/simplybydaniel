// Builds public/og-image.png (1200x630) for link previews. Run: node tools/make-og.mjs
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F4EEE3"/>
  <g transform="translate(120 150) scale(3.3)">
    <path d="M48 10H75A5 5 0 0 1 80 15V41A5 5 0 0 1 75 46H48A18 18 0 0 1 48 10Z" fill="#1A1816"/>
    <path d="M52 54H25A5 5 0 0 0 20 59V85A5 5 0 0 0 25 90H52A18 18 0 0 0 52 54Z" fill="#B8935A"/>
  </g>
  <text x="470" y="330" font-family="Georgia, 'Times New Roman', serif" font-size="150" font-weight="600" fill="#1A1816" letter-spacing="-4">Simply</text>
  <text x="474" y="410" font-family="Arial, Helvetica, sans-serif" font-size="44" fill="#5C554B">Brands, made simply.</text>
  <rect x="474" y="450" width="96" height="6" rx="3" fill="#B8935A"/>
  <text x="474" y="520" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#5C554B">Logos, brand kits and websites</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(new URL('../public/og-image.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
console.log('wrote public/og-image.png');
