import { LOGO } from './logo-data.js';

const [vbX, vbY, vbW, vbH] = LOGO.viewBox;
const WORDMARK_H = 836; // viewBox height without CONTRACTING
export const PLANK_SHAPE = LOGO.plank.split(' ').map((p) => p.split(',').map(Number));

const px = PLANK_SHAPE.map((p) => p[0]);
const py = PLANK_SHAPE.map((p) => p[1]);
// Where the plank (the "I") sits inside the wordmark, as % of the wordmark box. The 3D plank lands on this spot.
export function plankBox(contracting = true) {
  const h = contracting ? vbH : WORDMARK_H;
  return {
    left: ((Math.min(...px) - vbX) / vbW) * 100,
    top: ((Math.min(...py) - vbY) / h) * 100,
    width: ((Math.max(...px) - Math.min(...px)) / vbW) * 100,
    height: ((Math.max(...py) - Math.min(...py)) / h) * 100,
  };
}

let uid = 0;
// Inline Briks logo. Pieces carry classes so GSAP can animate them: .lg-l (letters), .lg-plank, .lg-ct (CONTRACTING).
//   plank: false leaves the "I" out (the 3D plank fills the gap), contracting: false drops the small line.
export function briksSVG({ contracting = true, plank = true, cls = '', letters = '#EFE7D6', ct = '#CFA65A', title = 'Briks Contracting', plankLight = false } = {}) {
  const id = `bk${uid++}`;
  const h = contracting ? vbH : WORDMARK_H;
  const g = plankLight ? ['#C9993F', '#8A5F1F'] : ['#F4DA93', '#B98B42'];
  return `<svg class="${cls}" viewBox="${vbX} ${vbY} ${vbW} ${h}" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient></defs>
<g class="lg-letters" fill="${letters}">${LOGO.letters.map((d, i) => `<path class="lg-l lg-l${i}" d="${d}"/>`).join('')}</g>
${plank ? `<polygon class="lg-plank" fill="url(#${id})" points="${LOGO.plank}"/>` : ''}
${contracting ? `<path class="lg-ct" fill="${ct}" d="${LOGO.contracting}"/>` : ''}
</svg>`;
}

// Simply's own mark. Colours come from brand.css (.logo-lockup .mark-top / .mark-bottom).
export const SIMPLY_MARK = () => '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="mark-top" d="M48 10H75A5 5 0 0 1 80 15V41A5 5 0 0 1 75 46H48A18 18 0 0 1 48 10Z" /><path class="mark-bottom" d="M52 54H25A5 5 0 0 0 20 59V85A5 5 0 0 0 25 90H52A18 18 0 0 0 52 54Z" /></svg>';

// The plank alone, always the same shape and proportion (tight viewBox around the mitred board).
//   fill: 'light' (gold for dark grounds), 'deep' (gold for light grounds) or 'wood' (oak face with a gold edge)
export function plankSVG({ fill = 'light' } = {}) {
  const id = `pk${uid++}`;
  const x0 = Math.min(...px), x1 = Math.max(...px), y0 = Math.min(...py), y1 = Math.max(...py);
  const pts = LOGO.plank;
  const g = fill === 'deep' ? ['#C9993F', '#8A5F1F'] : ['#F4DA93', '#B98B42'];
  const body = fill === 'wood'
    ? `<clipPath id="${id}c"><polygon points="${pts}"/></clipPath><image href="/case-studies/briks/tex/plank-face.webp" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id}c)"/><polygon points="${pts}" fill="none" stroke="#CFA65A" stroke-width="7" stroke-linejoin="round"/>`
    : `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient></defs><polygon points="${pts}" fill="url(#${id})"/>`;
  return `<svg viewBox="${x0 - 4} ${y0 - 4} ${x1 - x0 + 8} ${y1 - y0 + 8}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}
