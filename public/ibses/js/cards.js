import { $, $$, esc, shuffle, store, box, setBox, hooks } from './util.js';
import { DECKS } from './data.js';

export function cardsFor(id) {
  const out = [];
  const add = d => d.cards.forEach((c, i) => out.push({ d: d.id, i, q: c[0], a: c[1], title: d.title }));
  if (id === 'all') DECKS.forEach(add);
  else if (id === 'weak') DECKS.forEach(d => d.cards.forEach((c, i) => { if (box(d.id, i) === 0) out.push({ d: d.id, i, q: c[0], a: c[1], title: d.title }); }));
  else add(DECKS.find(d => d.id === id) || DECKS[0]);
  return out;
}

export function flashcards(app, id) {
  const deck = DECKS.find(d => d.id === id);
  const title = id === 'all' ? 'Everything' : id === 'weak' ? 'Missed cards' : deck?.title;
  let pool = cardsFor(id);
  if (!pool.length) {
    app.innerHTML = `<a class="back" href="#/decks">Back to decks</a><div class="card"><h2>Nothing missed yet</h2><p>Cards you miss collect here. Study a deck first.</p><a class="btn" href="#/decks">Pick a deck</a></div>`;
    return;
  }
  let dir = store.get('dir', 'front');   // front, back, mixed
  let queue, total, known, missed, flipped, cur, onlyNew = false;

  function start(list) {
    queue = shuffle(list); total = queue.length; known = 0; missed = 0; next();
  }
  function next() { cur = queue[0]; flipped = false; render(); }

  function render() {
    if (!cur) return done();
    const rev = dir === 'back' || (dir === 'mixed' && cur.rev === undefined ? (cur.rev = Math.random() < .5) : cur.rev);
    const front = rev ? cur.a : cur.q, back = rev ? cur.q : cur.a;
    const long = back.length > 90;
    app.innerHTML = `
      <div class="fc-wrap">
        <a class="back" href="#/decks">Decks</a>
        <div class="fc-top"><div><div class="eyebrow">${esc(cur.title)}</div></div>
          <div class="seg" id="dir"><button data-d="front" class="${dir === 'front' ? 'on' : ''}">Term first</button><button data-d="back" class="${dir === 'back' ? 'on' : ''}">Answer first</button><button data-d="mixed" class="${dir === 'mixed' ? 'on' : ''}">Mixed</button></div></div>
        <div class="bar" style="margin-bottom:16px"><i style="width:${Math.round(100 * known / total)}%"></i></div>
        <div class="fc ${flipped ? 'flip' : ''}" id="fc" role="button" tabindex="0" aria-label="Flip card">
          <div class="fc-in">
            <div class="fc-face"><div class="txt">${esc(front)}</div><div class="hint">Tap to flip</div></div>
            <div class="fc-face back"><div class="txt" style="${long ? 'font-size:clamp(17px,2.6vw,22px)' : ''}">${esc(back)}</div><div class="hint">${esc(front.length > 60 ? '' : front)}</div></div>
          </div>
        </div>
        <div class="fc-actions" style="${flipped ? '' : 'visibility:hidden'}">
          <button class="btn bad" id="again">Again</button><button class="btn good" id="got">Got it</button>
        </div>
        <div class="row between" style="margin-top:14px"><span class="muted small">${known} known · ${queue.length} left · ${missed} missed</span><span class="muted small">${esc(title)}</span></div>
      </div>`;
    const fc = $('#fc');
    const flip = () => { flipped = !flipped; fc.classList.toggle('flip', flipped); $('.fc-actions').style.visibility = flipped ? 'visible' : 'hidden'; };
    fc.onclick = flip;
    $$('#dir button').forEach(b => b.onclick = () => { dir = b.dataset.d; store.set('dir', dir); queue.forEach(c => delete c.rev); render(); });
    $('#got').onclick = () => answer(true);
    $('#again').onclick = () => answer(false);
  }

  function answer(ok) {
    const b = box(cur.d, cur.i);
    queue.shift();
    if (ok) { setBox(cur.d, cur.i, Math.min(2, (b < 0 ? 1 : b + 1) + (b < 0 ? 1 : 0))); known++; }
    else { setBox(cur.d, cur.i, 0); missed++; delete cur.rev; queue.splice(Math.min(queue.length, 3 + Math.floor(Math.random() * 3)), 0, cur); }
    next();
  }

  const keys = e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); $('#fc')?.click(); }
    else if (e.key === 'ArrowRight' && flipped) $('#got')?.click();
    else if (e.key === 'ArrowLeft' && flipped) $('#again')?.click();
  };
  document.addEventListener('keydown', keys);
  hooks.cleanup = () => document.removeEventListener('keydown', keys);

  function done() {
    app.innerHTML = `<div class="fc-wrap"><div class="card" style="text-align:center;padding:48px 24px"><div class="eyebrow">Round complete</div><div class="score">${total}/${total}</div><p class="lead" style="margin-top:12px">${missed ? `You missed ${missed} time${missed === 1 ? '' : 's'} on the way. Those cards will come back in Missed cards.` : 'Clean run.'}</p>
      <div class="row" style="justify-content:center;margin-top:16px"><button class="btn" id="again2">Go again</button><a class="btn ghost" href="#/quiz/${id}">Quiz this deck</a><a class="btn ghost" href="#/decks">All decks</a></div></div></div>`;
    $('#again2').onclick = () => start(cardsFor(id));
  }
  start(pool);
}
