// A 2D pencil-sketch overlay that sits exactly where the 3D mark is during the
// "Paper comes first" step. It draws construction lines first, then loose
// overshooting strokes, then the rough outline, then hatching.

const NS = 'http://www.w3.org/2000/svg';
const TOP = 'M48 10H75A5 5 0 0 1 80 15V41A5 5 0 0 1 75 46H48A18 18 0 0 1 48 10Z';
const BOT = 'M52 54H25A5 5 0 0 0 20 59V85A5 5 0 0 0 25 90H52A18 18 0 0 0 52 54Z';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function hatch(x0, y0, x1, y1, step) {
  let d = '';
  let flip = false;
  for (let k = -(y1 - y0); k < x1 - x0 + (y1 - y0); k += step) {
    const ax = x0 + k, ay = y1, bx = x0 + k + (y1 - y0), by = y0;
    d += flip ? `M${bx} ${by}L${ax} ${ay}` : `M${ax} ${ay}L${bx} ${by}`;
    flip = !flip;
  }
  return d;
}

export function createSketch() {
  const wrap = document.createElement('div');
  wrap.className = 'sketch-overlay';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = `
  <svg viewBox="0 0 100 100" width="400" height="400" fill="none" stroke="currentColor"
       stroke-linecap="round" stroke-linejoin="round">
    <defs>
      <filter id="rough-a" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.7"/>
      </filter>
      <filter id="rough-b" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="11" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.3"/>
      </filter>
      <clipPath id="clip-top"><path d="${TOP}"/></clipPath>
      <clipPath id="clip-bot"><path d="${BOT}"/></clipPath>
    </defs>

    <g class="guide" stroke-width="0.25" opacity="0.5" filter="url(#rough-b)">
      <path data-s="0" data-e="0.3" pathLength="1" d="M50 3V97"/>
      <path data-s="0.02" data-e="0.32" pathLength="1" d="M10 50H90"/>
    </g>
    <g class="guide" stroke-width="0.25" opacity="0.5" filter="url(#rough-b)">
      <path data-s="0.05" data-e="0.35" pathLength="1" d="M20 10H80V90H20Z" stroke-dasharray="1.2 1.2"/>
      <circle data-s="0.12" data-e="0.42" pathLength="1" cx="48" cy="28" r="18"/>
      <circle data-s="0.2" data-e="0.5" pathLength="1" cx="52" cy="72" r="18"/>
    </g>
    <g class="measure" stroke-width="0.3" opacity="0.7" filter="url(#rough-b)">
      <path data-s="0.3" data-e="0.4" pathLength="1" d="M86 46V54M84 46H88M84 54H88"/>
      <text x="89.5" y="51.2" font-size="4" fill="currentColor" stroke="none" style="font-family: var(--font-body)" data-fade="0.4">8</text>
    </g>

    <g class="loose" stroke-width="0.45" opacity="0.8" filter="url(#rough-b)">
      <path data-s="0.3" data-e="0.5" pathLength="1" d="M41 9.6H85"/>
      <path data-s="0.34" data-e="0.54" pathLength="1" d="M42 46.4H84"/>
      <path data-s="0.38" data-e="0.58" pathLength="1" d="M80.4 5V51"/>
      <path data-s="0.42" data-e="0.62" pathLength="1" d="M57 53.6H15"/>
      <path data-s="0.46" data-e="0.66" pathLength="1" d="M56 90.4H16"/>
      <path data-s="0.5" data-e="0.7" pathLength="1" d="M19.6 49V95"/>
    </g>

    <g class="outline" stroke-width="0.75" filter="url(#rough-a)">
      <path data-s="0.4" data-e="0.8" pathLength="1" d="${TOP}"/>
      <path data-s="0.5" data-e="0.88" pathLength="1" d="${BOT}"/>
    </g>
    <g class="outline2" stroke-width="0.4" opacity="0.6" filter="url(#rough-b)" transform="translate(0.5 -0.4)">
      <path data-s="0.55" data-e="0.9" pathLength="1" d="M48 10A18 18 0 0 0 48 46"/>
      <path data-s="0.6" data-e="0.95" pathLength="1" d="M52 54A18 18 0 0 1 52 90"/>
      <path data-s="0.58" data-e="0.9" pathLength="1" d="M48 10.2H75A4.8 4.8 0 0 1 79.8 15V41A4.8 4.8 0 0 1 75 45.8H48"/>
      <path data-s="0.62" data-e="0.95" pathLength="1" d="M52 54.2H25A4.8 4.8 0 0 0 20.2 59V85A4.8 4.8 0 0 0 25 89.8H52"/>
    </g>

    <g class="hatch" stroke-width="0.28" opacity="0.5" filter="url(#rough-b)">
      <g clip-path="url(#clip-top)"><path data-s="0.78" data-e="1" pathLength="1" d="${hatch(28, 8, 82, 48, 2.6)}"/></g>
      <g clip-path="url(#clip-bot)"><path data-s="0.84" data-e="1" pathLength="1" d="${hatch(18, 52, 54, 92, 2.6)}"/></g>
    </g>
  </svg>`;
  document.body.appendChild(wrap);

  const strokes = [...wrap.querySelectorAll('[data-s]')].filter((el) => el.tagName !== 'text');
  const fades = [...wrap.querySelectorAll('[data-fade]')];
  strokes.forEach((el) => { el.style.strokeDasharray = el.style.strokeDasharray || '1'; });
  // dashed construction rect needs real dashes; keep it visible by drawing it with opacity instead
  const dashed = wrap.querySelector('path[stroke-dasharray]');
  if (dashed) { dashed.removeAttribute('stroke-dasharray'); dashed.style.strokeDasharray = '1'; }

  let lastProg = -1;
  function draw(prog) {
    if (Math.abs(prog - lastProg) < 0.001) return;
    lastProg = prog;
    for (const el of strokes) {
      const s = parseFloat(el.dataset.s), e = parseFloat(el.dataset.e);
      const t = easeInOut(clamp((prog - s) / (e - s)));
      el.style.strokeDashoffset = String(1 - t);
      el.style.opacity = t > 0.001 ? '1' : '0';
    }
    for (const el of fades) el.style.opacity = prog > parseFloat(el.dataset.fade) ? '1' : '0';
  }

  let shown = false;
  return {
    update(v, dark) {
      // v: { sketch, vec, cx, cy, box, rz, facing }
      const facing = clamp((v.facing - 0.8) / 0.19);
      const op = clamp(v.sketch * 1.4) * (1 - clamp(v.vec * 2.6)) * facing;
      if (op < 0.01) {
        if (shown) { wrap.style.display = 'none'; shown = false; }
        return;
      }
      if (!shown) { wrap.style.display = 'block'; shown = true; }
      wrap.style.color = dark > 0.5 ? '#F4EEE3' : '#1A1816';
      wrap.style.opacity = String(op);
      const k = v.box / 400;
      wrap.style.transform = `translate(${v.cx - 200}px, ${v.cy - 200}px) rotate(${v.rz}rad) scale(${k})`;
      draw(clamp(v.sketch));
    },
  };
}
