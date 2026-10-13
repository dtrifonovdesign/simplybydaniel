import '../brand.css';
import '../style.css';
import './style.css';
import gsap from 'gsap';
import Lenis from 'lenis';
import { initPerf } from '../perf.js';
import { updateScroll } from '../scroll.js';
import { initAnalytics, track } from '../analytics.js';
import { initNotice } from '../notice.js';
import { briksSVG, SIMPLY_MARK, plankBox, plankSVG } from './logo.js';
import { createPlank } from './scene.js';
import { initCard3D } from './card3d.js';
import { initCoin3D } from './coin3d.js';
import { initLogo3D } from './logo3d.js';

// Case study 01: how Simply built Briks. The page is Simply's own (tokens, nav, trail, buttons, cards, footer);
// Briks' colours and type only appear on the work being shown.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = matchMedia('(min-width: 860px)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const body = document.body;

document.documentElement.classList.add('ready');
const perf = initPerf({ wide, reduced });
const SECTIONS = ['challenge', 'words', 'research', 'sketch', 'explore', 'finish', 'system', 'apps', 'website', 'wrapup'];
initAnalytics({ sections: SECTIONS, prefix: 'briks-view-' });

/* ------------------------------------------------------------------ logos */
const simplyLockup = `${SIMPLY_MARK()}<span class="wordmark">Simply</span>`;
['#nav-simply', '#foot-simply'].forEach((s) => { $(s).innerHTML = simplyLockup; });
$('#loader-simply').innerHTML = simplyLockup;
$('#loader-simply').classList.add('logo-reveal');
const BRIKS_INK = { letters: '#0A0A0A', ct: '#082219', plankLight: true };
$('#loader-briks').innerHTML = briksSVG({ ...BRIKS_INK, contracting: false, title: 'Briks' });
$('#nav-briks').innerHTML = briksSVG({ letters: 'currentColor', contracting: false, title: 'Briks' });
$('#logo3d-fb').innerHTML = briksSVG({});
$('#sheet-logo').innerHTML = briksSVG({ ...BRIKS_INK });
$('#poster-logo').innerHTML = briksSVG();
$('#poster-logo-m').innerHTML = briksSVG({ contracting: false });
$('#job-i').innerHTML = briksSVG({ contracting: false });
$$('.pk').forEach((el) => { el.innerHTML = plankSVG({ fill: el.dataset.pk }); });

// the big wordmark: the I is left empty and the 3D plank flies in and lands there
{
  const el = $('#wordmark-big');
  el.innerHTML = briksSVG({ plank: false });
  const b = plankBox(true);
  const slot = document.createElement('span');
  slot.className = 'i-slot slot';
  slot.dataset.slot = 'logo'; slot.dataset.spin = '2'; slot.dataset.tilt = '0.5';
  slot.style.cssText = `left:${b.left}%;top:${b.top}%;width:${b.width}%;height:${b.height}%`;
  slot.setAttribute('aria-hidden', 'true');
  slot.innerHTML = '<i class="css-plank"></i>';
  el.appendChild(slot);
}

/* ------------------------------------------------------------------ the challenge: words light up as you read */
const pull = $('#pull');
{
  const words = pull.textContent.trim().split(/\s+/);
  pull.setAttribute('aria-label', pull.textContent.trim());
  pull.innerHTML = words.map((w, i) => `<span class="w${/^AI/.test(w) ? ' w--ai' : ''}" aria-hidden="true">${w}</span>`).join(' ');
}
const pullWords = $$('.w', pull);

/* ------------------------------------------------------------------ 01 words + sliders */
const WORDS = ['Modern', 'Warm', 'Bold', 'Playful', 'Trustworthy', 'Premium', 'Friendly', 'Confident', 'Classic', 'Creative', 'Approachable', 'Handmade', 'Professional', 'Fun', 'Clean', 'Local'];
const PICKED = new Set(['Trustworthy', 'Premium', 'Confident', 'Creative', 'Professional']);
$('#words-list').innerHTML = WORDS.map((w) => `<li data-pick="${PICKED.has(w) ? 1 : 0}">${w}</li>`).join('');
const SLIDERS = [['Classic', 'Modern', 2], ['Playful', 'Serious', 5], ['Minimal', 'Detailed', 1], ['Soft', 'Bold', 1], ['Warm', 'Cool', 2], ['Approachable', 'Exclusive', 6]];
$('#sliders').innerHTML = SLIDERS.map(([a, b, v]) => `<div class="cs-sl" role="img" aria-label="${a} to ${b}: leaning ${v < 3 ? a : v > 3 ? b : 'neither'}${v === 6 ? ', fully' : ''}"><span>${a}</span><div class="cs-sl__track" style="--p:.5" data-p="${v / 6}"><div class="cs-sl__ticks">${'<i></i>'.repeat(7)}</div><i class="cs-sl__dot"></i></div><span>${b}</span></div>`).join('');

/* ------------------------------------------------------------------ 04 exploration wall */
const ROUNDS = ['A', 'C1', 'T3', 'T2', 'S3', 'S1', 'F', 'H', 'J', 'K', 'Et05', 'Ev03', 'E', 'E3', 'Em01', 'EpD1', 'EqF1', 'EqL1', 'EqC4', 'EpM1'];
const NOTES = {
  A: 'A script wordmark.',
  C1: 'The strongest sketch, built.',
  EqC4: 'Mitred board, one seam.',
  EpM1: 'Mitred board, no seam. The one.',
};
const BASE_TEXT = $('#explore-text').textContent;
const stage = $('#explore-stage');
stage.innerHTML = ROUNDS.map((n, i) => `<img src="/case-studies/briks/explore/${n}.svg" alt="${i === ROUNDS.length - 1 ? 'The chosen logo: BRIKS with a mitred gold plank as the I' : `Logo exploration ${i + 1}`}" loading="eager" decoding="async" />`).join('') + '<span class="tag" id="explore-tag">The one</span>';
$('#strip').innerHTML = ROUNDS.map((n) => `<li><img src="/case-studies/briks/explore/${n}.svg" alt="" loading="lazy" decoding="async" /></li>`).join('');
const stImgs = $$('img', stage), stThumbs = $$('#strip li'), roundN = $('#round-n'), tag = $('#explore-tag'), exText = $('#explore-text');
let exIdx = -1;
function setRound(i, p) {
  roundN.textContent = String(1 + Math.round(p * (ROUNDS.length - 1))).padStart(2, '0');
  if (i === exIdx) return;
  exIdx = i;
  stImgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
  stThumbs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.classList.toggle('is-past', k < i); });
  const last = i === ROUNDS.length - 1;
  tag.classList.toggle('is-on', last);
  exText.textContent = NOTES[ROUNDS[i]] || BASE_TEXT;
  if (last) track('briks-reached-final');
}

/* ------------------------------------------------------------------ 06 palette */
const SW = [
  ['Forest', '#082219', 'Base. Backgrounds, signage, wraps.'],
  ['Moss', '#123629', 'Raised green. Cards, borders.'],
  ['Parchment', '#EFE7D6', 'Letters, headlines, paper.'],
  ['Gold', '#CFA65A', 'Rules, icons, buttons.'],
  ['Ink', '#0A0A0A', 'Text, dark panels, one-colour print.'],
];
$('#pal').innerHTML = SW.map(([n, hex, role], i) => `<li class="reveal" style="--i:${i}"><div class="cs-pal__chip" style="background:${hex.includes(' to ') ? 'linear-gradient(180deg,#F4DA93,#B98B42)' : hex}"></div><div><b>${n.toUpperCase()}</b><code>${hex}</code></div><p>${role}</p></li>`).join('');

/* ------------------------------------------------------------------ 05 the four jobs (tabs) */
{
  const tabs = $$('#jobs [role="tab"]'), panels = $$('#jobs [role="tabpanel"]');
  const pick = (i, focus) => {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => {
      if (k === i) { p.hidden = false; requestAnimationFrame(() => p.classList.add('is-on')); } else { p.classList.remove('is-on'); p.hidden = true; }
    });
    if (focus) tabs[i].focus();
    track('briks-job-' + (i + 1));
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(i));
    t.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); pick((i + 1) % tabs.length, true); }
      if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); pick((i + tabs.length - 1) % tabs.length, true); }
    });
  });
}

/* ------------------------------------------------------------------ 06 the typefaces I went through */
{
  const FONTS = ['Cinzel', 'Cormorant Garamond', 'Playfair Display', 'Libre Baskerville', 'EB Garamond', 'Lora', 'Crimson Text', 'Cardo', 'Gilda Display', 'Marcellus', 'Bodoni Moda', 'DM Serif Display', 'Prata', 'Cormorant', 'Spectral', 'Old Standard TT', 'Sorts Mill Goudy', 'Vollkorn', 'Noto Serif Display', 'Fraunces', 'Libre Caslon Text', 'Rufina', 'Italiana', 'Cinzel Decorative', 'Trirong', 'Abhaya Libre', 'Alike', 'Bellefair', 'Castoro', 'Della Respira', 'Gloock', 'Instrument Serif', 'Ibarra Real Nova', 'Newsreader', 'Brygada 1918', 'Cormorant SC', 'Cormorant Infant', 'Forum'];
  const grid = $('#wall-grid'), count = $('#wall-n'), win = $('#wall-win');
  grid.innerHTML = FONTS.map((f) => `<li data-f="${f}"><span style="font-family:'${f}', serif">BRIKS</span><small>${f}</small></li>`).join('');
  const tiles = $$('li', grid);
  const finish = () => { count.textContent = FONTS.length; tiles.forEach((t) => { t.classList.add('is-on'); t.classList.toggle('is-win', t.dataset.f === 'Forum'); }); grid.classList.add('is-done'); win.textContent = 'Forum won.'; };
  let ran = false;
  new IntersectionObserver((en, io) => {
    if (!en[0].isIntersecting || ran) return;
    ran = true; io.disconnect();
    if (reduced) { finish(); return; }
    let i = 0;
    const tick = () => {
      if (i >= tiles.length) { setTimeout(finish, 350); return; }
      tiles[i].classList.add('is-on'); i++; count.textContent = i;
      setTimeout(tick, 70);
    };
    tick();
  }, { threshold: 0.3 }).observe($('#wall'));
}

/* ------------------------------------------------------------------ 06 type lab */
{
  const sample = $('#lab-sample'), rt = $('#r-track'), rw = $('#r-weight'), ot = $('#o-track'), ow = $('#o-weight');
  const FACES = { times: ['"Times New Roman", Times, serif', 0, 0], forum: ['Forum, serif', 0, 0], tuned: ['Forum, serif', 0.04, 0.022] };
  let face = 'tuned';
  const fmt = (v) => (+v).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + 'em';
  const apply = () => {
    sample.style.fontFamily = FACES[face][0];
    sample.style.letterSpacing = rt.value + 'em';
    sample.style.webkitTextStrokeWidth = rw.value + 'em';
    ot.textContent = fmt(rt.value); ow.textContent = fmt(rw.value);
  };
  $$('input[name="face"]').forEach((r) => r.addEventListener('change', () => {
    face = r.value;
    rt.value = FACES[face][1]; rw.value = FACES[face][2];
    apply(); track('briks-type-' + face);
  }));
  rt.addEventListener('input', apply); rw.addEventListener('input', apply);
  apply();
}

/* ------------------------------------------------------------------ click to enlarge (mood board, sketches) */
{
  const box = $('#lightbox'), img = $('#lightbox-img');
  $$('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    img.src = b.dataset.zoom; img.alt = $('img', b)?.alt || '';
    if (box.showModal) box.showModal(); else box.setAttribute('open', '');
    track('briks-zoom');
  }));
  const close = () => { if (box.close) box.close(); else box.removeAttribute('open'); };
  $('#lightbox-x').addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
}

/* ------------------------------------------------------------------ the before and after coin */
{
  const stageEl = $('#coin-stage'), label = $('#coin-label');
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    initCoin3D(stageEl, { reduced, dpr: () => perf.cfg.dprCap, flatOnly: perf.tier === 'low', onFail: () => { $('#coin-flip')?.remove(); $('#coin-label')?.remove(); }, onFace: (f) => { label.textContent = f ? 'After' : 'Before'; } }).then((c) => { if (c) track('briks-coin-ready'); });
  }, { rootMargin: '300px' });
  io.observe(stageEl);
  $('#coin-flip')?.addEventListener('click', () => track('briks-coin-flip'));
}

/* ------------------------------------------------------------------ the Briks logo in 3D (the ending) */
if (perf.tier !== 'low' && !reduced && !params.has('no3d')) {
  const el = $('#logo3d');
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    try { if (initLogo3D(el, { reduced, dpr: () => perf.cfg.dprCap })) setTimeout(() => el.classList.add('is-3d'), 120); } catch (e) { console.warn('3D logo unavailable', e); }
  }, { rootMargin: '300px' });
  io.observe(el);
}

/* ------------------------------------------------------------------ business card: real 3D, built when it is near */
{
  const stageEl = $('#card-stage');
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    initCard3D(stageEl, { reduced, dpr: () => perf.cfg.dprCap, flatOnly: perf.tier === 'low', onFail: () => { $('#card-flip')?.remove(); const p = $('.cs-cardbox__bar p'); if (p) p.textContent = 'Front and back.'; } }).then((c) => { if (c) track('briks-card-ready'); });
  }, { rootMargin: '300px' });
  io.observe(stageEl);
  $('#card-flip')?.addEventListener('click', () => track('briks-card-flip'));
}

/* ------------------------------------------------------------------ 07 live site (loads only when asked) */
let embedsLive = 0;
$$('[data-load]').forEach((btn) => btn.addEventListener('click', () => {
  const box = btn.closest('.cs-browser__view, .cs-phone__view');
  const f = document.createElement('iframe');
  f.src = 'https://briksco.com/';
  f.title = btn.dataset.load === 'mobile' ? 'Briks Contracting website, phone view, live' : 'Briks Contracting website, live';
  f.setAttribute('allow', 'fullscreen');
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  box.querySelector('.cs-poster').replaceWith(f);
  embedsLive++;
  track('briks-live-' + btn.dataset.load);
}));

/* ------------------------------------------------------------------ the process trail (same as the home page) */
const steps = $$('[data-step]');
const trail = $('#trail');
$('ol', trail).innerHTML = steps.map((s) => `<li><a href="#${s.id}"><i></i><span>${s.dataset.step}</span></a></li>`).join('');
const trailItems = $$('li', trail);

/* ------------------------------------------------------------------ smooth scroll */
let lenis = null;
if (fine && wide && !reduced && perf.cfg.lenis) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.stop();
  window.__lenis = lenis;
}
perf.onChange((cfg, tier) => { if (!cfg.lenis && lenis) { lenis.destroy(); lenis = null; } plank?.setQuality(cfg); if (tier === 'low') kill3D(); });
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href^="#"]');
  if (!a || a.getAttribute('href') === '#') return;
  const t = document.getElementById(a.getAttribute('href').slice(1));
  if (!t) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(t, { duration: 1.6 }); else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
});

/* ------------------------------------------------------------------ 3D plank (the real model) */
let plank = null;
const canvas = $('#stage');
function kill3D() { plank = null; body.classList.remove('gl-on'); canvas.classList.remove('is-on'); }
if (perf.tier !== 'low' && !reduced && !params.has('no3d')) {
  createPlank(canvas, { cfg: perf.cfg, reduced, fine }).then((p) => {
    plank = p;
    body.classList.add('gl-on');
    canvas.classList.add('is-on');
    addEventListener('resize', () => plank?.resize());
    if (introDone) plank.release();
  }).catch((err) => { console.warn('3D unavailable', err); kill3D(); });
}

/* ------------------------------------------------------------------ reveals */
const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); revealIO.unobserve(en.target); onReveal(en.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;
function onReveal(el) {
  if (el.classList.contains('cs-q')) {
    $$('.cs-sl__track', el).forEach((t, i) => setTimeout(() => t.style.setProperty('--p', t.dataset.p), 200 + i * 140));
    $$('li[data-pick="1"]', el).forEach((li, i) => setTimeout(() => li.classList.add('is-pick'), 500 + i * 160));
  }
}
let revealStarted = false;
function startReveals() {
  if (revealStarted) return; revealStarted = true;
  $$('.reveal, .cs-prop__bar, .cs-sketchbook').forEach((el) => { if (revealIO) revealIO.observe(el); else el.classList.add('is-visible'); });
}

/* ------------------------------------------------------------------ the loop */
let introDone = false;
const vh = () => innerHeight;
const nav = $('#nav');
let theme = '', litCount = -1, lastCur = -2, lastIntro = null, dirty = true;
let themeBoxes = [], stepBoxes = [], pullBox = { top: 0, h: 1 }, exploreBox = { top: 0, h: 1 };
function measure() {
  dirty = false;
  const sy = lenis ? lenis.scroll : scrollY;
  const box = (el) => { const r = el.getBoundingClientRect(); return { top: r.top + sy, bottom: r.bottom + sy, h: r.height }; };
  themeBoxes = $$('[data-theme]').map((el) => ({ ...box(el), theme: el.dataset.theme }));
  stepBoxes = steps.map(box);
  pullBox = box(pull); exploreBox = box($('#explore'));
}
addEventListener('resize', () => { dirty = true; });
addEventListener('load', () => { dirty = true; });
new ResizeObserver(() => { dirty = true; }).observe(document.body);
gsap.ticker.lagSmoothing(0);
gsap.ticker.add((time, deltaMs) => {
  const dt = Math.min(deltaMs / 1000, 0.05);
  lenis?.raf(time * 1000);
  const y = lenis ? lenis.scroll : scrollY;
  updateScroll(y, dt);
  perf.frame(performance.now());
  nav.classList.toggle('is-scrolled', y > 40);

  // everything below reads cached page positions (no layout reads per frame), so scrolling stays cheap
  if (dirty) measure();
  const mid = vh() * 0.5;

  // light and dark sections: the page theme follows what is in the middle of the screen
  let t = 'cream';
  for (const m of themeBoxes) if (m.top - y <= mid && m.bottom - y > mid) t = m.theme;
  if (t !== theme) { theme = t; body.classList.toggle('theme-ink', t === 'ink'); }

  // the story lights up word by word (only touches the page when the count changes)
  const lit = Math.floor(clamp((vh() * 0.82 - (pullBox.top - y)) / (pullBox.h + vh() * 0.25)) * pullWords.length * 1.08);
  if (lit !== litCount) { pullWords.forEach((w, i) => w.classList.toggle('is-lit', i < lit)); litCount = lit; }

  // pinned exploration
  const ep = clamp((y - exploreBox.top) / Math.max(1, exploreBox.h - vh()));
  setRound(Math.min(ROUNDS.length - 1, Math.floor(ep * ROUNDS.length * 0.999)), ep);

  // process trail
  let cur = -1;
  stepBoxes.forEach((m, i) => { if (m.top - y < vh() * 0.55 && m.bottom - y > vh() * 0.45) cur = i; });
  if (cur !== lastCur || introDone !== lastIntro) {
    lastCur = cur; lastIntro = introDone;
    trail.classList.toggle('is-on', introDone && wide && cur >= 0);
    trailItems.forEach((li, i) => { li.classList.toggle('is-active', i === cur); li.classList.toggle('is-past', cur >= 0 && i < cur); });
  }

  // 3D plank (paused while a live embed is on screen, so two WebGL pages never fight)
  if (plank) {
    let paused = false;
    if (embedsLive) $$('iframe').forEach((f) => { const r = f.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh()) paused = true; });
    if (!paused) plank.render(dt);
  }
});

/* ------------------------------------------------------------------ intro: Simply × Briks */
function finishIntro() {
  introDone = true;
  body.classList.remove('is-loading');
  $('#loader')?.remove();
  lenis?.start();
  plank?.release();
  startReveals();
  initNotice();
}

function runIntro() {
  try { history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }
  window.scrollTo(0, 0);
  const loader = $('#loader');
  if (reduced || params.has('nointro')) { finishIntro(); return; }

  const xs = $$('#loader-x i'), letters = $$('#loader-briks .lg-l'), plankEl = $('#loader-briks .lg-plank');
  const skipBtn = $('#loader-skip'), row = $('.cs-loader', loader);
  gsap.set(xs, { scale: 0 });
  gsap.set(letters, { y: 140, opacity: 0 });
  gsap.set(plankEl, { transformBox: 'fill-box', transformOrigin: '50% 100%', scaleY: 0 });
  gsap.set(skipBtn, { opacity: 0 });
  loader.classList.add('is-live');

  const tl = gsap.timeline({ delay: 0.15, onComplete: finishIntro, defaults: { ease: 'expo.out' } });
  tl.to(skipBtn, { opacity: 1, duration: 0.6 }, 0.8)
    .to(xs, { scale: 1, duration: 0.7, ease: 'back.out(2)', stagger: 0.08 }, 1.2)
    .to(letters, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09 }, 1.4)
    .to(plankEl, { scaleY: 1, duration: 0.9, ease: 'expo.inOut' }, 1.8)
    .addLabel('out', 3.0)
    .to(row, { scale: 1.04, duration: 0.7, ease: 'power2.in' }, 'out')
    .add(() => { body.classList.remove('is-loading'); startReveals(); loader.classList.add('is-done'); }, 'out+=0.3')
    .to({}, { duration: 0.9 }, 'out+=0.3');

  const skip = () => tl.timeScale(4);
  skipBtn.addEventListener('click', skip);
  loader.addEventListener('click', skip);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === ' ') skip(); }, { once: true });
}

Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1400))]).then(runIntro);
