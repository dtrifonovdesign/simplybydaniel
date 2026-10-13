import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { briksSVG } from './logo.js';

// The "before and after" coin. One face is the AI-generated logo Briks started with, the other is the logo Simply made.
// Drag to turn it, click (or the button) to flip it. If WebGL is unavailable, both faces are shown flat.
const S = 1024;
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const svgURL = (svg, w, h) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg width="${w}" height="${h}" `));

async function drawFaces() {
  const mk = () => { const c = document.createElement('canvas'); c.width = S; c.height = S; return c; };
  const circle = (ctx) => { ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); ctx.closePath(); };

  const before = mk(), b = before.getContext('2d');
  const ai = await loadImg('/case-studies/briks/brief/ai-logo.webp');
  circle(b); b.clip(); b.drawImage(ai, 0, 0, S, S);

  const after = mk(), a = after.getContext('2d');
  circle(a); a.save(); a.clip();
  a.fillStyle = '#082219'; a.fillRect(0, 0, S, S);
  const g = a.createRadialGradient(S * 0.5, S * 0.42, 20, S * 0.5, S * 0.5, S * 0.62);
  g.addColorStop(0, 'rgba(30,80,60,.6)'); g.addColorStop(1, 'rgba(8,34,25,0)');
  a.fillStyle = g; a.fillRect(0, 0, S, S);
  const lw = S * 0.74, lh = lw * (836 / 4001.98);
  const logo = await loadImg(svgURL(briksSVG({ contracting: false }), 2000, 418));
  a.drawImage(logo, (S - lw) / 2, (S - lh) / 2, lw, lh);
  a.restore();
  a.strokeStyle = 'rgba(207,166,90,.5)'; a.lineWidth = 6; a.beginPath(); a.arc(S / 2, S / 2, S / 2 - 40, 0, Math.PI * 2); a.stroke();
  return { before, after };
}

export async function initCoin3D(stage, { reduced = false, onFail, onFace, dpr = 2, flatOnly = false } = {}) {
  const faces = await drawFaces();
  const flat = () => {
    stage.classList.add('is-flat');
    [faces.before, faces.after].forEach((c, i) => { c.className = 'coin-flat'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', i ? 'The logo Simply made for Briks.' : 'The AI-generated logo Briks started with.'); const fig = document.createElement('figure'); fig.className = 'coin-fig'; const cap = document.createElement('figcaption'); cap.textContent = i ? 'After' : 'Before'; fig.append(c, cap); stage.appendChild(fig); });
    onFail && onFail();
  };

  if (flatOnly) { flat(); return null; }
  let renderer;
  try {
    const canvas = document.createElement('canvas');
    canvas.className = 'coin-gl';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'A 3D coin. One face is the AI-generated logo Briks started with, the other is the logo Simply made. Drag to turn it, click to flip it.');
    canvas.tabIndex = 0;
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    stage.appendChild(canvas);
  } catch (e) { flat(); return null; }

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);

  const R = 1, D = 0.14;
  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; };
  const gold = new THREE.MeshStandardMaterial({ color: 0xcfa65a, metalness: 1, roughness: 0.3 });
  const side = new THREE.Mesh(new THREE.CylinderGeometry(R, R, D, 96, 1, true), gold);
  side.rotation.x = Math.PI / 2;
  const rimGeo = new THREE.TorusGeometry(R, 0.045, 20, 120);
  const rimF = new THREE.Mesh(rimGeo, gold); rimF.position.z = D / 2;
  const rimB = new THREE.Mesh(rimGeo, gold); rimB.position.z = -D / 2;
  const faceGeo = new THREE.CircleGeometry(R, 96);
  const mat = (c) => new THREE.MeshPhysicalMaterial({ map: tex(c), roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3, transparent: true });
  const front = new THREE.Mesh(faceGeo, mat(faces.before)); front.position.z = D / 2 + 0.001;
  const back = new THREE.Mesh(faceGeo, mat(faces.after)); back.rotation.y = Math.PI; back.position.z = -D / 2 - 0.001;
  const coin = new THREE.Group(); coin.add(side, rimF, rimB, front, back);
  const holder = new THREE.Group(); holder.add(coin); scene.add(holder);

  const key = new THREE.DirectionalLight(0xfff0d8, 1.1); key.position.set(-3, 4, 5); scene.add(key);
  const ptr = new THREE.PointLight(0xffe2a8, 2.4, 12, 1.6); ptr.position.set(0, 0, 3); scene.add(ptr);

  const st = { ry: -0.3, rx: 0.06, vy: 0, drag: false, moved: 0, lastX: 0, lastY: 0, idle: 0, px: 0, py: 0, t: 0, visible: false, target: null, face: 0 };
  const fit = () => {
    const w = stage.clientWidth || 300, h = stage.clientHeight || 300;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, typeof dpr === "function" ? dpr() : dpr)); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const vFov = (camera.fov * Math.PI) / 180;
    const dist = Math.max((R * 2.5) / (2 * Math.tan(vFov / 2)), (R * 2.5) / (2 * Math.tan(vFov / 2) * camera.aspect));
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
    st.ry += dx * 0.012; st.rx = Math.max(-0.5, Math.min(0.5, st.rx + dy * 0.006)); st.vy = dx * 0.012; st.idle = 0;
  });
  const up = () => { if (!st.drag) return; st.drag = false; if (st.moved < 6) flip(); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
    if (e.key === 'ArrowLeft') { st.ry -= 0.3; st.idle = 0; } if (e.key === 'ArrowRight') { st.ry += 0.3; st.idle = 0; }
  });
  document.querySelector('[data-flip="coin"], #coin-flip')?.addEventListener('click', flip);
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
      if (st.target !== null) {
        st.ry = damp(st.ry, st.target, 4.5, dt);
        st.rx = damp(st.rx, 0.06, 3, dt);
        if (Math.abs(st.ry - st.target) < 0.002) { st.ry = st.target; st.target = null; }
      } else {
        if (Math.abs(st.vy) > 0.001) { st.ry += st.vy; st.vy *= Math.exp(-dt * 3.2); }
        if (st.idle > 0.5) { st.ry = damp(st.ry, Math.round(st.ry / Math.PI) * Math.PI, 2.4, dt); st.rx = damp(st.rx, 0.06, 2.4, dt); }
      }
    }
    const face = Math.cos(st.ry) >= 0 ? 0 : 1;
    if (face !== st.face) { st.face = face; onFace && onFace(face); }
    const sway = reduced ? 0 : Math.sin(st.t * 0.7) * 0.07;
    // a coin turns end over end when flipped: tilt a little as it goes
    const flipping = st.target !== null ? Math.abs(Math.sin(st.ry)) * 0.18 : 0;
    coin.rotation.set(st.rx + st.py * 0.1 + flipping, st.ry + sway + st.px * 0.18, 0);
    holder.position.y = reduced ? 0 : Math.sin(st.t * 0.9) * 0.05;
    ptr.position.set(st.px * 3, -st.py * 2, 2.6);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  return { flip };
}
