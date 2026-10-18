// A full-screen carousel for the concept work. One slide is mounted at a time, so videos and pages
// only load when someone looks at them.
import { CONCEPTS } from './concepts.js';
import { track } from './analytics.js';

export function initGallery({ getLenis, reduced, getCursor }) {
  const dlg = document.getElementById('gallery');
  const opener = document.getElementById('open-gallery');
  if (!dlg || !opener || !CONCEPTS.length) return;

  const stage = dlg.querySelector('.gallery__stage');
  const title = dlg.querySelector('.gallery__title');
  const note = dlg.querySelector('.gallery__note');
  const count = dlg.querySelector('.gallery__count');
  const dots = dlg.querySelector('.gallery__dots');
  const prev = dlg.querySelector('.gallery__prev');
  const next = dlg.querySelector('.gallery__next');
  const full = dlg.querySelector('.gallery__full');
  let i = 0;

  const countEl = document.getElementById('concept-count');
  if (countEl) countEl.textContent = CONCEPTS.length === 1 ? '1 design' : CONCEPTS.length + ' designs';

  dots.innerHTML = CONCEPTS.map((c, k) => `<button type="button" class="gallery__dot" data-k="${k}" aria-label="${c.title.replace(/"/g, '')}"></button>`).join('');
  const multi = CONCEPTS.length > 1;
  prev.hidden = next.hidden = dots.hidden = !multi;

  function media(c) {
    const el = (tag, attrs) => Object.assign(document.createElement(tag), attrs);
    if (c.type === 'video') {
      const v = el('video', { controls: true, playsInline: true, preload: 'metadata', poster: c.poster || '' });
      v.setAttribute('aria-label', c.title + ' walkthrough');
      v.append(el('source', { src: c.src, type: 'video/mp4' }));
      return v;
    }
    if (c.type === 'page') return el('iframe', { src: c.src, title: c.title + ' concept', loading: 'lazy' });
    return el('img', { src: c.src, alt: c.title + ' concept design', decoding: 'async' });
  }

  function show(n, dir = 0) {
    i = (n + CONCEPTS.length) % CONCEPTS.length;
    const c = CONCEPTS[i];
    stage.querySelectorAll('video').forEach((v) => v.pause());
    stage.textContent = '';
    const m = media(c);
    m.className = 'gallery__media' + (dir && !reduced ? (dir > 0 ? ' from-right' : ' from-left') : '');
    stage.append(m);
    title.textContent = c.title;
    note.textContent = c.note || '';
    count.textContent = (i + 1) + ' / ' + CONCEPTS.length;
    full.hidden = !c.href;
    if (c.href) full.href = c.href;
    dots.querySelectorAll('.gallery__dot').forEach((d, k) => { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  }

  function open(n = 0) {
    show(n);
    getLenis()?.stop();
    dlg.showModal();
    document.documentElement.classList.add('gallery-open');
    const cur = getCursor?.();
    if (cur && cur.raise && HTMLElement.prototype.showPopover) cur.raise();        // the cursor goes above the dialog
    else document.documentElement.classList.add('gallery-native-cursor');
    track('concepts-open');
  }
  function closed() {
    stage.querySelectorAll('video').forEach((v) => v.pause());
    stage.textContent = '';
    document.documentElement.classList.remove('gallery-open', 'gallery-native-cursor');
    getLenis()?.start();
    opener.focus({ preventScroll: true });
  }

  opener.addEventListener('click', () => open(0));
  prev.addEventListener('click', () => show(i - 1, -1));
  next.addEventListener('click', () => show(i + 1, 1));
  dots.addEventListener('click', (e) => { const b = e.target.closest('.gallery__dot'); if (b) show(+b.dataset.k, +b.dataset.k > i ? 1 : -1); });
  dlg.querySelector('.gallery__close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', closed);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });       // click on the dim area
  dlg.addEventListener('keydown', (e) => {
    if (!multi || e.target.closest('video, iframe')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1, 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1, -1); }
  });

  // Swipe on touch screens (not on a video, so its scrubber keeps working)
  let x0 = null;
  stage.addEventListener('touchstart', (e) => { x0 = e.target.closest('video, iframe') ? null : e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (x0 === null || !multi) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  }, { passive: true });
}
