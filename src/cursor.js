// A custom cursor made of the Simply mark. The two halves drift apart with speed,
// lean into the direction of travel, open wide over links, and squeeze together on press.

const TOP = 'M48 10H75A5 5 0 0 1 80 15V41A5 5 0 0 1 75 46H48A18 18 0 0 1 48 10Z';
const BOT = 'M52 54H25A5 5 0 0 0 20 59V85A5 5 0 0 0 25 90H52A18 18 0 0 0 52 54Z';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function initCursor({ fine, reduced }) {
  if (!fine) return null;
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<svg viewBox="0 0 100 100"><g class="c-top"><path class="mark-top" d="' + TOP + '"/></g>' +
    '<g class="c-bot"><path class="mark-bottom" d="' + BOT + '"/></g></svg>';
  document.body.appendChild(el);
  document.documentElement.classList.add('has-cursor');
  const gTop = el.querySelector('.c-top'), gBot = el.querySelector('.c-bot');

  let tx = -100, ty = -100, x = -100, y = -100, vx = 0, vy = 0;
  let hover = 0, hoverT = 0, down = 0, downT = 0, vis = 0, visT = 0, ang = 0, open = 0;
  const INTERACTIVE = 'a, button, [role="link"], .node, [data-tilt], summary, label';

  window.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY; visT = 1;
    const t = e.target;
    const text = t && t.closest && t.closest('input, textarea');
    el.classList.toggle('is-text', !!text);
    hoverT = !text && t && t.closest && t.closest(INTERACTIVE) ? 1 : 0;
  }, { passive: true });
  window.addEventListener('pointerdown', () => { downT = 1; });
  window.addEventListener('pointerup', () => { downT = 0; });
  document.documentElement.addEventListener('mouseleave', () => { visT = 0; });
  document.documentElement.addEventListener('mouseenter', () => { visT = 1; });

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 18);
    const px = x, py = y;
    x += (tx - x) * k; y += (ty - y) * k;
    vx += ((x - px) / Math.max(dt, 0.001) - vx) * Math.min(1, dt * 10);
    vy += ((y - py) / Math.max(dt, 0.001) - vy) * Math.min(1, dt * 10);
    const speed = Math.hypot(vx, vy);
    hover += (hoverT - hover) * Math.min(1, dt * 12);
    down += (downT - down) * Math.min(1, dt * 20);
    vis += (visT - vis) * Math.min(1, dt * 12);
    // lean toward the direction of travel, never more than a little
    ang += (clamp(vx * 0.035, -22, 22) - ang) * Math.min(1, dt * 10);
    // the halves part with speed and over links, and squeeze on press
    open += (clamp(speed * 0.012, 0, 11) + hover * 9 - down * 4 - open) * Math.min(1, dt * 12);
    const scale = 1 + hover * 0.55 - down * 0.2;
    el.style.opacity = String(vis);
    el.style.transform =
      'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) translate(-50%,-50%) rotate(' + ang.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
    gTop.style.transform = 'translate(' + (open * 0.7).toFixed(2) + 'px,' + (-open).toFixed(2) + 'px)';
    gBot.style.transform = 'translate(' + (-open * 0.7).toFixed(2) + 'px,' + open.toFixed(2) + 'px)';
  }
  requestAnimationFrame(frame);
  return el;
}
