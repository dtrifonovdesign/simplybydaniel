import './brand.css';
import './style.css';
import gsap from 'gsap';
import Lenis from 'lenis';
import { createScene } from './scene.js';
import { createSketch } from './sketch.js';
import { createDigital } from './digital.js';
import { initCursor } from './cursor.js';
import { initFeatures } from './features.js';

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

// Smooth scroll on desktop only; phones keep native scrolling.
let lenis = null;
if (fine && wide && !reduced) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.stop();
}

// 3D scene
let stage = null;
try {
  stage = createScene(canvas, { desktop: wide, fine, reduced });
} catch (err) {
  console.warn('WebGL unavailable', err);
  body.classList.add('no-webgl');
}

const anchorEls = [...document.querySelectorAll('[data-pose]')];
const remeasure = () => stage && stage.measure(anchorEls);
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
const features = initFeatures({ lenis, reduced, getStage: () => stage });

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

// Daniel and the big mark behind him drift a little against each other
const aboutFig = document.getElementById('about-figure');
const figMove = { x: 0, y: 0, tx: 0, ty: 0 };
if (aboutFig && fine) {
  window.addEventListener('pointermove', (e) => {
    figMove.tx = (e.clientX / innerWidth) * 2 - 1;
    figMove.ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
}
function figFrame() {
  if (!aboutFig) return;
  if (aboutFig.classList.contains('is-visible') && !aboutFig._settled) { aboutFig._settled = 1; setTimeout(() => aboutFig.classList.add('is-settled'), 1300); }
  const r = aboutFig.getBoundingClientRect();
  if (r.bottom < -100 || r.top > innerHeight + 100) return;
  figMove.x += (figMove.tx - figMove.x) * 0.08;
  figMove.y += (figMove.ty - figMove.y) * 0.08;
  const sc = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
  aboutFig.style.setProperty('--px', figMove.x.toFixed(3));
  aboutFig.style.setProperty('--py', (figMove.y + sc * 0.8).toFixed(3));
}

// A hand-drawn arrow from the word "Daniel" to the Daniel sitting on the mark
const NSA = 'http://www.w3.org/2000/svg';
const arrowSvg = document.createElementNS(NSA, 'svg');
arrowSvg.setAttribute('class', 'arrow-overlay');
arrowSvg.setAttribute('aria-hidden', 'true');
arrowSvg.innerHTML =
  '<defs><filter id="arrow-rough" x="-5%" y="-5%" width="110%" height="110%">' +
  '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter></defs>' +
  '<g filter="url(#arrow-rough)" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
  '<path class="arrow-line" pathLength="1" />' +
  '<path class="arrow-head" /></g>';
document.body.appendChild(arrowSvg);
const arrowLine = arrowSvg.querySelector('.arrow-line');
const arrowHead = arrowSvg.querySelector('.arrow-head');
arrowLine.style.strokeDasharray = '1';
let arrowProg = 0;
const aSmooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function arrowFrame(dt, sit) {
  const who = document.querySelector('.who');
  if (!who || !sit || sit.a < 0.55) {
    arrowProg = 0;
    arrowSvg.style.opacity = '0';
    return;
  }
  const r = who.getBoundingClientRect();
  const sx = r.right + 10, sy = r.top + r.height * 0.4;
  const ex = sit.x - sit.r - 18, ey = sit.y;
  const dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len;
  if (ny > 0) { nx = -nx; ny = -ny; } // bow upward
  const bow = Math.min(90, len * 0.22);
  const c1x = sx + dx * 0.33 + nx * bow, c1y = sy + dy * 0.33 + ny * bow;
  const c2x = sx + dx * 0.68 + nx * bow, c2y = sy + dy * 0.68 + ny * bow;
  arrowLine.setAttribute('d', 'M' + sx + ' ' + sy + ' C' + c1x + ' ' + c1y + ', ' + c2x + ' ' + c2y + ', ' + ex + ' ' + ey);
  const ang = Math.atan2(ey - c2y, ex - c2x);
  const hl = 13, spread = 0.5;
  arrowHead.setAttribute('d',
    'M' + (ex - Math.cos(ang - spread) * hl) + ' ' + (ey - Math.sin(ang - spread) * hl) +
    ' L' + ex + ' ' + ey +
    ' L' + (ex - Math.cos(ang + spread) * hl) + ' ' + (ey - Math.sin(ang + spread) * hl));
  arrowProg = reduced ? 1 : Math.min(1, arrowProg + dt * 0.75);
  const t = aSmooth(0, 1, Math.max(0, arrowProg - 0.2) / 0.8);
  arrowLine.style.strokeDashoffset = String(1 - t);
  arrowHead.style.opacity = String(aSmooth(0.88, 1, t));
  arrowSvg.style.opacity = String(Math.min(1, (sit.a - 0.55) / 0.3));
}

// Main loop
let last = performance.now();
let lastScroll = 0;
let velSmooth = 0;
let wasDark = false;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  lenis?.raf(now);
  figFrame();
  const y = lenis ? lenis.scroll : window.scrollY;
  const velRaw = dt > 0 ? (y - lastScroll) / dt : 0;
  velSmooth += (velRaw - velSmooth) * Math.min(1, dt * 8);
  const vel = velSmooth;
  lastScroll = y;
  nav.classList.toggle('is-scrolled', y > 24);
  if (stage && !document.hidden) {
    stage.setTravel(features.travel());
    features.fly();
    const v = stage.update(dt, y, vel, now / 1000);
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
