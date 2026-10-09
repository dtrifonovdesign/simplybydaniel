import './brand.css';
import './style.css';
import gsap from 'gsap';
import Lenis from 'lenis';
import { createScene } from './scene.js';
import { createSketch } from './sketch.js';
import { createDigital } from './digital.js';
import { initCursor } from './cursor.js';
import { initFeatures } from './features.js';
import { initPerf } from './perf.js';
import { scroll, updateScroll } from './scroll.js';
import { initAnalytics } from './analytics.js';
import { initNotice } from './notice.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = window.matchMedia('(min-width: 860px)').matches;
const fine = window.matchMedia('(pointer: fine)').matches || new URLSearchParams(location.search).has('fine');

const body = document.body;
const loader = document.getElementById('loader');
const nav = document.getElementById('nav');
const canvas = document.getElementById('stage');
const quick = new URLSearchParams(location.search).has('skip') || reduced;

document.documentElement.classList.add('ready');
body.classList.add('is-loading');

// Quality tier: a guess from the device now, adjusted by the real frame rate while the page runs.
const perf = initPerf({ wide, reduced });
initAnalytics();
initNotice();

// Smooth scroll on capable desktops; phones and weaker machines keep native scrolling
// (native scrolling is drawn by the browser itself, so it stays smooth even when the page is busy).
let lenis = null;
if (fine && wide && !reduced && perf.cfg.lenis) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.stop();
}

// 3D scene
let stage = null;
try {
  stage = createScene(canvas, { desktop: wide, fine, reduced, quality: perf.cfg });
} catch (err) {
  console.warn('WebGL unavailable', err);
  body.classList.add('no-webgl');
}
perf.stats = () => (stage ? stage.stats() : '');
perf.onChange((cfg) => {
  stage?.setQuality(cfg);
  if (!cfg.lenis && lenis) { lenis.destroy(); lenis = null; }
});

let features = null;
// Phones: the About pose belongs to the picture at the top of the section, not the whole (tall) section,
// so the mark is already in place when Daniel scrolls into view instead of still travelling.
if (!wide) {
  const fig = document.getElementById('about-figure');
  const sec = document.getElementById('about');
  if (fig && sec) { fig.dataset.pose = 'about'; sec.removeAttribute('data-pose'); }
}
const anchorEls = [...document.querySelectorAll('[data-pose]')];
const remeasure = () => { stage && stage.measure(anchorEls); features && features.measure(); };
const onResize = () => { stage && stage.resize(); remeasure(); };
window.addEventListener('resize', onResize);
if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
document.fonts?.ready.then(remeasure);
remeasure();

initCursor({ fine, reduced });
const sketch = createSketch();
const digital = createDigital();
const FILE_NAMES = ['app-icon.svg', 'mark.svg', 'mark-mono-ink.svg', 'mark-mono-cream.svg'];
const fileLabels = FILE_NAMES.map((name) => {
  const el = document.createElement('div');
  el.className = 'file-label';
  el.textContent = name;
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  return el;
});
features = initFeatures({ getLenis: () => lenis, reduced, getStage: () => stage });

// Pointer (fine pointers only)
if (fine) {
  document.documentElement.addEventListener('mouseleave', () => stage && stage.leave());
  window.addEventListener('pointermove', (e) => {
    stage?.pointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });
}

// Scroll reveals (once)
const io = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
  }
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Tilt cards (desktop)
if (fine && !reduced) {
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg) translateY(-4px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// A hand-drawn arrow from the word "Daniel" to the Daniel sitting on the mark
const NSA = 'http://www.w3.org/2000/svg';
const arrowSvg = document.createElementNS(NSA, 'svg');
arrowSvg.setAttribute('class', 'arrow-overlay');
arrowSvg.setAttribute('aria-hidden', 'true');
arrowSvg.innerHTML =
  '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
  '<path class="arrow-line" pathLength="1" />' +
  '<path class="arrow-head" /></g>';
document.body.appendChild(arrowSvg);
const arrowLine = arrowSvg.querySelector('.arrow-line');
const arrowHead = arrowSvg.querySelector('.arrow-head');
arrowLine.style.strokeDasharray = '1';
let arrowProg = 0;
const aSmooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const whoEl = document.querySelector('.who');
let arrowShown = true;
let arrowEnd = null;
function arrowFrame(dt, sit) {
  if (!whoEl || !sit || sit.a < 0.55) {
    arrowProg = 0;
    arrowEnd = null;
    if (arrowShown) { arrowSvg.style.display = 'none'; arrowShown = false; } // nothing to composite while hidden
    return;
  }
  if (!arrowShown) { arrowSvg.style.display = ''; arrowShown = true; }
  // Both ends follow the same smoothed scroll as the 3D figure. The word "Daniel" is placed by its page
  // position minus the smoothed scroll (not its raw on-screen rect), so a stepped wheel can't make one end
  // jump while the other glides.
  const r = whoEl.getBoundingClientRect();
  const sx = r.right + 10, sy = r.top + r.height * 0.4 + (scroll.y - scroll.ys);
  // Phones: the word sits below the mark and the figure above it, so the arrow swings out to the right
  // of the mark and lands on the figure's right side instead of cutting across the logo.
  const box = wide ? null : sit.box;
  const tx = wide ? sit.x - sit.r - 18 : sit.x + sit.r + 14;
  const ty = box ? Math.min(sit.y, box.t - 12) : sit.y; // phones: land above the mark's top edge, never on it
  const k = arrowEnd ? 1 - Math.exp(-dt * 22) : 1;
  arrowEnd = arrowEnd || { x: tx, y: ty };
  arrowEnd.x += (tx - arrowEnd.x) * k;
  arrowEnd.y += (ty - arrowEnd.y) * k;
  const ex = arrowEnd.x, ey = arrowEnd.y;
  const dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy) || 1;
  let c1x, c1y, c2x, c2y;
  if (box) {
    // Phones: leave "Daniel" heading right, run up a rail that stays clear of the whole mark, and come in
    // to the figure from its right. A cubic with both handles on the rail only reaches ~75% of the way
    // out, so the rail is set far enough that the curve itself keeps a margin from the mark's edge.
    const want = box.r + 26;
    let rail = sx >= want ? sx + 40 : sx + (want - sx) / 0.72;
    rail = Math.min(rail, Math.max(sx + 30, window.innerWidth - 8));
    c1x = rail; c1y = sy + 4;
    c2x = rail; c2y = ey;
  } else {
    let nx = -dy / len, ny = dx / len;
    if (ny > 0) { nx = -nx; ny = -ny; } // bow upward
    const bow = Math.min(90, len * 0.22);
    c1x = sx + dx * 0.33 + nx * bow; c1y = sy + dy * 0.33 + ny * bow;
    c2x = sx + dx * 0.68 + nx * bow; c2y = sy + dy * 0.68 + ny * bow;
  }
  const bez = (u) => {
    const v = 1 - u;
    return [
      v * v * v * sx + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * ex,
      v * v * v * sy + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * ey,
    ];
  };
  // The hand-drawn wobble is built into the line itself (a fixed offset along its length), so it
  // stays put as the line moves, instead of an SVG noise filter that shimmers every frame.
  const N = 48;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    let [px, py] = bez(u);
    const [ax, ay] = bez(Math.max(0, u - 0.01)), [bx, by] = bez(Math.min(1, u + 0.01));
    const tl = Math.hypot(bx - ax, by - ay) || 1;
    const w = Math.sin(u * Math.PI) * (Math.sin(u * 19 + 1.3) * 1.1 + Math.sin(u * 7.3) * 1.3);
    px += (-(by - ay) / tl) * w; py += ((bx - ax) / tl) * w;
    d += (i ? ' L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
  }
  arrowLine.setAttribute('d', d);
  const ang = Math.atan2(ey - c2y, ex - c2x);
  const hl = 13, spread = 0.5;
  arrowHead.setAttribute('d',
    'M' + (ex - Math.cos(ang - spread) * hl).toFixed(1) + ' ' + (ey - Math.sin(ang - spread) * hl).toFixed(1) +
    ' L' + ex.toFixed(1) + ' ' + ey.toFixed(1) +
    ' L' + (ex - Math.cos(ang + spread) * hl).toFixed(1) + ' ' + (ey - Math.sin(ang + spread) * hl).toFixed(1));
  arrowProg = reduced ? 1 : Math.min(1, arrowProg + dt * 0.75);
  const t = aSmooth(0, 1, Math.max(0, arrowProg - 0.2) / 0.8);
  arrowLine.style.strokeDashoffset = String(1 - t);
  arrowHead.style.opacity = String(aSmooth(0.88, 1, t));
  arrowSvg.style.opacity = String(Math.min(1, (sit.a - 0.55) / 0.3));
}

// Main loop
let last = performance.now();
let wasDark = false;
let wasScrolled = false;
function frame(now) {
  requestAnimationFrame(frame);
  // Time-based, with a generous ceiling: on a slow machine animations take the same real time,
  // they just advance in bigger steps, instead of dragging out in slow motion.
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  perf.frame(now);
  lenis?.raf(now);
  updateScroll(lenis ? lenis.scroll : window.scrollY, dt);
  const scrolled = scroll.y > 24;
  if (scrolled !== wasScrolled) { nav.classList.toggle('is-scrolled', scrolled); wasScrolled = scrolled; }
  if (document.hidden) return;
  features.fly(now);
  if (stage) {
    stage.setTravel(features.travel());
    const v = stage.update(dt, scroll.ys, scroll.vel, now / 1000);
    const dark = v.dark;
    sketch.update(v, dark);
    digital.update(v, dark);
    arrowFrame(dt, v.sit);
    features.sync(v.tw);
    fileLabels.forEach((el, i) => {
      const pt = v.fileLabels[i];
      if (!pt || pt.a < 0.35) { el.style.opacity = '0'; return; }
      el.style.opacity = String(Math.min(1, (pt.a - 0.35) / 0.5));
      el.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, 0)`;
    });
    const isDark = wasDark ? dark > 0.42 : dark > 0.58;
    if (isDark !== wasDark) { body.classList.toggle('theme-ink', isDark); wasDark = isDark; }
  }
}
requestAnimationFrame(frame);

// In-page links
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: id === '#process' ? -20 : 0, duration: 1.6 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
});

// Intro: the halves close the gap on cream, the wordmark leaves,
// then the flat mark turns into the 3D object and the page opens around it.
function finishIntro() {
  body.classList.remove('is-loading');
  loader.classList.add('is-done');
  lenis?.start();
  features.measure(); // the page just became its real height
  setTimeout(() => loader.remove(), 1000);
}

async function runIntro() {
  if (!stage || quick) {
    stage?.setIntro(1);
    canvas.style.opacity = '1';
    finishIntro();
    return;
  }
  const fontsReady = document.fonts
    ? Promise.race([
        Promise.all([document.fonts.load('600 64px Fraunces'), document.fonts.load('500 16px Figtree')]),
        new Promise((r) => setTimeout(r, 1500)),
      ])
    : Promise.resolve();
  await fontsReady;

  const lockup = loader.querySelector('.loader__lockup');
  const svg = lockup.querySelector('svg');
  const word = lockup.querySelector('.wordmark');
  loader.classList.add('is-go'); // starts the logo-reveal animation

  const svgPx = svg.getBoundingClientRect().width;
  stage.setIntroSize(svgPx);
  stage.setIntro(0);

  // The mark slides right, shoving the word off the screen, and stops centered.
  const shift = (word.getBoundingClientRect().width + svgPx * 0.2) / 2;
  const W = window.innerWidth;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const run = { t: 0 };
  const tl = gsap.timeline({ delay: 1.8 });
  // the reveal has finished by now; release it so our transform can take over
  tl.add(() => { word.style.animation = 'none'; }, 0);
  tl.to(run, {
    t: 1, duration: 1.2, ease: 'none',
    onUpdate() {
      const t = run.t;
      const mx = shift * ease(t);
      svg.style.transform = `translateX(${mx}px)`;
      word.style.transform = `translateX(${mx + W * t * t * t}px)`;
    },
  })
    // hand off: flat mark out, 3D mark in at the same size and place
    .add(() => { canvas.style.opacity = '1'; svg.style.opacity = '0'; loader.style.background = 'transparent'; }, '+=0.12')
    .to({ v: 0 }, {
      v: 1, duration: 2.1, ease: 'none',
      onUpdate() { stage.setIntro(this.targets()[0].v); },
    }, '<')
    .add(finishIntro, '<0.15');
}
runIntro().catch((err) => { console.error('intro failed', err); finishIntro(); });

// Keep body state correct if the tab was hidden mid-intro
document.addEventListener('visibilitychange', () => { last = performance.now(); });
