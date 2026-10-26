import { $, $$, esc, shuffle, pick, store, box, setBox, hooks } from './util.js';
import { DECKS, SORTS, ACTS, EXTRA_Q } from './data.js';
import { cardsFor } from './cards.js';

const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ---------- Match ---------- */
export function matchGame(app, id) {
  const all = cardsFor(id).filter(c => c.a.length <= 70 && c.q.length <= 70 && !c.q.includes('___'));
  const title = id === 'all' ? 'Everything' : DECKS.find(d => d.id === id)?.title;
  if (all.length < 4) { app.innerHTML = `<a class="back" href="#/games">Games</a><div class="card"><h2>Not enough short cards</h2><p>Try the flashcards for this deck.</p></div>`; return; }
  let pairs, sel, left, t0, timer, mistakes;
  const best = () => store.get('best', {})['match:' + id];

  function round() {
    pairs = pick(all, Math.min(6, all.length)); left = pairs.length; sel = null; mistakes = 0; t0 = Date.now();
    const tiles = shuffle(pairs.flatMap((p, k) => [{ k, t: p.q, s: 'q' }, { k, t: p.a, s: 'a' }]));
    app.innerHTML = `
      <a class="back" href="#/games">Games</a>
      <div class="row between" style="margin-bottom:16px"><div><div class="eyebrow">Match</div><h2>${esc(title)}</h2></div><div class="score" id="time" style="font-size:36px">0:00</div></div>
      <div class="mg" id="mg">${tiles.map((x, n) => `<button class="mt" data-k="${x.k}" data-n="${n}">${esc(x.t)}</button>`).join('')}</div>
      <p class="muted small" style="margin-top:16px">Tap a term, then its match. ${best() ? 'Best: ' + fmt(best()) : ''}</p>`;
    clearInterval(timer); timer = setInterval(() => { const e = $('#time'); if (e) e.textContent = fmt((Date.now() - t0) / 1000); }, 500);
    hooks.cleanup = () => clearInterval(timer);
    $$('.mt').forEach(b => b.onclick = () => tap(b));
  }
  function tap(b) {
    if (b === sel) { b.classList.remove('sel'); sel = null; return; }
    if (!sel) { sel = b; b.classList.add('sel'); return; }
    if (sel.dataset.k === b.dataset.k) {
      [sel, b].forEach(x => { x.classList.remove('sel'); x.classList.add('ok'); });
      sel = null; if (--left === 0) finish();
    } else {
      mistakes++; const a = sel; sel = null; a.classList.remove('sel');
      [a, b].forEach(x => x.classList.add('no')); setTimeout(() => [a, b].forEach(x => x.classList.remove('no')), 400);
    }
  }
  function finish() {
    clearInterval(timer);
    const s = (Date.now() - t0) / 1000, bm = store.get('best', {}), isBest = !bm['match:' + id] || s < bm['match:' + id];
    if (isBest) { bm['match:' + id] = s; store.set('best', bm); }
    setTimeout(() => {
      app.innerHTML = `<div class="q-wrap"><div class="card" style="text-align:center;padding:48px 24px"><div class="eyebrow">Matched</div><div class="score">${fmt(s)}</div>
        <p class="lead" style="margin-top:12px">${mistakes} wrong tap${mistakes === 1 ? '' : 's'}${isBest ? '. New best.' : '.'}</p>
        <div class="row" style="justify-content:center;margin-top:16px"><button class="btn" id="nx">Next round</button><a class="btn ghost" href="#/games">Games</a></div></div></div>`;
      $('#nx').onclick = round;
    }, 500);
  }
  round();
}

/* ---------- Quiz ---------- */
function buildQuestions(id, n) {
  const cards = cardsFor(id);
  const usable = cards.filter(c => c.a.length <= 95 && c.q.length <= 110);
  const bySuffix = {};
  usable.forEach(c => { const m = c.q.match(/:\s*(.+)$/); const k = c.q.includes(':') ? c.q.split(':').pop().trim() : null; if (k) (bySuffix[k] ||= []).push(c); });
  const out = [];
  shuffle(usable).forEach(c => {
    // distractors: same suffix group, else same deck, else anything
    const k = c.q.includes(':') ? c.q.split(':').pop().trim() : null;
    let pool = (k && bySuffix[k] || []).filter(x => x !== c && x.a !== c.a);
    if (pool.length < 3) pool = pool.concat(usable.filter(x => x.d === c.d && x !== c && x.a !== c.a && !pool.includes(x)));
    if (pool.length < 3) pool = pool.concat(usable.filter(x => x !== c && x.a !== c.a && !pool.includes(x)));
    const seen = new Set([c.a]); const ds = [];
    shuffle(pool).forEach(x => { if (ds.length < 3 && !seen.has(x.a)) { seen.add(x.a); ds.push(x.a); } });
    if (ds.length < 3) return;
    const reverse = !c.q.includes(':') && !c.q.includes('___') && c.q.length < 32 && Math.random() < .35;
    if (reverse) {
      const qs = [...new Set(shuffle(usable.filter(x => x.d === c.d && x.q !== c.q && x.q.length < 32 && !x.q.includes('___'))).map(x => x.q))].slice(0, 3);
      if (qs.length === 3) { out.push({ q: `Which term fits: "${c.a}"?`, opts: shuffle([c.q, ...qs]), a: c.q, why: `${c.q}: ${c.a}`, ref: c }); return; }
    }
    out.push({ q: c.q, opts: shuffle([c.a, ...ds]), a: c.a, why: '', ref: c });
  });
  const extras = [];
  if (id === 'all') EXTRA_Q.forEach(e => extras.push({ q: e[0], opts: shuffle(e[1]), a: e[1][e[2]], why: e[3] }));
  if (id === 'all' || id === 'planes') shuffle(ACTS).slice(0, id === 'all' ? 4 : 8).forEach(a => {
    const which = Math.random() < .5;
    const opts = which ? ['Sagittal', 'Frontal', 'Transverse'] : ['Frontal', 'Sagittal', 'Vertical'];
    const ans = which ? a[1] : a[2];
    extras.push({ q: `${a[0]}: which ${which ? 'plane' : 'axis'}?`, opts: which ? opts : opts, a: ans, why: `${a[0]}: ${a[1].toLowerCase()} plane, ${a[2].toLowerCase()} axis.`, fixed: true });
  });
  return shuffle(out.concat(id === 'planes' || id === 'all' ? extras : extras)).slice(0, n);
}

export function quizGame(app, id) {
  const title = id === 'all' ? 'Mixed quiz' : DECKS.find(d => d.id === id)?.title;
  const N = id === 'all' ? 20 : 10;
  const qs = buildQuestions(id, N);
  let i = 0, score = 0, wrong = [];
  function show() {
    if (i >= qs.length) return end();
    const q = qs[i];
    app.innerHTML = `<div class="q-wrap">
      <a class="back" href="#/${id === 'all' ? 'games' : 'decks'}">${id === 'all' ? 'Games' : 'Decks'}</a>
      <div class="row between"><div class="eyebrow">${esc(title)}</div><span class="muted small">${i + 1} of ${qs.length}</span></div>
      <div class="bar" style="margin-bottom:16px"><i style="width:${100 * i / qs.length}%"></i></div>
      <div class="q-card"><h2>${esc(q.q)}</h2></div>
      <div class="opts">${q.opts.map((o, n) => `<button class="opt" data-n="${n}">${esc(o)}</button>`).join('')}</div>
      <div id="fb"></div></div>`;
    $$('.opt').forEach(b => b.onclick = () => pickOpt(b, q));
  }
  function pickOpt(b, q) {
    const ok = q.opts[+b.dataset.n] === q.a;
    $$('.opt').forEach(x => { x.disabled = true; if (q.opts[+x.dataset.n] === q.a) x.classList.add('ok'); });
    if (!ok) b.classList.add('no');
    if (ok) score++; else wrong.push(q);
    if (q.ref) setBox(q.ref.d, q.ref.i, ok ? Math.max(1, box(q.ref.d, q.ref.i)) : 0);
    $('#fb').innerHTML = `${q.why ? `<div class="why">${esc(q.why)}</div>` : ''}<button class="btn" id="nx">${i + 1 === qs.length ? 'See score' : 'Next'}</button>`;
    $('#nx').onclick = () => { i++; show(); };
    $('#nx').focus();
  }
  function end() {
    app.innerHTML = `<div class="q-wrap"><div class="card" style="text-align:center;padding:48px 24px"><div class="eyebrow">Quiz complete</div><div class="score">${score}/${qs.length}</div>
      <p class="lead" style="margin-top:12px">${score === qs.length ? 'Perfect.' : score / qs.length >= .8 ? 'Strong. Review the ones you missed.' : 'Run the flashcards again, then retry.'}</p>
      ${wrong.length ? `<div style="text-align:left;margin-top:16px">${wrong.map(w => `<div class="why"><b style="color:var(--ink)">${esc(w.q)}</b><br>${esc(w.a)}</div>`).join('')}</div>` : ''}
      <div class="row" style="justify-content:center;margin-top:16px"><button class="btn" id="re">Again</button><a class="btn ghost" href="#/cards/${id}">Flashcards</a></div></div></div>`;
    $('#re').onclick = () => quizGame(app, id);
  }
  show();
}

/* ---------- Sort ---------- */
export function sortGame(app, id) {
  const S = SORTS.find(s => s.id === id) || SORTS[0];
  let items = shuffle(S.items.map((x, n) => ({ t: x[0], b: x[1], n }))), sel = null, errors = 0;
  const placed = S.buckets.map(() => []);
  function draw() {
    app.innerHTML = `<a class="back" href="#/games">Games</a>
      <div class="page-head"><div class="eyebrow">Sort it</div><h2>${esc(S.title)}</h2><p class="muted small">Tap an item, then tap its group. ${items.length} left · ${errors} mistake${errors === 1 ? '' : 's'}</p></div>
      <div class="sort-items" id="pool">${items.map(x => `<button class="chip ${sel === x.n ? 'sel' : ''}" data-n="${x.n}">${esc(x.t)}</button>`).join('') || '<span class="muted">All sorted.</span>'}</div>
      <div class="buckets">${S.buckets.map((b, k) => `<button class="bucket ${sel !== null ? 'hot' : ''}" data-k="${k}"><h4>${esc(b)}</h4><div class="placed">${placed[k].map(t => `<span>${esc(t)}</span>`).join('')}</div></button>`).join('')}</div>
      ${items.length ? '' : `<div class="card" style="margin-top:16px;text-align:center"><div class="eyebrow">Done</div><div class="score">${errors}</div><p>mistake${errors === 1 ? '' : 's'}</p><button class="btn" id="re">Again</button></div>`}`;
    $$('#pool .chip').forEach(c => c.onclick = () => { sel = sel === +c.dataset.n ? null : +c.dataset.n; draw(); });
    $$('.bucket').forEach(bk => bk.onclick = () => {
      if (sel === null) return;
      const it = items.find(x => x.n === sel), k = +bk.dataset.k;
      if (it.b === k) { placed[k].push(it.t); items = items.filter(x => x !== it); sel = null; draw(); }
      else { errors++; bk.classList.add('flash-bad'); setTimeout(() => { sel = null; draw(); }, 350); }
    });
    $('#re')?.addEventListener('click', () => sortGame(app, id));
  }
  draw();
}

/* ---------- 12 activities drill ---------- */
export function actsDrill(app) {
  let order = shuffle(ACTS), i = 0, right = 0, plane = null, axis = null;
  function draw() {
    if (i >= order.length) {
      app.innerHTML = `<div class="q-wrap"><div class="card" style="text-align:center;padding:48px 24px"><div class="eyebrow">Drill complete</div><div class="score">${right}/${order.length}</div><p class="lead" style="margin-top:12px">Correct plane and axis together.</p><div class="row" style="justify-content:center"><button class="btn" id="re">Again</button><a class="btn ghost" href="#/lab/planes">Planes lab</a></div></div></div>`;
      $('#re').onclick = () => actsDrill(app); return;
    }
    const a = order[i]; plane = axis = null;
    app.innerHTML = `<div class="q-wrap"><a class="back" href="#/games">Games</a>
      <div class="row between"><div class="eyebrow">Plane and axis</div><span class="muted small">${i + 1} of ${order.length}</span></div>
      <div class="bar" style="margin-bottom:16px"><i style="width:${100 * i / order.length}%"></i></div>
      <div class="q-card"><h2>${esc(a[0])}</h2></div>
      <h4 style="margin:12px 0 8px">Plane</h4><div class="seg" id="pl">${['Sagittal', 'Frontal', 'Transverse'].map(p => `<button>${p}</button>`).join('')}</div>
      <h4 style="margin:16px 0 8px">Axis of rotation</h4><div class="seg" id="ax">${['Frontal', 'Sagittal', 'Vertical'].map(p => `<button>${p}</button>`).join('')}</div>
      <div style="margin-top:20px" id="fb"><button class="btn" id="chk" disabled>Check</button></div></div>`;
    const wire = (sel, set) => $$(sel + ' button').forEach(b => b.onclick = () => { $$(sel + ' button').forEach(x => x.classList.remove('on')); b.classList.add('on'); set(b.textContent); $('#chk').disabled = !(plane && axis); });
    wire('#pl', v => plane = v); wire('#ax', v => axis = v);
    $('#chk').onclick = () => {
      const ok = plane === a[1] && axis === a[2]; if (ok) right++;
      $$('#pl button, #ax button').forEach(b => b.disabled = true);
      $('#fb').innerHTML = `<div class="why" style="${ok ? 'background:var(--good-bg);color:var(--good)' : 'background:var(--bad-bg);color:var(--bad)'}">${ok ? 'Correct.' : 'Not quite.'} ${esc(a[0])}: ${a[1].toLowerCase()} plane, ${a[2].toLowerCase()} axis.${a[0].startsWith('Shot') ? ' (The body rotates in the transverse plane; the arm push also has a sagittal part.)' : ''}</div><button class="btn" id="nx">${i + 1 === order.length ? 'Finish' : 'Next'}</button>`;
      $('#nx').onclick = () => { i++; draw(); };
    };
  }
  draw();
}
