// 3D labs: shared scene helper, then the four labs.
import * as THREE from 'three';
import { OrbitControls } from './lib/OrbitControls.js';
import { esc, shuffle, hooks, $, $$ } from './util.js';
import { skeletonLab } from './lab-skeleton.js';
import { planesLab, movementsLab } from './lab-planes.js';
import { jointsLab } from './lab-joints.js';

export { THREE };

export const COL = { ink: 0x1a1816, inkSoft: 0x3d3832, stone: 0x5c554b, brass: 0xb8935a, cream: 0xf4eee3, sand: 0xebe3d3, bone: 0xe4d9c2,
  // diagram colours, scoped to the 3D scenes so planes and axes can be told apart by lightness as well as hue
  sag: 0xb8935a, fro: 0x3d3832, tra: 0x6f8f7a };

export function makeStage(host, { fov = 40, pos = [0, 1.1, 4.2], target = [0, 0.95, 0], bg = 0xebe3d3, minD = 1, maxD = 9 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(bg);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 100);
  camera.position.set(...pos);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...target); controls.enableDamping = true; controls.minDistance = minD; controls.maxDistance = maxD; controls.update();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc4ad, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, .6); fill.position.set(-4, 2, -3); scene.add(fill);
  const ticks = [];
  const resize = () => { const w = host.clientWidth || 600, h = host.clientHeight || 400; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  let raf, last = performance.now(), alive = true;
  const loop = now => { if (!alive) return; raf = requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; ticks.forEach(f => f(dt, now / 1000)); controls.update(); renderer.render(scene, camera); };
  raf = requestAnimationFrame(loop);
  const dispose = () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); scene.traverse(o => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach(x => x.dispose?.()); }); renderer.dispose(); renderer.domElement.remove(); };
  const api = { renderer, scene, camera, controls, ticks, dispose, dom: renderer.domElement }; window.__stage = api; return api;
}

export function mat(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .7, metalness: 0, ...o }); }

// text sprite label
export function label(text, { size = .12, color = '#1a1816', bg = 'rgba(244,238,227,.92)' } = {}) {
  const c = document.createElement('canvas'), x = c.getContext('2d'); const px = 64;
  x.font = `600 ${px}px "Figtree", system-ui, sans-serif`; const w = Math.ceil(x.measureText(text).width) + 40; c.width = w; c.height = px + 30;
  x.font = `600 ${px}px "Figtree", system-ui, sans-serif`; x.fillStyle = bg; x.beginPath(); x.roundRect(0, 0, c.width, c.height, 30); x.fill();
  x.fillStyle = color; x.textBaseline = 'middle'; x.fillText(text, 20, c.height / 2 + 3);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(size * c.width / c.height * 1.0, size, 1); s.renderOrder = 10; return s;
}

export function openLab(app, id) {
  const fn = { skeleton: skeletonLab, planes: planesLab, movements: movementsLab, joints: jointsLab }[id] || skeletonLab;
  const stop = fn(app, { THREE, makeStage, mat, label, COL });
  hooks.cleanup = stop;
}
