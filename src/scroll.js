// One shared scroll value. Everything that reacts to where you are on the page (the 3D pose, the path
// walk, the lit chips, the flying wordmark) reads `ys`, so they always agree with each other, however
// the wheel delivers its steps and however slowly frames arrive.
//
//   y    where the page really is right now (what is drawn on screen)
//   ys   y, followed smoothly over time (never frame by frame, so it behaves the same at 20fps and 144fps)
//   vel  smoothed scroll speed in px per second
export const scroll = { y: 0, ys: 0, vel: 0, vh: 0 };

let primed = false;
let lastY = 0;

export function updateScroll(y, dt) {
  scroll.vh = window.innerHeight;
  if (!primed) { scroll.y = scroll.ys = lastY = y; primed = true; return; }
  const d = Math.max(dt, 0.001);
  scroll.vel += ((y - lastY) / d - scroll.vel) * Math.min(1, d * 8);
  lastY = y;
  scroll.y = y;
  scroll.ys += (y - scroll.ys) * (1 - Math.exp(-d * 16));
  if (Math.abs(y - scroll.ys) < 0.25) scroll.ys = y;
}
