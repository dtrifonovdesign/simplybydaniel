import { $, $$, el, esc, store, mastery, hooks } from './util.js';
import { DECKS, GROUPS, SORTS } from './data.js';
import { flashcards } from './cards.js';
import { matchGame, quizGame, sortGame, actsDrill } from './games.js';
import { labelGame, LABEL_SETS } from './label.js';
import { notesView } from './notes.js';

const app = $('#app');

const deckById = id => DECKS.find(d => d.id === id);

const PLAN = [
  ['0 to 5', 'Skeleton Lab', 'Tap every bone in 3D, then switch on quiz mode.', [['Open the lab', '#/lab/skeleton'], ['Sort axial or appendicular', '#/sort/skel']]],
  ['5 to 10', 'Bones and functions', 'Flashcards for bones and skeleton functions. Say each answer aloud before you flip.', [['Bones cards', '#/cards/bones'], ['Function cards', '#/cards/function'], ['Sort functions', '#/sort/skelfn']]],
  ['10 to 15', 'Position terms and markings', 'Superior to lateral, then fossa to trochlea.', [['Position terms', '#/cards/terms'], ['Bone markings', '#/cards/markings'], ['Match markings', '#/match/markings']]],
  ['15 to 22', 'Connective tissue and joint classes', 'Ligament, tendon, cartilage, fascia, then fibrous, cartilaginous, synovial.', [['Tissue cards', '#/cards/tissue'], ['Sort tissues', '#/sort/tissues'], ['Joint cards', '#/cards/joints'], ['Sort joints', '#/sort/jointclass']]],
  ['22 to 30', 'Synovial features and long bone', 'Label the knee and a long bone from memory.', [['Synovial cards', '#/cards/synfeat'], ['Label the knee', '#/label/knee-side'], ['Long bone cards', '#/cards/longbone'], ['Label long bone', '#/label/longbone']]],
  ['30 to 38', 'Six synovial joint types', 'Watch each joint move, then sort the examples.', [['Joint types lab', '#/lab/joints'], ['Type cards', '#/cards/syntypes'], ['Sort types', '#/sort/syntype']]],
  ['38 to 48', 'Planes and axes', 'Rotate the figure, then drill all 12 activities.', [['Planes lab', '#/lab/planes'], ['Plane cards', '#/cards/planes'], ['12 activities drill', '#/acts'], ['Sort planes', '#/sort/planesort']]],
  ['48 to 55', 'Movements and muscle roles', 'Watch every movement term happen, then name it.', [['Movement lab', '#/lab/movements'], ['Movement cards', '#/cards/movements'], ['Muscle cards', '#/cards/muscles'], ['Sort roles', '#/sort/musclesort']]],
  ['55 to 60', 'Final check', 'A mixed quiz across everything, then your missed cards.', [['Mixed quiz', '#/quiz/all'], ['Missed cards', '#/cards/weak']]],
];

function home() {
  const done = store.get('plan', {});
  const all = DECKS.reduce((a, d) => { const m = mastery(d); a.k += m.known; a.t += m.total; return a; }, { k: 0, t: 0 });
  const pct = Math.round(100 * all.k / all.t);
  app.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">IBSES Unit 3 · Movement</div>
      <h1>One hour to know it all.</h1>
      <p class="lead" style="max-width:60ch">Skeleton, connective tissue, joints, planes, axes and movements. Work down the plan, or jump to any game.</p>
    </div>
    <div class="card" style="margin-bottom:24px">
      <div class="row between"><b style="color:var(--ink)">Cards known</b><span class="muted small">${all.k} of ${all.t}</span></div>
      <div class="bar" style="margin-top:10px"><i style="width:${pct}%"></i></div>
    </div>
    <ul class="plan">${PLAN.map((p, i) => `
      <li class="${done[i] ? 'done' : ''}">
        <div class="time">${p[0]}<div class="muted small" style="font-weight:400;font-family:var(--body)">min</div></div>
        <div class="what"><b>${p[1]}</b><div class="small" style="margin:2px 0 8px">${p[2]}</div>
          <div class="row" style="gap:6px">${p[3].map(l => `<a class="btn ghost sm" href="${l[1]}">${l[0]}</a>`).join('')}</div></div>
        <input class="chk" type="checkbox" data-i="${i}" ${done[i] ? 'checked' : ''} aria-label="Mark ${esc(p[1])} done">
      </li>`).join('')}
    </ul>
    <p class="muted small" style="margin-top:24px">Progress is saved on this device. Add to the Home Screen from Safari's share menu to open it like an app.</p>`;
  $$('.chk', app).forEach(c => c.onchange = () => { const d = store.get('plan', {}); d[c.dataset.i] = c.checked; store.set('plan', d); c.closest('li').classList.toggle('done', c.checked); });
}

function decksView() {
  const tile = d => { const m = mastery(d); return `
    <div class="card tile">
      <div><div class="eyebrow">Lesson ${d.lesson}</div><h3>${esc(d.title)}</h3><p class="small" style="margin:6px 0 0">${esc(d.blurb)}</p></div>
      <div><div class="bar"><i style="width:${m.pct}%"></i></div><div class="muted small" style="margin-top:4px">${m.known} of ${m.total} known</div></div>
      <div class="acts"><a class="btn sm" href="#/cards/${d.id}">Flashcards</a><a class="btn ghost sm" href="#/match/${d.id}">Match</a><a class="btn ghost sm" href="#/quiz/${d.id}">Quiz</a></div>
    </div>`; };
  app.innerHTML = `
    <div class="page-head"><div class="eyebrow">Flashcards</div><h1>Decks</h1></div>
    <div class="row" style="margin-bottom:8px"><a class="btn accent" href="#/cards/all">Study everything</a><a class="btn ghost" href="#/cards/weak">Missed cards only</a></div>
    ${GROUPS.map(g => `<section class="block"><h2>${g.title}</h2><div class="grid cols-2">${g.ids.map(id => tile(deckById(id))).join('')}</div></section>`).join('')}`;
}

function gamesView() {
  app.innerHTML = `
    <div class="page-head"><div class="eyebrow">Games</div><h1>Practice</h1></div>
    <div class="row" style="margin-bottom:8px"><a class="btn accent" href="#/quiz/all">Mixed quiz</a><a class="btn ghost" href="#/acts">12 activities drill</a></div>
    <section class="block"><h2>Sort it</h2><p>Tap an item, then tap the group it belongs to.</p>
      <div class="grid cols-3">${SORTS.map(s => `<a class="card tile" href="#/sort/${s.id}"><h4>${esc(s.title)}</h4><span class="muted small">${s.items.length} items</span></a>`).join('')}</div></section>
    <section class="block"><h2>Label the diagram</h2><p>Tap a pin, then tap the right word.</p>
      <div class="grid cols-3">${LABEL_SETS.map(s => `<a class="card tile" href="#/label/${s.id}"><h4>${esc(s.title)}</h4><span class="muted small">${s.pins.length} labels</span></a>`).join('')}</div></section>
    <section class="block"><h2>Match</h2><div class="grid cols-3">${DECKS.map(d => `<a class="card tile" href="#/match/${d.id}"><h4>${esc(d.title)}</h4></a>`).join('')}</div></section>`;
}

function labsView() {
  app.innerHTML = `
    <div class="page-head"><div class="eyebrow">3D labs</div><h1>Explore it in 3D</h1><p class="lead">Drag to turn, pinch to zoom. Everything is labelled.</p></div>
    <div class="grid cols-2">
      <a class="card tile" href="#/lab/skeleton"><h3>Skeleton</h3><p class="small">Every bone, coloured axial or appendicular. Tap to name, hide groups, take the find-the-bone quiz.</p><span class="btn sm" style="align-self:flex-start">Open</span></a>
      <a class="card tile" href="#/lab/planes"><h3>Planes and axes</h3><p class="small">Three planes and three axes through a figure. Choose a skill and see its plane and axis light up.</p><span class="btn sm" style="align-self:flex-start">Open</span></a>
      <a class="card tile" href="#/lab/movements"><h3>Joint movements</h3><p class="small">Flexion to circumduction, pronation to dorsiflexion. Watch each one, then test yourself.</p><span class="btn sm" style="align-self:flex-start">Open</span></a>
      <a class="card tile" href="#/lab/joints"><h3>Synovial joint types</h3><p class="small">Gliding, hinge, pivot, condyloid, saddle and ball and socket, moving in 3D.</p><span class="btn sm" style="align-self:flex-start">Open</span></a>
    </div>`;
}

const routes = {
  '': home, decks: decksView, games: gamesView, labs: labsView,
  notes: () => notesView(app),
  cards: id => flashcards(app, id),
  match: id => matchGame(app, id),
  quiz: id => quizGame(app, id),
  sort: id => sortGame(app, id),
  label: id => labelGame(app, id),
  acts: () => actsDrill(app),
  lab: async id => {
    app.innerHTML = '<p class="muted">Loading 3D…</p>';
    const mod = await import('./labs.js');
    if (location.hash.split('/')[2] !== id) return;
    app.innerHTML = '';
    mod.openLab(app, id);
  },
};
const tabFor = r => ({ '': 'home', decks: 'decks', cards: 'decks', games: 'games', match: 'games', quiz: 'games', sort: 'games', label: 'games', acts: 'games', labs: 'labs', lab: 'labs', notes: 'notes' }[r] || 'home');

function route() {
  if (hooks.cleanup) { try { hooks.cleanup(); } catch {} hooks.cleanup = null; }
  const [, r = '', id] = location.hash.split('/');
  $$('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.k === tabFor(r)));
  window.scrollTo(0, 0);
  (routes[r] || home)(id);
}
addEventListener('hashchange', route);
route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
