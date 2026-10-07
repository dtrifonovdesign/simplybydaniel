// A crisp "digital design" overlay for the vector step: artboard, grid, snapped guides,
// a selection box with handles, pen-tool anchors and dimension callouts. Everything is
// drawn with clean straight strokes, which makes it clearly different from the pencil sketch.

const NS = 'http://www.w3.org/2000/svg';
const TOP = 'M48 10H75A5 5 0 0 1 80 15V41A5 5 0 0 1 75 46H48A18 18 0 0 1 48 10Z';
const BOT = 'M52 54H25A5 5 0 0 0 20 59V85A5 5 0 0 0 25 90H52A18 18 0 0 0 52 54Z';
const BRASS = '#B8935A';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// anchors at the corners where a straight line meets a curve (mark units)
const ANCHORS = [
  [48, 10], [75, 10], [80, 15], [80, 41], [75, 46], [48, 46], [30, 28],
  [52, 54], [25, 54], [20, 59], [20, 85], [25, 90], [52, 90], [70, 72],
];
const corners = [[20, 10], [50, 10], [80, 10], [20, 50], [80, 50], [20, 90], [50, 90], [80, 90]];

const sq = (x, y, pop) => `<rect data-pop="${pop}" x="${x - 1}" y="${y - 1}" width="2" height="2" rx="0.5" fill="var(--ink, #1A1816)" stroke="${BRASS}" stroke-width="0.35"/>`;

export function createDigital() {
  const wrap = document.createElement('div');
  wrap.className = 'sketch-overlay digital-overlay';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = `
  <svg viewBox="0 0 100 100" width="400" height="400" fill="none" stroke="currentColor" stroke-width="0.3"
       stroke-linecap="round" stroke-linejoin="round">
    <defs>
      <pattern id="dg-grid" width="5" height="5" patternUnits="userSpaceOnUse">
        <path d="M5 0H0V5" stroke-width="0.12" opacity="0.5"/>
      </pattern>
    </defs>

    <rect data-fade="0.02" x="6" y="2" width="88" height="96" rx="3" fill="url(#dg-grid)" stroke="none" opacity="0.5"/>
    <rect data-s="0" data-e="0.25" pathLength="1" x="6" y="2" width="88" height="96" rx="3" stroke-opacity="0.5"/>
    <text data-pop="0.12" x="7.5" y="-0.3" font-size="2.8" fill="currentColor" stroke="none" opacity="0.7" style="font-family: var(--font-body)">Logo · Artboard 1</text>

    <g stroke="${BRASS}" stroke-width="0.22" opacity="0.7">
      <path data-s="0.1" data-e="0.3" pathLength="1" d="M20 2V98"/>
      <path data-s="0.14" data-e="0.34" pathLength="1" d="M80 2V98"/>
      <path data-s="0.18" data-e="0.38" pathLength="1" d="M6 10H94"/>
      <path data-s="0.22" data-e="0.42" pathLength="1" d="M6 90H94"/>
      <path data-s="0.26" data-e="0.46" pathLength="1" d="M6 50H94" stroke-dasharray="1 1"/>
    </g>

    <g stroke="${BRASS}" stroke-width="0.4">
      <path data-s="0.3" data-e="0.5" pathLength="1" d="M20 10H80V90H20Z"/>
    </g>

    <g stroke="currentColor" stroke-width="0.55">
      <path data-s="0.38" data-e="0.7" pathLength="1" d="${TOP}"/>
      <path data-s="0.46" data-e="0.78" pathLength="1" d="${BOT}"/>
    </g>

    <g stroke="${BRASS}" stroke-width="0.3">
      <path data-pop="0.7" d="M30 18.1V37.9"/>
      <path data-pop="0.72" d="M70 62.1V81.9"/>
      <circle data-pop="0.72" cx="30" cy="18.1" r="0.9" fill="var(--ink, #1A1816)"/>
      <circle data-pop="0.72" cx="30" cy="37.9" r="0.9" fill="var(--ink, #1A1816)"/>
      <circle data-pop="0.74" cx="70" cy="62.1" r="0.9" fill="var(--ink, #1A1816)"/>
      <circle data-pop="0.74" cx="70" cy="81.9" r="0.9" fill="var(--ink, #1A1816)"/>
    </g>
    ${ANCHORS.map(([x, y], i) => sq(x, y, 0.6 + i * 0.012)).join('')}

    <g stroke="${BRASS}" stroke-width="0.3">
      ${corners.map(([x, y], i) => `<circle data-pop="${0.5 + i * 0.01}" cx="${x}" cy="${y}" r="1.2" fill="var(--ink, #1A1816)"/>`).join('')}
    </g>

    <g stroke="currentColor" stroke-width="0.25" opacity="0.85">
      <path data-s="0.78" data-e="0.9" pathLength="1" d="M20 94.5H80M20 93V96M80 93V96"/>
      <path data-s="0.8" data-e="0.92" pathLength="1" d="M89 10V90M87.5 10H90.5M87.5 90H90.5"/>
      <path data-s="0.84" data-e="0.94" pathLength="1" d="M84 46V54M82.5 46H85.5M82.5 54H85.5"/>
    </g>
    <g fill="currentColor" stroke="none" font-size="3" style="font-family: var(--font-body)">
      <text data-pop="0.86" x="50" y="92.1" text-anchor="middle">60</text>
      <text data-pop="0.88" x="0" y="0" text-anchor="middle" transform="translate(92.2 50) rotate(90)">80</text>
      <text data-pop="0.9" x="86.6" y="51.2">8</text>
      <text data-pop="0.92" x="82.5" y="7.6">r 5</text>
    </g>
  </svg>`;
  document.body.appendChild(wrap);

  const strokes = [...wrap.querySelectorAll('[data-s]')];
  const pops = [...wrap.querySelectorAll('[data-pop]')];
  const fades = [...wrap.querySelectorAll('[data-fade]')];
  strokes.forEach((el) => {
    if (!el.getAttribute('stroke-dasharray')) el.style.strokeDasharray = '1';
  });
  // the dashed guide keeps its dashes; draw it by opacity instead of by length
  const dashedGuide = wrap.querySelector('path[stroke-dasharray]');
  if (dashedGuide) dashedGuide.removeAttribute('data-s');

  let lastProg = -1;
  function draw(prog) {
    if (Math.abs(prog - lastProg) < 0.001) return;
    lastProg = prog;
    for (const el of strokes) {
      const s = parseFloat(el.dataset.s), e = parseFloat(el.dataset.e);
      const t = clamp((prog - s) / (e - s));
      el.style.strokeDashoffset = String(1 - t);
      el.style.opacity = t > 0.001 ? '1' : '0';
    }
    for (const el of pops) el.style.opacity = String(smooth(parseFloat(el.dataset.pop), parseFloat(el.dataset.pop) + 0.08, prog));
    for (const el of fades) el.style.opacity = String(0.5 * smooth(parseFloat(el.dataset.fade), 0.3, prog));
    if (dashedGuide) dashedGuide.style.opacity = String(smooth(0.26, 0.46, prog));
  }

  let shown = false;
  return {
    update(v, dark) {
      const facing = clamp((v.facing - 0.8) / 0.19);
      const op = clamp(v.vec * 1.5) * facing;
      if (op < 0.01) {
        if (shown) { wrap.style.display = 'none'; shown = false; }
        return;
      }
      if (!shown) { wrap.style.display = 'block'; shown = true; }
      wrap.style.color = dark > 0.5 ? '#F4EEE3' : '#1A1816';
      wrap.style.opacity = String(op);
      const k = v.box / 400;
      wrap.style.transform = `translate(${v.cx - 200}px, ${v.cy - 200}px) rotate(${v.rz}rad) scale(${k})`;
      draw(clamp(v.vec));
    },
  };
}
