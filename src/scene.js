import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DEFAULT, resolvePose, hasFrom } from './poses.js';

// Mark geometry from BRAND.md (viewBox 100), flipped to y-up and centered.
const K = 0.05; // svg unit -> world unit
const DEPTH = 13;
const BEVEL_T = 2.4;
const TOP_C = { x: 5, y: 22 };   // center of each half in mark units
const BOT_C = { x: -5, y: -22 };

function topShape() {
  const s = new THREE.Shape();
  s.moveTo(-2, 40);
  s.lineTo(25, 40);
  s.absarc(25, 35, 5, Math.PI / 2, 0, true);
  s.lineTo(30, 9);
  s.absarc(25, 9, 5, 0, -Math.PI / 2, true);
  s.lineTo(-2, 4);
  s.absarc(-2, 22, 18, -Math.PI / 2, -Math.PI * 1.5, true);
  return s;
}
function bottomShape() {
  const s = new THREE.Shape();
  s.moveTo(2, -4);
  s.lineTo(-25, -4);
  s.absarc(-25, -9, 5, Math.PI / 2, Math.PI, false);
  s.lineTo(-30, -35);
  s.absarc(-25, -35, 5, Math.PI, Math.PI * 1.5, false);
  s.lineTo(2, -40);
  s.absarc(2, -22, 18, -Math.PI / 2, Math.PI / 2, false);
  return s;
}
// Anchor points a designer would see in a vector editor (mark units).
const TOP_ANCHORS = [[-2, 40], [25, 40], [30, 35], [30, 9], [25, 4], [-2, 4], [-20, 22]];
const BOT_ANCHORS = [[2, -4], [-25, -4], [-30, -9], [-30, -35], [-25, -40], [2, -40], [20, -22]];

const PI = Math.PI;
function brandShapes() {
  // 1. ring (Fieldnote)
  const ring = new THREE.Shape();
  ring.absarc(0, 0, 26, 0, PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 10, 0, PI * 2, true);
  ring.holes.push(hole);

  // 2. arch with a doorway (Oak & Rye)
  const arch = new THREE.Shape();
  arch.moveTo(-17, -30);
  arch.lineTo(17, -30);
  arch.absarc(17, -25, 5, -PI / 2, 0, false);
  arch.lineTo(22, 6);
  arch.absarc(0, 6, 22, 0, PI, false);
  arch.lineTo(-22, -25);
  arch.absarc(-17, -25, 5, PI, PI * 1.5, false);
  const door = new THREE.Path();
  door.moveTo(-7, -22);
  door.lineTo(7, -22);
  door.lineTo(7, 4);
  door.absarc(0, 4, 7, 0, PI, false);
  door.lineTo(-7, -22);
  arch.holes.push(door);

  // 3. leaf (Lumen)
  const leaf = new THREE.Shape();
  leaf.moveTo(-26, -26);
  leaf.bezierCurveTo(-26, 12, -8, 30, 26, 26);
  leaf.bezierCurveTo(26, -8, 8, -28, -26, -26);

  // 4. soft triangle
  const tri = new THREE.Shape();
  tri.moveTo(-18, -22);
  tri.lineTo(18, -22);
  tri.quadraticCurveTo(31, -22, 24, -11);
  tri.lineTo(6, 22);
  tri.quadraticCurveTo(0, 32, -6, 22);
  tri.lineTo(-24, -11);
  tri.quadraticCurveTo(-31, -22, -18, -22);

  return [ring, arch, leaf, tri];
}

function buildHalf(shape, desktop) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL_T,
    bevelSize: 1.5,
    bevelSegments: desktop ? 6 : 3,
    curveSegments: desktop ? 48 : 20,
  });
  geo.center();
  geo.scale(K, K, K);
  return geo;
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2); g.fill();
  return new THREE.CanvasTexture(c);
}

function buildAnchors(list, c, tex) {
  const arr = list.map(([x, y]) => new THREE.Vector3((x - c.x) * K, (y - c.y) * K, (DEPTH / 2 + BEVEL_T + 0.8) * K));
  const geo = new THREE.BufferGeometry().setFromPoints(arr);
  const mat = new THREE.PointsMaterial({
    color: 0xb8935a, size: 9, sizeAttenuation: false, map: tex, transparent: true,
    alphaTest: 0.05, depthTest: false, opacity: 0,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 6;
  pts.visible = false;
  return { obj: pts, mat };
}

export function createScene(canvas, { desktop, fine, reduced }) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, desktop ? 2 : 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;

  const key = new THREE.DirectionalLight(0xfff1dc, 1.6);
  key.position.set(3, 5, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe8d9bd, 0.8);
  rim.position.set(-5, -2, -4);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.z = 10;

  const INK = new THREE.Color('#1A1816');
  const CREAM = new THREE.Color('#F4EEE3');
  const topMat = new THREE.MeshPhysicalMaterial({
    color: INK, roughness: 0.6, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.5, envMapIntensity: 0.35, transparent: true,
  });
  const botMat = new THREE.MeshPhysicalMaterial({
    color: '#B8935A', roughness: 0.3, metalness: 0.9, clearcoat: 0.2, clearcoatRoughness: 0.4, transparent: true,
  });

  const tShape = topShape(), bShape = bottomShape();
  const topGeo = buildHalf(tShape, desktop);
  const botGeo = buildHalf(bShape, desktop);
  const top = new THREE.Mesh(topGeo, topMat);
  const bot = new THREE.Mesh(botGeo, botMat);
  const topBase = new THREE.Vector3(TOP_C.x * K, TOP_C.y * K, 0);
  const botBase = new THREE.Vector3(BOT_C.x * K, BOT_C.y * K, 0);

  // Pencil sketch + vector anchors ride along with each half.
  const tex = dotTexture();
  const topAnch = buildAnchors(TOP_ANCHORS, TOP_C, tex);
  const botAnch = buildAnchors(BOT_ANCHORS, BOT_C, tex);
  top.add(topAnch.obj);
  bot.add(botAnch.obj);

  const root = new THREE.Group();
  root.add(top, bot);
  scene.add(root);

  // Four file variants for the "Then I finish the files" step. Each mark sits on a rounded tile,
  // like a file thumbnail or an app icon, so they read as different exports of the logo.
  const famDefs = [
    { tile: '#2B2723', top: '#F4EEE3', bot: '#B8935A', bm: 0.85 },  // app icon
    { tile: '#F4EEE3', top: '#1A1816', bot: '#B8935A', bm: 0.85 },  // full color on light
    { tile: '#B8935A', top: '#1A1816', bot: '#1A1816', bm: 0.1 },   // one color, ink
    { tile: '#5C554B', top: '#F4EEE3', bot: '#F4EEE3', bm: 0.1 },   // one color, cream
  ];
  const tileGeo = (() => {
    const w = 3.7, h = 3.7, r = 0.85;
    const t = new THREE.Shape();
    t.moveTo(-w / 2 + r, -h / 2);
    t.lineTo(w / 2 - r, -h / 2);
    t.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
    t.lineTo(w / 2, h / 2 - r);
    t.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
    t.lineTo(-w / 2 + r, h / 2);
    t.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
    t.lineTo(-w / 2, -h / 2 + r);
    t.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    const g2 = new THREE.ExtrudeGeometry(t, {
      depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05,
      bevelSegments: 2, curveSegments: desktop ? 16 : 8,
    });
    g2.center();
    return g2;
  })();
  const fam = famDefs.map((d, i) => {
    const g = new THREE.Group();
    const mk = (geo, base, color, metal) => {
      const m = new THREE.MeshPhysicalMaterial({
        color, roughness: 0.45, metalness: metal, clearcoat: 0.2, transparent: true, opacity: 0,
      });
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.copy(base);
      g.add(mesh);
      return m;
    };
    const mt = mk(topGeo, topBase, d.top, 0.1), mb = mk(botGeo, botBase, d.bot, d.bm);
    const tileMat = new THREE.MeshPhysicalMaterial({
      color: d.tile, roughness: 0.6, metalness: 0.05, transparent: true, opacity: 0,
    });
    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.position.z = -0.62;
    g.add(tile);
    g.visible = false;
    root.add(g);
    return { g, mt, mb, tileMat, i };
  });
  const labelPt = new THREE.Vector3();

  // Other brands' logos: they cascade out behind the mark in the "Then I look around" step.
  const brandColors = [
    { c: '#B8935A', metal: 0.7, rough: 0.35 },
    { c: '#F4EEE3', metal: 0.05, rough: 0.55 },
    { c: '#D9B77E', metal: 0.5, rough: 0.4 },
    { c: '#9A8F7C', metal: 0.1, rough: 0.55 },
  ];
  const brands = brandShapes().map((shape, i) => {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 8, bevelEnabled: true, bevelThickness: 2, bevelSize: 1.2,
      bevelSegments: desktop ? 4 : 2, curveSegments: desktop ? 40 : 18,
    });
    geo.center();
    geo.scale(K, K, K);
    const m = new THREE.MeshPhysicalMaterial({
      color: brandColors[i].c, metalness: brandColors[i].metal, roughness: brandColors[i].rough,
      clearcoat: 0.2, transparent: true, opacity: 0,
    });
    const mesh = new THREE.Mesh(geo, m);
    mesh.visible = false;
    root.add(mesh);
    return { mesh, m, i };
  });

  // Daniel sits on the flat top edge of the ink half. He is a transparent photo that faces the camera,
  // pinned to that edge, so he rides along as the mark moves, leans toward the cursor and splits apart.
  const SIT = { w: 1.36, h: 2.04, u: 0.425, v: 0.381, scale: 0.92 }; // card size (mark units) and seat pixel (u,v from bottom-left)
  const sitMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.25, opacity: 0 });
  const sitPivot = new THREE.Group();
  const sitMesh = new THREE.Mesh(new THREE.PlaneGeometry(SIT.w, SIT.h), sitMat);
  sitMesh.position.set((0.5 - SIT.u) * SIT.w, (0.5 - SIT.v) * SIT.h, 0);
  sitPivot.add(sitMesh);
  sitPivot.visible = false;
  scene.add(sitPivot);
  let sitReady = false;
  new THREE.TextureLoader().load(import.meta.env.BASE_URL + 'images/daniel-sit.webp', (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    sitMat.map = t; sitMat.needsUpdate = true; sitReady = true;
  });
  const seatPt = new THREE.Vector3();
  const chestPt = new THREE.Vector3();

  // A second Daniel (the smiling, front-facing photo) sits on the same edge in the About section.
  const SIT2 = { w: 3.1, h: 4.65, u: 0.5, v: 0.25, scale: 1.0 };
  const sit2Mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.25, opacity: 0 });
  const sit2Pivot = new THREE.Group();
  const sit2Mesh = new THREE.Mesh(new THREE.PlaneGeometry(SIT2.w, SIT2.h), sit2Mat);
  sit2Mesh.position.set((0.5 - SIT2.u) * SIT2.w, (0.5 - SIT2.v) * SIT2.h, 0);
  sit2Pivot.add(sit2Mesh);
  sit2Pivot.visible = false;
  scene.add(sit2Pivot);
  let sit2Ready = false;
  new THREE.TextureLoader().load(import.meta.env.BASE_URL + 'images/daniel-sit-front-fade.webp', (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    sit2Mat.map = t; sit2Mat.needsUpdate = true; sit2Ready = true;
  });

  let viewW = 1, viewH = 1, fit = 1, mobile = !desktop, lastW = 0, lastH = 0;
  let anchors = [];
  const cur = { ...DEFAULT };
  let curInit = false;
  let intro = reduced ? 1 : 0;
  let introStartS = 1;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0, act: 0, tgt: 0, px: 0, py: 0, svx: 0, svy: 0 };
  let formOpen = 0, formTarget = 0, burst = 0;
  let travel = null;
  let twS = 0, alphaS = 1, exS = 0, trPx = 0, trPy = 0, trBox = 1;
  let spin = 0, skew = 0, lastOpacity = -1;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    // Mobile browser bars change innerHeight while scrolling; ignore that.
    if (lastW === w && Math.abs(h - lastH) < 160) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    viewH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    viewW = viewH * camera.aspect;
    mobile = w < 860;
    fit = mobile ? Math.min(viewW / 6, viewH / 13) : Math.min(1, viewW / 6.2, viewH / 5.2);
  }

  function measure(els) {
    const vh = window.innerHeight;
    const keys = [];
    els.forEach((el) => {
      const name = el.dataset.pose;
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      if (hasFrom(name)) {
        // a held step: the mark moves from its start state to its end state while the page is held
        const a = top + vh / 2;
        let b = top + r.height - vh / 2;
        if (b <= a + 1) b = a + 1;
        keys.push({ name, variant: 'from', c: a, linear: true }, { name, variant: 'end', c: b, held: true });
      } else {
        keys.push({ name, variant: 'end', c: top + r.height / 2 });
      }
    });
    anchors = keys.sort((a, b) => a.c - b.c);
  }

  function target(scrollY) {
    const cy = scrollY + window.innerHeight * 0.5;
    if (!anchors.length) return resolvePose('hero', mobile);
    if (cy <= anchors[0].c) return resolvePose(anchors[0].name, mobile, anchors[0].variant);
    const last = anchors[anchors.length - 1];
    if (cy >= last.c) return resolvePose(last.name, mobile, last.variant);
    let i = 0;
    while (i < anchors.length - 2 && cy > anchors[i + 1].c) i++;
    const a = anchors[i], b = anchors[i + 1];
    const raw = (cy - a.c) / (b.c - a.c);
    // inside a held step progress is steady (every wheel tick counts); between steps it is quick
    const t = a.linear ? raw : a.held && b.variant === 'from' ? smooth(0.28, 0.72, raw) : smooth(0.18, 0.82, raw);
    const pa = resolvePose(a.name, mobile, a.variant), pb = resolvePose(b.name, mobile, b.variant);
    const out = {};
    for (const k in DEFAULT) out[k] = pa[k] + (pb[k] - pa[k]) * t;
    return out;
  }

  // Match the loader's flat 2D mark: svg mark box is 0.6em wide.
  function setIntroSize(svgPx) {
    const pxPerWorld = window.innerHeight / viewH;
    introStartS = (0.6 * svgPx) / pxPerWorld / (60 * K) / fit;
  }

  function update(dt, scrollY, velocity, time) {
    const tgt = target(scrollY);
    if (!curInit) { Object.assign(cur, tgt); curInit = true; }
    const damp = reduced ? 1 : 1 - Math.exp(-dt * 6.5);
    for (const k in cur) cur[k] += (tgt[k] - cur[k]) * damp;

    // Scroll speed leans the mark a little. Smoothed so it never jitters.
    const spinT = reduced ? 0 : clamp(velocity * 0.00007, -0.14, 0.14);
    const skewT = reduced ? 0 : clamp(velocity * 0.00003, -0.04, 0.04);
    const ks = 1 - Math.exp(-dt * 5);
    spin += (spinT - spin) * ks;
    skew += (skewT - skew) * ks;

    mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 3.2);
    mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 3.2);
    mouse.act += (mouse.tgt - mouse.act) * Math.min(1, dt * 2.5);
    mouse.svx += (((mouse.x - mouse.px) / Math.max(dt, 0.001)) - mouse.svx) * Math.min(1, dt * 9);
    mouse.svy += (((mouse.y - mouse.py) / Math.max(dt, 0.001)) - mouse.svy) * Math.min(1, dt * 9);
    mouse.px = mouse.x; mouse.py = mouse.y;
    formOpen += (formTarget - formOpen) * Math.min(1, dt * 4);
    burst *= Math.exp(-dt * 2.4);

    let p = cur;
    let extraRy = 0;
    if (intro < 1) {
      const e = 1 - Math.pow(1 - intro, 3);
      p = {};
      const from = { ...DEFAULT, s: introStartS };
      for (const k in DEFAULT) p[k] = from[k] + (cur[k] - from[k]) * e;
      extraRy = (e - 1) * Math.PI * 2;
    }

    // Path hand-off: the mark shrinks into the little traveler and grows back out.
    // Everything about the hand-off is eased, so scrolling fast through it can never pop or teleport.
    const live3 = !!(travel && !reduced && intro >= 1);
    if (live3) { trPx = travel.px; trPy = travel.py; trBox = travel.box; }
    const kT = 1 - Math.exp(-dt * 9);
    twS += ((live3 ? travel.tw : 0) - twS) * kT;
    alphaS += ((live3 ? travel.alpha3d : 1) - alphaS) * kT;
    exS += ((live3 ? travel.exit || 0 : 0) - exS) * (1 - Math.exp(-dt * 6));
    if (twS < 0.0005) twS = 0;
    if (exS < 0.0005) exS = 0;
    let tw = twS, alpha3d = alphaS;
    if (!reduced && intro >= 1 && (twS > 0 || exS > 0 || alphaS < 0.999)) {
      const pxPerWorld = window.innerHeight / viewH;
      const goal = {
        ...DEFAULT,
        x: (trPx / window.innerWidth) * 2 - 1,
        y: 1 - (trPy / window.innerHeight) * 2,
        s: trBox / (5 * fit * pxPerWorld),
        a: 1,
        dark: p.dark,
      };
      const np = {};
      for (const k in DEFAULT) np[k] = p[k] + (goal[k] - p[k]) * tw;
      // Coming out of the path the halves stay clear of the heading:
      // top half sits in the top right, bottom half in the bottom left.
      const ex = exS;
      if (ex > 0) {
        const sc = np.s * fit;
        const rx = (np.x * viewW) / 2, ry = (np.y * viewH) / 2;
        const goal2 = (cx, cy, base) => [
          ((cx * viewW) / 2 - rx) / sc - base.x,
          ((cy * viewH) / 2 - ry) / sc - base.y,
        ];
        const [ttx, tty] = goal2(0.6, 0.56, topBase);
        const [btx, bty] = goal2(-0.58, -0.76, botBase);
        np.tx += (ttx - np.tx) * ex;
        np.ty += (tty - np.ty) * ex;
        np.bx += (btx - np.bx) * ex;
        np.by += (bty - np.by) * ex;
      }
      p = np;
    }
    const still = 1 - tw;

    const idle = reduced ? 0 : 1;
    const calm = 1 - clamp(p.sketch + p.vec, 0, 1) * 0.9; // keep drawings steady
    const bob = Math.sin(time * 0.9) * 0.05 * idle * calm * still;
    const breathe = Math.sin(time * 0.35) * 0.06 * idle * calm * still;
    const live = fine && !mobile ? mouse.act * still : 0;
    const mx = mouse.sx * calm * live;
    const my = mouse.sy * calm * live;

    root.position.set(p.x * viewW * 0.5, p.y * viewH * 0.5 + bob, 0);
    root.scale.setScalar(p.s * fit);
    root.rotation.set(
      p.rx - my * 0.22,
      p.ry + extraRy + mx * 0.35 + breathe + spin * calm + burst,
      p.rz + skew,
    );

    // Each half drifts a little toward the cursor (top more than bottom, so the gap breathes).
    const sc = p.s * fit;
    const cwx = (mouse.sx * viewW) / 2, cwy = (-mouse.sy * viewH) / 2;
    const vx = (cwx - root.position.x) / sc, vy = (cwy - root.position.y) / sc;
    const pull = live * p.pull;
    const lean = (k, maxL) => {
      let x = vx * k * pull, y = vy * k * pull;
      const l = Math.hypot(x, y);
      if (l > maxL) { x *= maxL / l; y *= maxL / l; }
      return [x, y];
    };
    const [tpx, tpy] = lean(0.17, 0.95);
    const [bpx, bpy] = lean(0.11, 0.7);
    const open = formOpen * 0.32;
    top.position.set(topBase.x + p.tx + tpx, topBase.y + p.ty + bob * 0.6 + tpy + open, topBase.z + p.tz + Math.hypot(tpx, tpy) * 0.3);
    top.rotation.set(p.trx - tpy * 0.25, p.try + tpx * 0.25, p.trz);
    bot.position.set(botBase.x + p.bx + bpx, botBase.y + p.by - bob * 0.6 + bpy - open, botBase.z + p.bz + Math.hypot(bpx, bpy) * 0.2);
    bot.rotation.set(p.brx - bpy * 0.2, p.bry + bpx * 0.2, p.brz);
    // a quick flick of the cursor makes the halves swing past each other and settle
    const jx = clamp(mouse.svx * 0.045, -0.7, 0.7) * live, jy = clamp(mouse.svy * 0.045, -0.7, 0.7) * live;
    top.position.x += jx * 0.4; top.position.y -= jy * 0.3;
    bot.position.x -= jx * 0.3; bot.position.y += jy * 0.22;
    top.rotation.z -= jx * 0.45; bot.rotation.z += jx * 0.35;


    // Thickness: the mark flattens into a vector shape and back.
    const zs = 1 - clamp(p.flat, 0, 1) * 0.97;
    top.scale.set(1, 1, zs);
    bot.scale.set(1, 1, zs);

    // Solid body fades while the pencil lines draw on.
    const solid = clamp(p.solid, 0, 1) * alpha3d;
    root.visible = alpha3d > 0.01;
    topMat.opacity = solid;
    botMat.opacity = solid;
    topMat.depthWrite = botMat.depthWrite = solid > 0.98;
    topMat.visible = botMat.visible = solid > 0.005;

    topMat.color.lerpColors(INK, CREAM, clamp(p.dark, 0, 1));
    topMat.roughness = 0.6 + p.dark * 0.05;
    topMat.envMapIntensity = 0.35 + p.dark * 0.65;
    topMat.clearcoat = 0.15 - p.dark * 0.1;

    // Vector anchors
    const vec = clamp(p.vec, 0, 1);
    topAnch.mat.opacity = 0; botAnch.mat.opacity = 0;
    topAnch.obj.visible = botAnch.obj.visible = false;

    // In the vector step the mark reads as flat, exact brand colors (no reflections).
    const flatAmt = clamp(p.flat, 0, 1);
    topMat.envMapIntensity *= 1 - flatAmt * 0.9;
    topMat.roughness += flatAmt * (1 - topMat.roughness);
    botMat.metalness = 0.9 * (1 - flatAmt);
    botMat.roughness = 0.3 + 0.7 * flatAmt;
    botMat.clearcoat = 0.2 * (1 - flatAmt);
    botMat.envMapIntensity = 1 - flatAmt * 0.9;
    botMat.color.set('#B8935A').multiplyScalar(1 - 0.2 * flatAmt);
    topMat.color.multiplyScalar(1 - 0.16 * flatAmt);

    // File variants (end of the process) and other brands' logos (research step)
    const d = clamp(p.deck, 0, 1), f = clamp(p.files, 0, 1), merge = clamp(p.merge, 0, 1);
    const fileLabels = [];
    const par = mouse.act * (fine && !mobile ? 1 : 0);
    fam.forEach(({ g, mt, mb, tileMat, i }) => {
      const fi = clamp(f * 1.9 - i * 0.3, 0, 1);
      if (fi < 0.004) { g.visible = false; fileLabels.push(null); return; }
      g.visible = true;
      const gap = mobile ? 1.3 : 1.6;
      g.position.set((i - 1.5) * gap + mouse.sx * par * 0.18 * (i - 1.5), -2.9 - mouse.sy * par * 0.12, (1 - fi) * -1.5);
      g.rotation.set(mouse.sy * par * 0.2, mouse.sx * par * 0.32 + (1 - fi) * 1.2, 0);
      g.scale.setScalar(fi * (mobile ? 0.27 : 0.38));
      const op = fi;
      mt.opacity = mb.opacity = tileMat.opacity = op;
      mt.depthWrite = mb.depthWrite = tileMat.depthWrite = op > 0.98;
      g.updateWorldMatrix(true, false);
      labelPt.set(0, -2.45, 0);
      g.localToWorld(labelPt);
      labelPt.project(camera);
      fileLabels.push({ x: (labelPt.x * 0.5 + 0.5) * window.innerWidth, y: (-labelPt.y * 0.5 + 0.5) * window.innerHeight, a: fi });
    });

    // Other brands start off to the right, cascade in, and are then drawn into the mark.
    brands.forEach(({ mesh, m, i }) => {
      const di = clamp(d * 1.9 - i * 0.3, 0, 1);
      if (di < 0.004) { mesh.visible = false; return; }
      mesh.visible = true;
      const cx = (i + 1) * 0.8, cy = (i + 1) * 0.38 - 0.2, cz = -(i + 1) * 0.45;
      const enter = (1 - di) * (1 - merge);
      const k = 1 - merge;
      const dep = (i + 1) * 0.2 * par * k;
      mesh.position.set(cx * k + 3.4 * enter + mouse.sx * dep, cy * k + 0.9 * enter - mouse.sy * dep * 0.7, cz * k - 1.2 * enter);
      mesh.rotation.set(mouse.sy * par * 0.25 * k, -(i + 1) * 0.14 + merge * (i % 2 ? 2.2 : -2.2) + mouse.sx * par * 0.4 * k, (i % 2 ? -1 : 1) * 0.05);
      mesh.scale.setScalar(di * (1.12 - i * 0.03));
      m.opacity = di * (0.4 - i * 0.06);
      m.depthWrite = false;
    });

    // Daniel on the ledge
    let sitInfo = { a: 0, x: 0, y: 0, r: 0 };
    const sitAmt = clamp(p.sit, 0, 1) * alpha3d * (top.visible && topMat.visible ? 1 : 0);
    if (sitReady && sitAmt > 0.01) {
      root.updateMatrixWorld(true);
      seatPt.set(0.325, 0.9, 0.6); // middle of the top edge, just in front of the face
      top.localToWorld(seatPt);
      sitPivot.visible = true;
      sitPivot.position.copy(seatPt);
      sitPivot.quaternion.copy(camera.quaternion);
      const sway = reduced ? 0 : Math.sin(time * 1.25) * 0.022;
      sitPivot.rotateZ(sway + root.rotation.z + top.rotation.z * 0.6);
      sitPivot.scale.setScalar(root.scale.x * SIT.scale * (0.9 + 0.1 * sitAmt));
      sitMat.opacity = sitAmt;
      // where his chest is on screen, for the arrow that points at him
      sitPivot.updateMatrixWorld(true);
      chestPt.set((0.58 - SIT.u) * SIT.w, (0.56 - SIT.v) * SIT.h, 0);
      sitPivot.localToWorld(chestPt);
      chestPt.project(camera);
      sitInfo = {
        a: sitAmt,
        x: (chestPt.x * 0.5 + 0.5) * window.innerWidth,
        y: (-chestPt.y * 0.5 + 0.5) * window.innerHeight,
        r: SIT.w * 0.2 * sitPivot.scale.x * (window.innerHeight / viewH),
      };
    } else {
      sitPivot.visible = false;
    }

    // The second Daniel, on the big mark in About. His legs stay solid down to the ankles.
    const sit2Amt = clamp(p.sitB, 0, 1) * alpha3d * (top.visible && topMat.visible ? 1 : 0);
    if (sit2Ready && sit2Amt > 0.01) {
      root.updateMatrixWorld(true);
      seatPt.set(0.325, 0.9, 0.62);
      top.localToWorld(seatPt);
      sit2Pivot.visible = true;
      sit2Pivot.position.copy(seatPt);
      sit2Pivot.quaternion.copy(camera.quaternion);
      const sway2 = reduced ? 0 : Math.sin(time * 1.1 + 1.3) * 0.012;
      sit2Pivot.rotateZ(sway2 + root.rotation.z + top.rotation.z * 0.6);
      sit2Pivot.scale.setScalar(root.scale.x * SIT2.scale * (0.92 + 0.08 * sit2Amt));
      sit2Mat.opacity = sit2Amt;
    } else {
      sit2Pivot.visible = false;
    }

    const opCanvas = Math.round(p.a * 100) / 100;
    if (opCanvas !== lastOpacity) { canvas.style.opacity = String(opCanvas); lastOpacity = opCanvas; }

    renderer.render(scene, camera);
    const pxPerWorld = window.innerHeight / viewH;
    return {
      dark: p.dark, sketch: p.sketch, vec: p.vec,
      cx: (p.x * 0.5 + 0.5) * window.innerWidth,
      cy: (0.5 - p.y * 0.5 - bob / viewH) * window.innerHeight,
      box: 100 * K * p.s * fit * pxPerWorld,
      rz: p.rz + skew,
      facing: Math.cos(p.ry + extraRy),
      tw: twS,
      sit: sitInfo,
      files: f,
      fileLabels,
    };
  }

  resize();
  return {
    update, resize, measure, setIntroSize,
    setIntro: (v) => { intro = v; },
    getIntro: () => intro,
    pointer: (x, y) => { mouse.x = x; mouse.y = y; mouse.tgt = 1; },
    leave: () => { mouse.tgt = 0; },
    setForm: (v) => { formTarget = v; },
    setTravel: (t) => { travel = t; },
    celebrate: () => { burst = Math.PI * 2; },
  };
}
