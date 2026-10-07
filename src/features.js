// Process path, sticky trail and contact form. Receives the shared pieces from main.js.
export const STEPS = ['Words', 'Research', 'Sketch', 'Digital design', 'Finish', 'System'];

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function initFeatures({ lenis, reduced, getStage }) {
  const stepEls = [...document.querySelectorAll('.step')];
  const scrollToEl = (el) => {
    if (lenis) lenis.scrollTo(el, { duration: 1.6 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  };
  const path = initPath(scrollToEl, stepEls, reduced);
  initTrail(scrollToEl, stepEls, lenis);
  initForm(getStage);
  const brand = initBrandFly(reduced);
  return { travel: () => (path ? path.update() : null), sync: (tw) => path && path.sync(tw), fly: () => { if (brand) brand.update(); stepProgress(); } };
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
  meta.innerHTML = '<p>Brands made simple.</p>';
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
      const r = step.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - vh / 2) / vh;
      const k = easeIO(1 - smooth(0.25, 1.1, d));
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
    const l = el('text', { class: 'l', x: pt.x, y: pt.y + (above ? -26 : 38) }, g); l.textContent = label;
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
      const sr = svg.getBoundingClientRect();
      // The page holds still (pinned) while q runs from 0 to 1, so the walk follows your scroll.
      const pr = pin.getBoundingClientRect();
      const qRaw = clamp(-pr.top / Math.max(1, pr.height - vh));
      // ease toward the scroll position so wheel steps never make the walk jump
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
      lastT = now;
      const offscreen = pr.bottom < vh * 0.15 || pr.top > vh * 0.95;
      if (offscreen) qs = qRaw;
      else qs += (qRaw - qs) * (1 - Math.exp(-dt * 11));
      if (Math.abs(qRaw - qs) < 0.0004) qs = qRaw;
      const q = qs;
      const f = q <= A ? 0 : q >= B ? 1 : (q - A) / (B - A);
      place(q <= 0 ? 0 : f);
      const sixNode = nodes[nodes.length - 1];
      // After the pin lets go, keep the halves flanking the (scrolling) heading until it has moved off.
      const rel = clamp((pr.bottom < vh ? (vh - pr.bottom) : 0) / (vh * 0.7));
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
      const sc = sr.width / 900;
      const pt = base.getPointAtLength(len * f);
      lastTravel = { px: sr.left + pt.x * sc, py: sr.top + (pt.y - 2) * sc, box: 34 * sc };
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

function initTrail(scrollToEl, stepEls, lenis) {
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
  window.addEventListener('scroll', update, { passive: true });
  if (lenis) lenis.on('scroll', update);
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
          body: JSON.stringify({ email: email.value.trim(), message: msg.value.trim() }),
        });
        if (!res.ok) throw new Error('bad response');
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
      status.textContent = `Something went wrong. Please email ${form.dataset.email} instead.`;
    }
  });
}

// Light up each step's items one by one as you scroll through its hold.
const stepLists = [];
function stepProgress() {
  if (!stepLists.length) {
    document.querySelectorAll('.step').forEach((step) => {
      const items = [...step.querySelectorAll('.chips span, .swatches i, .brand-card')];
      if (items.length) stepLists.push({ step, items, lit: -1 });
    });
  }
  const vh = window.innerHeight;
  for (const s of stepLists) {
    const r = s.step.getBoundingClientRect();
    const span = r.height - vh;
    const sp = span < 50 ? 1 : clamp(-r.top / span);
    const n = Math.round(sp * s.items.length);
    if (n !== s.lit) {
      s.lit = n;
      s.items.forEach((el, i) => el.classList.toggle('is-lit', i < n));
    }
  }
}
