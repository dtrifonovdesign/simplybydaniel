export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = (a, n) => shuffle(a).slice(0, n);

export function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

export function toast(msg) {
  const t = el(`<div class="toast">${esc(msg)}</div>`);
  document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
}

const KEY = 'ibses-unit3-v1';
let mem = {};
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return mem; } }
function save(d) { mem = d; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }
export const store = {
  get(k, def) { const d = load(); return k in d ? d[k] : def; },
  set(k, v) { const d = load(); d[k] = v; save(d); },
};

// card mastery: box 0 = new or missed, 1 = seen once right, 2 = known
export const cardKey = (deck, i) => deck + ':' + i;
export function box(deck, i) { return (store.get('boxes', {}))[cardKey(deck, i)] ?? -1; }
export function setBox(deck, i, b) { const m = store.get('boxes', {}); m[cardKey(deck, i)] = b; store.set('boxes', m); }
export function mastery(deck) {
  const m = store.get('boxes', {}); let known = 0;
  deck.cards.forEach((_, i) => { if ((m[cardKey(deck.id, i)] ?? -1) >= 2) known++; });
  return { known, total: deck.cards.length, pct: Math.round(100 * known / deck.cards.length) };
}
export const hooks = { cleanup: null };
