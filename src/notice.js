// A small, honest notice about what the site stores. Shown once, after the intro, and remembered.
const KEY = 'simply-notice';

export function initNotice() {
  try { if (localStorage.getItem(KEY)) return; } catch (e) { /* storage blocked: show it every visit */ }
  const box = document.createElement('div');
  box.className = 'notice';
  box.setAttribute('role', 'region');
  box.setAttribute('aria-label', 'Privacy notice');
  box.innerHTML = '<p>No ads and no tracking cookies here. This site counts visits without identifying anyone and saves one small display setting on your device. <a href="./privacy/">Privacy policy</a></p><button type="button">Got it</button>';
  const close = () => {
    try { localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ }
    box.classList.remove('is-in');
    setTimeout(() => box.remove(), 600);
  };
  box.querySelector('button').addEventListener('click', close);
  const show = () => { document.body.appendChild(box); requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('is-in'))); };
  if (!document.body.classList.contains('is-loading')) return setTimeout(show, 1200);
  const mo = new MutationObserver(() => {
    if (!document.body.classList.contains('is-loading')) { mo.disconnect(); setTimeout(show, 1800); }
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}
