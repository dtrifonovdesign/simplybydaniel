import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// The Briks "I" as a real 3D oak plank with gold edges (briks-plank.glb, the model made for the Briks site).
// One plank lives in a fixed, full-screen canvas and travels between "slots": empty boxes in the page
// (data-slot). It rides the slot it is nearest to exactly as the page scrolls; only the gap left behind
// when it changes slot is eased, so a fast scroll never leaves it behind.
const MODEL = '/case-studies/briks/briks-plank.glb';
const FOV = 28;

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

export async function createPlank(canvas, { cfg, reduced = false, fine = true }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance', stencil: false });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 6000);

  // the plank: the real model of the Briks "I" (oak with gold edges), scaled so its height is 1
  const gltf = await new GLTFLoader().loadAsync(MODEL);
  const plank = gltf.scene;
  const box = new THREE.Box3().setFromObject(plank);
  const size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  plank.position.sub(mid);
  const unit = new THREE.Group(); unit.add(plank); unit.scale.setScalar(1 / size.y);
  const maxAnis = renderer.capabilities.getMaxAnisotropy();
  plank.traverse((o) => { if (!o.isMesh) return; [].concat(o.material).forEach((m) => { ['map', 'normalMap', 'roughnessMap', 'metalnessMap'].forEach((k) => { if (m[k]) { m[k].anisotropy = Math.min(maxAnis, 8); renderer.initTexture(m[k]); } }); if (m.isMeshStandardMaterial) m.envMapIntensity = 1; }); });
  const holder = new THREE.Group();
  holder.add(unit);
  scene.add(holder);

  const key = new THREE.DirectionalLight(0xfff0d8, 2.4); key.position.set(-500, 700, 900); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xcfe7da, 0x0a1d15, 0.6));
  const ptr = new THREE.PointLight(0xffe2a8, 7, 1100, 0); scene.add(ptr);

  // ---- slots
  let slots = [];
  const collect = () => { slots = [...document.querySelectorAll('[data-slot]')].map((el) => ({ el, name: el.dataset.slot, spin: +(el.dataset.spin || 0), tilt: +(el.dataset.tilt || 1) })); };
  collect();

  const st = { x: 0, y: 0, h: 0, ox: 0, oy: 0, a: 0, slot: null, rotY: -0.4, rotTarget: -0.4, mx: 0, my: 0, px: 0, py: 0, bump: 0, hold: true, w: 1, hh: 1, pr: 1 };
  addEventListener('pointermove', (e) => { st.px = e.clientX; st.py = e.clientY; st.mx = (e.clientX / innerWidth - 0.5) * 2; st.my = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  addEventListener('pointerdown', (e) => {
    if (!st.slot) return;
    const r = st.slot.el.getBoundingClientRect();
    if (e.clientX >= r.left - 12 && e.clientX <= r.right + 12 && e.clientY >= r.top && e.clientY <= r.bottom) { st.rotTarget += Math.PI * 2; st.bump = 1; }
  });

  const resize = () => {
    const w = innerWidth, h = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, cfg.dprCap, Math.sqrt(cfg.maxPixels / (w * h)));
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = FOV;
    camera.position.set(0, 0, h / 2 / Math.tan((FOV * Math.PI) / 360));
    camera.updateProjectionMatrix();
    st.w = w; st.hh = h; st.pr = dpr;
  };
  resize();

  const setQuality = (c) => { cfg = c; resize(); };

  function render(dt) {
    const vh = st.hh;
    // nearest slot to the middle of the screen
    let best = null, bestD = Infinity, bestR = null;
    for (const s of slots) {
      const r = s.el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const d = Math.abs(r.top + r.height / 2 - vh / 2);
      if (d < bestD) { best = s; bestD = d; bestR = r; }
    }
    if (!best) return;
    const tx = bestR.left + bestR.width / 2, ty = bestR.top + bestR.height / 2, th = bestR.height;
    if (best !== st.slot) {
      if (st.slot) { st.ox = st.x - tx; st.oy = st.y - ty; st.rotTarget += Math.PI * 2 * best.spin; }
      else { st.x = tx; st.y = ty; st.h = th; st.ox = st.oy = 0; }
      st.slot = best;
    }
    // ride the slot; ease only the leftover gap
    st.ox = damp(st.ox, 0, 3.2, dt); st.oy = damp(st.oy, 0, 3.2, dt);
    st.x = tx + st.ox; st.y = ty + st.oy;
    st.h = damp(st.h, th, 6, dt);
    // fade away (scale to nothing) when no slot is anywhere near
    const near = bestD < vh * 1.15 && !st.hold;
    st.a = damp(st.a, near ? 1 : 0, 4, dt);
    st.bump = damp(st.bump, 0, 3, dt);

    st.rotY = damp(st.rotY, st.rotTarget, 2.6, dt);
    const tilt = best.tilt;
    holder.position.set(st.x - st.w / 2, st.hh / 2 - st.y, 0);
    holder.scale.setScalar(Math.max(0.0001, st.h * st.a * (1 + st.bump * 0.06)));
    unit.rotation.set(0.12 + st.my * 0.12 * tilt, st.rotY + st.mx * 0.45 * tilt, 0);
    ptr.position.set(st.px - st.w / 2, st.hh / 2 - st.py, 320);
    if (st.a < 0.01) return;
    renderer.render(scene, camera);
  }

  return {
    render, resize, setQuality, collect,
    release() { st.hold = false; },                    // called once the intro has finished
    visible: () => st.a > 0.01,
    stats: () => `plank ${st.pr.toFixed(2)}x`,
    dispose() { renderer.dispose(); },
  };
}
