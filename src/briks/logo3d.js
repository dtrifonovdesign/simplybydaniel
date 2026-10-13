import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { LOGO } from './logo-data.js';

// The Briks logo as a real 3D object: letters in parchment, the plank and CONTRACTING in gold.
// Built by extruding the logo's own outlines. Move the pointer over it to turn it, or drag.
const [vbX, vbY, vbW, vbH] = LOGO.viewBox;

function shapesFromPath(d) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;
  const data = new SVGLoader().parse(svg);
  return data.paths.flatMap((p) => SVGLoader.createShapes(p));
}

export function initLogo3D(stage, { reduced = false, onReady, dpr = 2 } = {}) {
  let renderer;
  try {
    const canvas = document.createElement('canvas');
    canvas.className = 'logo3d-gl';
    canvas.setAttribute('aria-hidden', 'true');
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    stage.appendChild(canvas);
  } catch (e) { return null; }

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.7;
  const camera = new THREE.PerspectiveCamera(16, 1, 0.1, 100);

  const DEPTH = 130, BEV = 9;
  const ext = (shapes, mat, thin = false) => {
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: thin ? 40 : DEPTH, bevelEnabled: true, bevelThickness: thin ? 2 : BEV, bevelSize: thin ? 2 : BEV, bevelSegments: 3, curveSegments: 10 });
    return new THREE.Mesh(geo, mat);
  };
  const parch = new THREE.MeshStandardMaterial({ color: 0xefe7d6, metalness: 0.25, roughness: 0.38 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xf0cd7e, metalness: 0.8, roughness: 0.3, emissive: 0x4a3410, emissiveIntensity: 0.6 });

  const logo = new THREE.Group();
  LOGO.letters.forEach((d) => logo.add(ext(shapesFromPath(d), parch)));
  const pl = LOGO.plank.split(' ').map((p) => p.split(',').map(Number));
  const plankShape = new THREE.Shape(pl.map(([x, y]) => new THREE.Vector2(x, y)));
  logo.add(ext(plankShape, gold));
  logo.add(ext(shapesFromPath(LOGO.contracting), gold, true));
  // svg is y-down: flip, centre and scale to about 4 units wide
  const s = 4 / vbW;
  logo.scale.set(s, -s, s);
  logo.position.set(-(vbX + vbW / 2) * s, (vbY + vbH / 2) * s, -DEPTH * s / 2);
  const turn = new THREE.Group(); turn.add(logo);
  const holder = new THREE.Group(); holder.add(turn); scene.add(holder);

  const key = new THREE.DirectionalLight(0xfff0d8, 1.4); key.position.set(-3, 4, 5); scene.add(key);
  const ptr = new THREE.PointLight(0xffe2a8, 4, 14, 1.4); ptr.position.set(0, 0, 3); scene.add(ptr);

  const H = 4 * (vbH / vbW);
  const fit = () => {
    const w = stage.clientWidth || 600, h = stage.clientHeight || 300;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, typeof dpr === "function" ? dpr() : dpr)); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const vFov = (camera.fov * Math.PI) / 180;
    const dist = Math.max((H * 1.5) / (2 * Math.tan(vFov / 2)), (4 * 1.18) / (2 * Math.tan(vFov / 2) * camera.aspect));
    camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
  };
  fit();
  new ResizeObserver(fit).observe(stage);

  const st = { ry: -0.5, rx: 0.1, tx: 0, ty: 0, drag: false, lastX: 0, lastY: 0, px: 0, py: 0, t: 0, visible: false, hover: false, dragY: 0, dragX: 0, release: 0 };
  const canvas = renderer.domElement;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    st.px = ((e.clientX - r.left) / r.width - 0.5) * 2; st.py = ((e.clientY - r.top) / r.height - 0.5) * 2; st.hover = true;
    if (!st.drag) return;
    st.dragY += (e.clientX - st.lastX) * 0.012; st.dragX += (e.clientY - st.lastY) * 0.008;
    st.lastX = e.clientX; st.lastY = e.clientY;
  });
  canvas.addEventListener('pointerleave', () => { st.hover = false; });
  canvas.addEventListener('pointerdown', (e) => { st.drag = true; st.lastX = e.clientX; st.lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  const up = () => { st.drag = false; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  new IntersectionObserver(([en]) => { st.visible = en.isIntersecting; }, { rootMargin: '80px' }).observe(stage);

  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  let last = performance.now(), first = true;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!st.visible || document.hidden) return;
    st.t += dt;
    if (!st.drag) { st.dragY = damp(st.dragY, 0, 1.6, dt); st.dragX = damp(st.dragX, 0, 1.6, dt); }
    const sway = reduced ? 0 : Math.sin(st.t * 0.6) * 0.14;
    const ty = -0.16 + sway + (st.hover ? st.px * 0.5 : 0) + st.dragY;
    const tx = 0.08 + (st.hover ? st.py * 0.22 : 0) + st.dragX;
    st.ry = damp(st.ry, ty, 4, dt); st.rx = damp(st.rx, tx, 4, dt);
    turn.rotation.set(st.rx, st.ry, 0);
    holder.position.y = reduced ? 0 : Math.sin(st.t * 0.8) * 0.04;
    ptr.position.set(st.px * 4, -st.py * 2, 2.8);
    renderer.render(scene, camera);
    if (first) { first = false; onReady && onReady(); }
  }
  requestAnimationFrame(frame);
  return { dispose() { renderer.dispose(); } };
}
