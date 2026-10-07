// A custom cursor: a small dot that sticks to the pointer, with a ring that trails behind it.
// The ring swells over links, stretches a little with speed, and squeezes in on press.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function initCursor({ fine, reduced }) {
  if (!fine) return null;
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.setAttribute('aria-hidden', 'true');
  dot.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);
  document.documentElement.classList.add('has-cursor');

  let tx = -100, ty = -100, dx = -100, dy = -100, rx = -100, ry = -100, vx = 0, vy = 0;
  let hover = 0, hoverT = 0, down = 0, downT = 0, vis = 0, visT = 0, text = 0, textT = 0;
  const INTERACTIVE = 'a, button, [role="link"], .node, [data-tilt], summary, label';

  window.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY; visT = 1;
    const t = e.target;
    textT = t && t.closest && t.closest('input, textarea') ? 1 : 0;
    hoverT = !textT && t && t.closest && t.closest(INTERACTIVE) ? 1 : 0;
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
    // the dot is nearly instant, the ring follows with a soft lag
    const kd = reduced ? 1 : 1 - Math.exp(-dt * 38);
    const kr = reduced ? 1 : 1 - Math.exp(-dt * 13);
    const px = rx, py = ry;
    dx += (tx - dx) * kd; dy += (ty - dy) * kd;
    rx += (tx - rx) * kr; ry += (ty - ry) * kr;
    vx += ((rx - px) / Math.max(dt, 0.001) - vx) * Math.min(1, dt * 10);
    vy += ((ry - py) / Math.max(dt, 0.001) - vy) * Math.min(1, dt * 10);
    hover += (hoverT - hover) * Math.min(1, dt * 12);
    down += (downT - down) * Math.min(1, dt * 20);
    vis += (visT - vis) * Math.min(1, dt * 12);
    text += (textT - text) * Math.min(1, dt * 14);

    // the ring stretches along the direction of travel, never by much
    const speed = Math.hypot(vx, vy);
    const stretch = clamp(speed * 0.00035, 0, 0.22);
    const ang = Math.atan2(vy, vx) * 180 / Math.PI;
    const base = 1 + hover * 0.7 - down * 0.28;
    ring.style.opacity = String(vis * (1 - text));
    ring.style.transform =
      'translate(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px) translate(-50%,-50%) rotate(' + ang.toFixed(1) + 'deg) scale(' +
      (base * (1 + stretch)).toFixed(3) + ',' + (base * (1 - stretch * 0.6)).toFixed(3) + ')';
    ring.style.setProperty('--fill', (hover * 0.14).toFixed(3));
    dot.style.opacity = String(vis * (1 - text));
    dot.style.transform =
      'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px) translate(-50%,-50%) scale(' + (1 - hover * 0.35 + down * 0.4).toFixed(3) + ')';
  }
  requestAnimationFrame(frame);
  return ring;
}
