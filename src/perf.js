// Adaptive quality. Every visitor gets the same design; weaker machines get a lighter way of
// drawing it (fewer pixels, simpler geometry, no SVG filters or blend modes, native scrolling).
//
//   1. Before anything is drawn, guess a starting tier from the device.
//   2. While the page runs, watch the real frame rate and step down if it can't keep up.
//   3. Never step back up in the same visit, so quality can't flicker back and forth.
//
// Debug:  ?tier=low|medium|high  forces a tier (and turns the monitor off)    ?perf  shows a live readout

export const TIERS = ['low', 'medium', 'high'];

// maxPixels: the most pixels the 3D canvas may draw. dprCap: the highest pixel ratio. detail: geometry smoothness.
export const CONFIG = {
  high: { maxPixels: 5.5e6, dprCap: 2, detail: 1, filters: true, blend: true, blur: true, lenis: true },
  medium: { maxPixels: 2.8e6, dprCap: 1.5, detail: 0.6, filters: true, blend: true, blur: true, lenis: true },
  low: { maxPixels: 1.4e6, dprCap: 1, detail: 0.4, filters: false, blend: false, blur: false, lenis: false },
};

const STORE_KEY = 'simply-tier';
const STORE_DAYS = 14;
const lower = (a, b) => (TIERS.indexOf(a) <= TIERS.indexOf(b) ? a : b);

// Watches frame times. Pure logic (no DOM) so it can be tested on its own.
export class FrameMonitor {
  // A measuring window ends after `windowFrames` frames, or after `windowMs` if frames are slow.
  constructor({ windowFrames = 45, windowMs = 1500, slowMs = 25, awfulMs = 50, strikes = 2, warmupMs = 1200 } = {}) {
    Object.assign(this, { windowFrames, windowMs, slowMs, awfulMs, strikes, warmupMs });
    this.prev = 0; this.warmUntil = null; this.warmFrames = 12; this.win = []; this.winStart = 0; this.bad = 0; this.ms = 0;
  }
  // Ignore a short stretch (after a tier change, a tab switch, a resize): time-based, so slow frames can't stretch it out.
  rest(ms = this.warmupMs) { this.restMs = ms; this.warmUntil = null; this.warmFrames = 12; this.win.length = 0; this.bad = 0; }
  // Feed one rAF timestamp. Returns true when it is time to step down a tier.
  frame(now) {
    const d = now - this.prev;
    this.prev = now;
    if (!(d > 0) || d > 400) { this.rest(); return false; } // first frame, stall, or tab switch
    if (this.warmUntil === null) this.warmUntil = now + (this.restMs ?? this.warmupMs);
    if (now < this.warmUntil || this.warmFrames > 0) { this.warmFrames--; return false; }
    if (!this.win.length) this.winStart = now;
    this.win.push(d);
    const enough = this.win.length >= this.windowFrames || (now - this.winStart >= this.windowMs && this.win.length >= 10);
    if (!enough) return false;
    // average of the best 80% of frames, so a single hitch (shader compile, GC) doesn't count
    const s = this.win.slice().sort((a, b) => a - b);
    const keep = s.slice(0, Math.ceil(s.length * 0.8));
    this.ms = keep.reduce((a, b) => a + b, 0) / keep.length;
    this.win.length = 0;
    if (this.ms > this.awfulMs) { this.bad = 0; return true; }
    this.bad = this.ms > this.slowMs ? this.bad + 1 : 0;
    if (this.bad >= this.strikes) { this.bad = 0; return true; }
    return false;
  }
}

function probeGpu() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl', { failIfMajorPerformanceCaveat: false }) || c.getContext('experimental-webgl');
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '') : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch (e) { return ''; }
}

// A first guess from the hardware. Cheap, and wrong sometimes, which is why the monitor exists.
export function guessTier({ wide, gpu = '', cores = 8, memory = 8, saveData = false }) {
  let t = 'high';
  if (!wide) t = lower(t, 'medium');                       // phones: start moderate
  if (saveData) t = lower(t, 'low');
  if (cores <= 2 || memory <= 2) t = lower(t, 'low');
  else if (cores <= 4 || memory <= 4) t = lower(t, 'medium');
  if (/swiftshader|llvmpipe|software|basic render|mesa offscreen/i.test(gpu)) t = 'low';
  // older Intel graphics (HD / UHD 6xx) start moderate; newer Iris Xe / Arc start high and the monitor protects them
  else if (/intel/i.test(gpu) && /\bHD Graphics\b|UHD Graphics\s*(?:\d{3}\b|P?6\d\d)/i.test(gpu)) t = lower(t, 'medium');
  else if (/mali|adreno|powervr|videocore/i.test(gpu)) t = lower(t, 'medium');
  return t;
}

function readStored() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (raw && TIERS.includes(raw.tier) && Date.now() - raw.at < STORE_DAYS * 864e5) return raw.tier;
  } catch (e) { /* storage blocked: fine */ }
  return null;
}
function writeStored(tier) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ tier, at: Date.now() })); } catch (e) { /* ignore */ }
}

export function initPerf({ wide, reduced }) {
  const params = new URLSearchParams(location.search);
  const forced = params.get('tier');
  const locked = TIERS.includes(forced);
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const gpu = locked ? '' : probeGpu();

  let tier = locked ? forced : guessTier({ wide, gpu, cores, memory: mem, saveData });
  if (!locked) { const stored = readStored(); if (stored) tier = lower(tier, stored); }

  const listeners = [];
  const monitor = new FrameMonitor();
  const root = document.documentElement;
  const perf = {
    tier, cfg: CONFIG[tier], locked, gpu, fps: 0, ms: 0,
    onChange(fn) { listeners.push(fn); },
    // call once per animation frame with the rAF timestamp
    frame(now) {
      if (locked || reduced) return;
      if (monitor.frame(now)) perf.stepDown('slow');
      if (monitor.ms) { perf.ms = monitor.ms; perf.fps = 1000 / monitor.ms; }
    },
    stepDown(why) {
      const i = TIERS.indexOf(perf.tier);
      if (i <= 0) return false;
      perf.set(TIERS[i - 1]);
      writeStored(perf.tier);
      monitor.rest(1500);
      if (why && console && console.info) console.info('[simply] quality ->', perf.tier, '(' + why + ')');
      return true;
    },
    set(next) {
      perf.tier = next; perf.cfg = CONFIG[next];
      apply();
      listeners.forEach((fn) => fn(perf.cfg, next));
    },
  };

  function apply() {
    const c = perf.cfg;
    TIERS.forEach((t) => root.classList.toggle('tier-' + t, t === perf.tier));
    root.classList.toggle('fx-off', !c.filters);
    root.classList.toggle('blend-off', !c.blend);
    root.classList.toggle('blur-off', !c.blur);
  }
  apply();

  if (params.has('perf')) {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;padding:6px 9px;border-radius:8px;background:rgba(0,0,0,.72);color:#fff;font:11px/1.4 ui-monospace,Consolas,monospace;pointer-events:none;white-space:pre';
    document.body.appendChild(box);
    setInterval(() => {
      const extra = perf.stats ? perf.stats() : '';
      box.textContent = perf.tier + (locked ? ' (forced)' : '') + '  ' + perf.fps.toFixed(0) + ' fps  ' + perf.ms.toFixed(1) + ' ms' + (extra ? '\n' + extra : '') + (gpu ? '\n' + gpu.slice(0, 48) : '');
    }, 400);
  }
  window.__perf = perf;
  return perf;
}
