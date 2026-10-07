// Process path, sticky trail and contact form. Receives the shared pieces from main.js.
import { scroll } from './scroll.js';

export const STEPS = ['Words', 'Research', 'Sketch', 'Digital design', 'Finish', 'System'];

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Where the tall sections sit in the document. Measured when the layout changes, not every frame,
// so the per-frame work is plain arithmetic against the shared scroll value.
const geo = { pinTop: 0, pinH: 1, p6Top: 0, p6H: 1 };

export function initFeatures({ getLenis, reduced, getStage }) {
  const stepEls = [...document.querySelectorAll('.step')];
  const scrollToEl = (el) => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { duration: 1.6 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  };
  const path = initPath(scrollToEl, stepEls, reduced);
  initTrail(scrollToEl, stepEls);
  initForm(getStage);
  const brand = initBrandFly(reduced);
  buildStepLists();
  const measure = () => {
    const y = window.scrollY;
    const pin = document.getElementById('path-pin');
    if (pin) { const r = pin.getBoundingClientRect(); geo.pinTop = r.top + y; geo.pinH = r.height; }
    const p6 = document.querySelector('.step[data-pose="p6"]');
    if (p6) { const r = p6.getBoundingClientRect(); geo.p6Top = r.top + y; geo.p6H = r.height; }
    for (const s of stepLists) { const r = s.step.getBoundingClientRect(); s.top = r.top + y; s.h = r.height; }
  };
  measure();
  return {
    measure,
    travel: () => (path ? path.update() : null),
    sync: (tw) => path && path.sync(tw),
    fly: (now) => { if (brand) brand.update(); stepProgress(now); },
  };
}

// "Then it becomes a brand": the Simply lockup leaves the top-left corner, flies down
// and lands in the middle of the step as the finished brand, then flies back as you move on.
function initBrandFly(reduced) {
  const step = document.querySelector('.step[data-pose="p6"]');
  const navEl = document.getElementById('nav');
  const navLock = navEl && navEl.querySelector('.logo-lockup');
  if (!step || !navLock || reduced) return null;

  const fly = document.createElement('div');
  fly.className = 'brand-fly';
  fly.setAttribute('aria-hidden', 'true');
  fly.innerHTML = '<div class="logo-lockup" style="--logo-size: 28px">' + navLock.innerHTML + '</div>';
  const meta = document.createElement('div');
  meta.className = 'brand-fly__meta';
  meta.setAttribute('aria-hidden', 'true');
  meta.innerHTML = '<p>Brands, made simply.</p>';
  document.body.append(fly, meta);
  const lock = fly.querySelector('.logo-lockup');

  let w0 = 0, h0 = 0;
  const measure = () => { w0 = fly.offsetWidth; h0 = fly.offsetHeight; };
  measure();
  window.addEventListener('resize', measure);
  if (document.fonts) document.fonts.ready.then(measure);

  return {
    update() {
      if (!w0) measure();
      const vh = window.innerHeight, vw = window.innerWidth;
      // u = how far into the step we've scrolled, in screens. The wordmark waits until the file
      // tiles and parting halves have cleared its landing spot, then stays for the whole hold
      // (colors finishing, then a pause on the finished brand) and only leaves as the step lets go.
      const u = (scroll.ys - geo.p6Top) / vh;
      const hold = (geo.p6H - vh) / vh;
      const k = Math.min(easeIO(smooth(0.3, 0.8, u)), 1 - easeIO(smooth(hold, hold + 0.7, u)));
      if (k < 0.003) {
        fly.style.opacity = 0; meta.style.opacity = 0;
        navEl.classList.remove('is-flown');
        return;
      }
      const nb = navLock.getBoundingClientRect();
      const x0 = nb.left + nb.width / 2, y0 = nb.top + nb.height / 2;
      const wide = vw >= 860;
      const tx = wide ? vw * 0.27 : vw * 0.5;
      const ty = wide ? vh * 0.46 : vh * 0.3;
      const size = wide ? Math.min(112, vw * 0.075) : Math.min(62, vw * 0.17);
      const fs = 28 + (size - 28) * k;
      const s = fs / 28;
      const cx = x0 + (tx - x0) * k, cy = y0 + (ty - y0) * k;
      fly.style.opacity = 1;
      lock.style.setProperty('--logo-size', fs.toFixed(2) + 'px');
      fly.style.transform = 'translate(' + (cx - (w0 * s) / 2).toFixed(2) + 'px,' + (cy - (h0 * s) / 2).toFixed(2) + 'px)';
      const a = smooth(0.8, 1, k);
      meta.style.opacity = a;
      meta.style.transform = `translate(${tx}px, ${cy + size * 0.85 + (1 - a) * 10}px) translate(-50%, 0)`;
      navEl.classList.add('is-flown');
    },
  };
}

// The path is driven by scroll. As it passes through the viewport the big 3D mark
// shrinks into the little traveler, which walks stops 1 to 6, then grows back out.
function initPath(scrollToEl, stepEls, reduced) {
  const wrap = document.getElementById('path');
  if (!wrap) return null;
  const svg = wrap.querySelector('svg');
  const base = svg.querySelector('.path__line');
  // On phones the path runs top to bottom, so it can be big enough to read instead of a tiny strip.
  // Desktop windows stay horizontal even when narrow; only touch devices (or truly tiny windows) go vertical.
  const mq = window.matchMedia('(max-width: 859px) and (pointer: coarse), (max-width: 599px)');
  const vertical = mq.matches;
  let flipTimer = 0;
  mq.addEventListener?.('change', () => { clearTimeout(flipTimer); flipTimer = setTimeout(() => location.reload(), 400); });
  if (vertical) {
    svg.setAttribute('viewBox', '0 0 320 380');
    base.setAttribute('d', 'M64 22 C 230 40, 262 96, 168 132 S 56 206, 160 240 S 262 306, 96 358');
    wrap.classList.add('path--vertical');
  }
  const len = base.getTotalLength();
  const NSV = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}, parent = svg) => {
    const n = document.createElementNS(NSV, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };
  const drawn = el('path', { class: 'path__draw', d: base.getAttribute('d') });
  drawn.style.strokeDasharray = len;
  drawn.style.strokeDashoffset = reduced ? 0 : len;

  const fr = STEPS.map((_, i) => i / (STEPS.length - 1));
  const nodes = STEPS.map((label, i) => {
    const pt = base.getPointAtLength(len * fr[i]);
    const g = el('g', { class: 'node', tabindex: 0, role: 'link', 'aria-label': `Go to step ${i + 1}: ${label}` });
    el('circle', { cx: pt.x, cy: pt.y, r: 15 }, g);
    const n = el('text', { class: 'n', x: pt.x, y: pt.y }, g); n.textContent = i + 1;
    const above = i % 2 === 0;
    let l;
    if (vertical) {
      // labels sit beside the node, on whichever side has room
      const right = pt.x < 160;
      l = el('text', { class: 'l', x: pt.x + (right ? 28 : -28), y: pt.y }, g);
      l.style.textAnchor = right ? 'start' : 'end';
      l.style.dominantBaseline = 'central';
    } else {
      l = el('text', { class: 'l', x: pt.x, y: pt.y + (above ? -26 : 38) }, g);
    }
    l.textContent = label;
    const go = () => scrollToEl(stepEls[i]);
    g.addEventListener('click', go);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    return g;
  });

  // The traveler is the Simply mark, small.
  const trav = el('g', { class: 'trav' });
  const flex = el('g', {}, trav);
  const tm = el('g', { transform: 'scale(.34) translate(-50 -50)' }, flex);
  const tTop = el('path', { d: 'M48 10H75A5 5 0 0 1 80 15V41A5 5 0 0 1 75 46H48A18 18 0 0 1 48 10Z' }, tm);
  const tBot = el('path', { d: 'M52 54H25A5 5 0 0 0 20 59V85A5 5 0 0 0 25 90H52A18 18 0 0 0 52 54Z' }, tm);
  trav.style.opacity = 0;

  // The little mark leans into the curve like a train on a track, and its halves stretch with speed.
  let ang = 0, spd = 0, prevF = 0, qs = 0, lastT = performance.now();
  let lastTravel = { px: 0, py: 0, box: 1 };
  function orient(f, dt, w) {
    const a = base.getPointAtLength(len * Math.max(0, f - 0.004));
    const b = base.getPointAtLength(len * Math.min(1, f + 0.004));
    const target = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    ang += (target - ang) * (1 - Math.exp(-dt * 9));
    const sp = clamp(Math.abs(f - prevF) / Math.max(dt, 0.001) / 0.6);
    prevF = f;
    spd += (sp - spd) * (1 - Math.exp(-dt * 7));
    flex.setAttribute('transform', `rotate(${(ang * 0.7 * w).toFixed(2)}) skewX(${(-ang * 0.45 * w).toFixed(2)})`);
    const g = spd * 5 * w;
    tTop.setAttribute('transform', `translate(0 ${(-g).toFixed(2)})`);
    tBot.setAttribute('transform', `translate(0 ${g.toFixed(2)})`);
  }

  const pin = document.getElementById('path-pin');
  const A = 0.16, B = 0.86; // q ranges: [0,A] shrink in, [A,B] walk, [B,1] grow out
  let lit = -2;
  function place(f) {
    const pt = base.getPointAtLength(len * f);
    trav.setAttribute('transform', `translate(${pt.x} ${pt.y - 2})`);
    drawn.style.strokeDashoffset = len * (1 - f);
    const n = fr.reduce((c, v, i) => (f >= v - 0.001 ? i : c), -1);
    if (n !== lit) { lit = n; nodes.forEach((g, i) => g.classList.toggle('is-lit', i <= n)); }
  }
  if (reduced) place(1);

  return {
    update() {
      if (reduced || document.body.classList.contains('is-loading')) return null;
      const vh = window.innerHeight;
      // The page holds still (pinned) while q runs from 0 to 1, so the walk follows your scroll.
      // q comes from the shared smoothed scroll; the pin's on-screen edges come from the real position.
      const prTop = geo.pinTop - scroll.y, prBottom = prTop + geo.pinH;
      const qRaw = clamp((scroll.ys - geo.pinTop) / Math.max(1, geo.pinH - vh));
      // Ease toward the scroll position, with a speed limit: even a huge wheel flick walks the little
      // mark past every stop instead of jumping over them (the whole path takes about 1.7s at the fastest).
      const now = performance.now();
      const dt = Math.min(0.1, Math.max(0.001, (now - lastT) / 1000));
      lastT = now;
      const offscreen = prBottom < vh * 0.15 || prTop > vh * 0.95;
      if (offscreen) qs = qRaw;
      else qs += clamp((qRaw - qs) * (1 - Math.exp(-dt * 11)), -dt * 0.6, dt * 0.6);
      if (Math.abs(qRaw - qs) < 0.0004) qs = qRaw;
      const q = qs;
      const f = q <= A ? 0 : q >= B ? 1 : (q - A) / (B - A);
      place(q <= 0 ? 0 : f);
      const sixNode = nodes[nodes.length - 1];
      // After the pin lets go, keep the halves flanking the (scrolling) heading until it has moved off.
      const rel = clamp((prBottom < vh ? (vh - prBottom) : 0) / (vh * 0.7));
      if (q <= 0) { sixNode.classList.remove('is-covered'); return null; }
      if (q >= 1) {
        sixNode.classList.remove('is-covered');
        const exit = 1 - rel;
        return exit > 0.001 ? { tw: 0, ...lastTravel, alpha3d: 1, exit } : null;
      }
      const tw = q < A ? easeIO(q / A) : q > B ? easeIO(1 - (q - B) / (1 - B)) : 1;
      // Hide the 6 while the little mark sits on top of it.
      sixNode.classList.toggle('is-covered', f >= 0.97 && tw > 0.25);
      orient(f, dt, smooth(0.88, 1, tw));
      const sr = svg.getBoundingClientRect(); // the stage is sticky, so this one has to be read live
      const vb = svg.viewBox.baseVal;
      const sc = Math.min(sr.width / vb.width, sr.height / vb.height); // the svg fits its box, centred
      const ox = sr.left + (sr.width - vb.width * sc) / 2, oy = sr.top + (sr.height - vb.height * sc) / 2;
      const pt = base.getPointAtLength(len * f);
      lastTravel = { px: ox + pt.x * sc, py: oy + (pt.y - 2) * sc, box: 34 * sc };
      return {
        tw,
        ...lastTravel,
        alpha3d: 1 - smooth(0.7, 1, tw),
        exit: q > B ? 1 - tw : 0,
      };
    },
    // The little mark's opacity follows the same (smoothed) value the 3D mark uses,
    // so exactly one of them is visible at any moment, however fast you scroll.
    sync(tw) {
      trav.style.opacity = String(smooth(0.7, 1, tw));
    },
  };
}

function initTrail(scrollToEl, stepEls) {
  const nav = document.getElementById('trail');
  const list = nav && nav.querySelector('ol');
  const section = document.getElementById('process');
  const pin = document.getElementById('path-pin');
  if (!list || !section) return;
  const items = STEPS.map((label, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#process" aria-label="Step ${i + 1}: ${label}"><i></i><span>${label}</span></a>`;
    li.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); scrollToEl(stepEls[i]); });
    list.appendChild(li);
    return li;
  });
  let cur = -1;
  const update = () => {
    const mid = window.innerHeight / 2;
    const sr = section.getBoundingClientRect();
    // The trail only appears once the path has finished and the page has moved on.
    const afterPath = pin ? pin.getBoundingClientRect().bottom < window.innerHeight * 0.85 : true;
    const inside = sr.top < mid && sr.bottom > mid && afterPath;
    nav.classList.toggle('is-on', inside);
    if (!inside) return;
    let best = 0, bd = Infinity;
    stepEls.forEach((st, i) => {
      const r = st.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bd) { bd = d; best = i; }
    });
    if (best !== cur) {
      cur = best;
      items.forEach((li, i) => {
        li.classList.toggle('is-active', i === best);
        li.classList.toggle('is-past', i < best);
      });
    }
  };
  // smooth scrolling moves the real window scroll, so this one listener covers both modes
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initForm(getStage) {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = form.querySelector('.form__status');
  const email = form.elements.email, msg = form.elements.message;
  form.addEventListener('focusin', () => getStage()?.setForm(1));
  form.addEventListener('focusout', () => { if (!form.contains(document.activeElement)) getStage()?.setForm(0); });
  const mark = (input, bad) => input.closest('.field').classList.toggle('is-error', bad);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.elements.company.value) return; // honeypot
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    const okMsg = msg.value.trim().length > 2;
    mark(email, !okEmail); mark(msg, !okMsg);
    if (!okEmail || !okMsg) {
      status.textContent = !okEmail ? 'Please check your email address.' : 'Add a few words about what you are making.';
      (okEmail ? msg : email).focus();
      return;
    }
    status.textContent = 'Sending...';
    const endpoint = form.dataset.endpoint;
    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email: email.value.trim(),
            message: msg.value.trim(),
            _subject: 'New project enquiry from simplybydaniel.com',
            _replyto: email.value.trim(),
            _template: 'table',
            _captcha: 'false',
          }),
        });
        if (!res.ok) throw new Error('bad response');
      } else if (!form.dataset.email) {
        throw new Error('no endpoint');
      } else {
        const body = `${msg.value.trim()}\n\nReply to: ${email.value.trim()}`;
        location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent('New project')}&body=${encodeURIComponent(body)}`;
      }
      form.classList.add('is-sent');
      status.textContent = endpoint ? 'Thank you. I will reply soon.' : 'Opening your email app. Thank you.';
      const st = getStage();
      st?.setForm(0);
      st?.celebrate();
    } catch (err) {
      status.textContent = 'Something went wrong. Please try again in a moment.';
    }
  });
}

// Light up each step's items one by one as you scroll through its hold.
const stepLists = [];
function buildStepLists() {
  document.querySelectorAll('.step').forEach((step) => {
    const items = [...step.querySelectorAll('.chips span, .swatches i, .brand-card')];
    // data-lit-at: fraction of the hold by which everything is lit, leaving a pause at the end
    if (items.length) stepLists.push({ step, items, shown: -1, next: 0, top: 0, h: 1, at: parseFloat(step.dataset.litAt) || 1 });
  });
}
function stepProgress(now = performance.now()) {
  const vh = window.innerHeight;
  for (const s of stepLists) {
    const span = s.h - vh;
    const sp = span < 50 ? 1 : clamp((scroll.ys - s.top) / (span * s.at));
    const want = Math.round(sp * s.items.length);
    if (want === s.shown) continue;
    // Walk toward the target one item at a time, so a fast scroll still shows every item arriving
    // (and a slow machine can't skip straight past them).
    if (s.shown >= 0 && now < s.next) continue;
    s.shown = s.shown < 0 ? want : s.shown + (want > s.shown ? 1 : -1);
    s.next = now + 80;
    s.items.forEach((el, i) => el.classList.toggle('is-lit', i < s.shown));
  }
}
