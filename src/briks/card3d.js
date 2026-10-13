import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { briksSVG } from './logo.js';

// The Briks business card as a real 3D object: drag to turn it, click to flip it. Both faces are drawn
// onto canvases from the brand board (forest front with the logo, parchment back with the details).
// If WebGL is unavailable the two flat canvases are shown instead.
const W = 2100, H = 1200;               // 1.75 : 1, like a 3.5 x 2 inch card
const FOREST = '#082219', PARCH = '#EFE7D6', GOLD = '#CFA65A', INK = '#0A0A0A';
const FW = 3.5, FH = 2, R = 0.09, D = 0.034;

const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const svgURL = (svg, w, h) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg width="${w}" height="${h}" `));

async function drawFaces() {
  try { await Promise.all(['64px Forum', '40px "Tenor Sans"', '40px "Josefin Sans"'].map((f) => document.fonts.load(f))); } catch (e) { /* fall back to system fonts */ }
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

  // front: forest with the full logo
  const front = mk(), f = front.getContext('2d');
  f.fillStyle = FOREST; f.fillRect(0, 0, W, H);
  const g = f.createRadialGradient(W * 0.5, H * 0.45, 40, W * 0.5, H * 0.5, W * 0.7);
  g.addColorStop(0, 'rgba(30,80,60,.55)'); g.addColorStop(1, 'rgba(8,34,25,0)');
  f.fillStyle = g; f.fillRect(0, 0, W, H);
  f.strokeStyle = 'rgba(207,166,90,.34)'; f.lineWidth = 4; f.strokeRect(46, 46, W - 92, H - 92);
  const lw = W * 0.62, lh = lw * (1447.3 / 4001.98);
  const logo = await loadImg(svgURL(briksSVG(), 2400, 868));
  f.drawImage(logo, (W - lw) / 2, (H - lh) / 2, lw, lh);

  // back: parchment with the details
  const back = mk(), b = back.getContext('2d');
  b.fillStyle = PARCH; b.fillRect(0, 0, W, H);
  const s = W / 520;                                    // the board's card was 520 px wide
  const px = 36 * s, py = 32 * s;
  b.fillStyle = FOREST; b.strokeStyle = FOREST;
  b.textBaseline = 'alphabetic';
  b.font = `${34 * s}px Forum, "Times New Roman", serif`;
  b.letterSpacing = `${0.04 * 34 * s}px`;
  b.lineWidth = 0.022 * 34 * s;
  b.fillText('Pavel D.', px, py + 34 * s * 0.85);
  b.strokeText('Pavel D.', px, py + 34 * s * 0.85);
  b.font = `700 ${11 * s}px "Tenor Sans", sans-serif`;
  b.letterSpacing = `${0.3 * 11 * s}px`;
  b.fillText('FOUNDER', px, py + 34 * s + 18 * s);
  // plank mark, top right
  const pw = 14 * s, ph = 48 * s, pxr = W - px - pw, pg = b.createLinearGradient(0, py, 0, py + ph);
  pg.addColorStop(0, '#C9993F'); pg.addColorStop(1, '#8A5F1F');
  b.fillStyle = pg; b.beginPath();
  b.moveTo(pxr, py + ph * 0.16); b.lineTo(pxr + pw, py); b.lineTo(pxr + pw, py + ph); b.lineTo(pxr, py + ph); b.closePath(); b.fill();
  // rule + contact
  b.fillStyle = '#8A5F1F'; b.fillRect(px, H - py - 70 * s, W - px * 2, 3);
  b.fillStyle = INK; b.letterSpacing = '0px';
  b.font = `400 ${13 * s}px "Josefin Sans", sans-serif`;
  b.fillText('(612) 205-0970', px, H - py - 38 * s);
  b.fillText('briksco.com', px, H - py - 14 * s);
  return { front, back };
}

function roundedRect(w, h, r) {
  const x = -w / 2, y = -h / 2, s = new THREE.Shape();
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

export async function initCard3D(stage, { reduced = false, onFail, dpr = 2, flatOnly = false } = {}) {
  const faces = await drawFaces();
  const flat = () => { // no WebGL: show both faces flat
    stage.classList.add('is-flat');
    [faces.front, faces.back].forEach((c, i) => { c.className = 'card-flat'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', i ? 'Back of the Briks business card: Pavel D., Founder, phone and website.' : 'Front of the Briks business card: the Briks Contracting logo on dark green.'); stage.appendChild(c); });
    onFail && onFail();
  };

  if (flatOnly) { flat(); return null; }
  let renderer;
  try {
    const canvas = document.createElement('canvas');
    canvas.className = 'card-gl';
    canvas.setAttribute('aria-label', 'A 3D Briks business card. Drag to turn it, click to flip it.');
    canvas.setAttribute('role', 'img');
    canvas.tabIndex = 0;
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    stage.appendChild(canvas);
  } catch (e) { flat(); return null; }

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);

  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; };
  const outline = roundedRect(FW, FH, R);
  const bodyGeo = new THREE.ExtrudeGeometry(outline, { depth: D, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 10 });
  bodyGeo.translate(0, 0, -D / 2);
  const edge = new THREE.MeshStandardMaterial({ color: 0xcfa65a, metalness: 1, roughness: 0.32 });
  const body = new THREE.Mesh(bodyGeo, edge);

  const faceGeo = new THREE.ShapeGeometry(outline, 10);
  const uv = faceGeo.attributes.uv, pos = faceGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + FW / 2) / FW, (pos.getY(i) + FH / 2) / FH);
  const mat = (c, rough) => new THREE.MeshPhysicalMaterial({ map: tex(c), roughness: rough, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.35 });
  const front = new THREE.Mesh(faceGeo, mat(faces.front, 0.55));
  front.position.z = D / 2 + 0.0045;
  const back = new THREE.Mesh(faceGeo, mat(faces.back, 0.7));
  back.rotation.y = Math.PI; back.position.z = -D / 2 - 0.0045;
  const card = new THREE.Group(); card.add(body, front, back);
  const holder = new THREE.Group(); holder.add(card); scene.add(holder);

  const key = new THREE.DirectionalLight(0xfff0d8, 1.1); key.position.set(-3, 4, 5); scene.add(key);
  const ptr = new THREE.PointLight(0xffe2a8, 2.2, 12, 1.6); ptr.position.set(0, 0, 3); scene.add(ptr);

  const st = { ry: -0.35, rx: 0.08, vy: 0, vx: 0, drag: false, moved: 0, lastX: 0, lastY: 0, idle: 0, px: 0, py: 0, t: 0, visible: false };
  const fit = () => {
    const w = stage.clientWidth || 300, h = stage.clientHeight || 220;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, typeof dpr === "function" ? dpr() : dpr)); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const vFov = (camera.fov * Math.PI) / 180;
    const dist = Math.max((FH * 1.25) / (2 * Math.tan(vFov / 2)), (FW * 1.12) / (2 * Math.tan(vFov / 2) * camera.aspect));
    camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
  };
  fit();
  new ResizeObserver(fit).observe(stage);

  const canvas = renderer.domElement;
  const flip = () => { st.idle = 0; st.vy = 0; st.target = (st.target ?? Math.round(st.ry / Math.PI) * Math.PI) + Math.PI; };
  canvas.addEventListener('pointerdown', (e) => { st.drag = true; st.moved = 0; st.lastX = e.clientX; st.lastY = e.clientY; canvas.setPointerCapture(e.pointerId); st.target = null; });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    st.px = ((e.clientX - r.left) / r.width - 0.5) * 2; st.py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!st.drag) return;
    const dx = e.clientX - st.lastX, dy = e.clientY - st.lastY;
    st.lastX = e.clientX; st.lastY = e.clientY; st.moved += Math.abs(dx) + Math.abs(dy);
    st.ry += dx * 0.011; st.rx = Math.max(-0.5, Math.min(0.5, st.rx + dy * 0.006)); st.vy = dx * 0.011; st.idle = 0;
  });
  const up = () => { if (!st.drag) return; st.drag = false; if (st.moved < 6) flip(); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
    if (e.key === 'ArrowLeft') { st.ry -= 0.3; st.idle = 0; } if (e.key === 'ArrowRight') { st.ry += 0.3; st.idle = 0; }
  });
  stage.parentElement.querySelector('[data-flip]')?.addEventListener('click', flip);
  canvas.style.touchAction = 'pan-y';

  new IntersectionObserver(([en]) => { st.visible = en.isIntersecting; }, { rootMargin: '80px' }).observe(stage);

  let last = performance.now();
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!st.visible || document.hidden) return;
    st.t += dt;
    if (!st.drag) {
      st.idle += dt;
      if (st.target !== null && st.target !== undefined) {
        st.ry = damp(st.ry, st.target, 5, dt);
        st.rx = damp(st.rx, 0.06, 3, dt);
        if (Math.abs(st.ry - st.target) < 0.002) { st.ry = st.target; st.target = null; }
      } else {
        if (Math.abs(st.vy) > 0.001) { st.ry += st.vy; st.vy *= Math.exp(-dt * 3.2); }
        // settle on the nearest face once nothing has happened for a moment
        if (st.idle > 0.5) { st.ry = damp(st.ry, Math.round(st.ry / Math.PI) * Math.PI, 2.4, dt); st.rx = damp(st.rx, 0.06, 2.4, dt); }
      }
    }
    const sway = reduced ? 0 : Math.sin(st.t * 0.7) * 0.07;
    card.rotation.set(st.rx + st.py * 0.1, st.ry + sway + st.px * 0.18, 0);
    holder.position.y = reduced ? 0 : Math.sin(st.t * 0.9) * 0.04;
    ptr.position.set(st.px * 3, -st.py * 2, 2.6);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  return { flip };
}
