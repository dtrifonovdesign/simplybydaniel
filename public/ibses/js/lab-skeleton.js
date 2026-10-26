import { esc, shuffle, $, $$ } from './util.js';

const FACTS = {
  'Cranium (skull)': 'Axial. Protects the brain. The frontal bone is the forehead.',
  'Mandible': 'Axial. The lower jaw.',
  'Cervical vertebrae': 'Axial. 7 vertebrae, C1 to C7. Breakfast at 7. C1 (atlas) articulates with the cranium and C2 (axis).',
  'Thoracic vertebrae': 'Axial. 12 vertebrae, T1 to T12. Lunch at 12. Each carries a pair of ribs.',
  'Lumbar vertebrae': 'Axial. 5 vertebrae, L1 to L5. Dinner at 5. The largest, supporting the upper body.',
  'Sacrum': 'Axial. Follows the lumbar vertebrae and joins the pelvis.',
  'Coccyx': 'Axial. The tailbone, at the bottom of the spine.',
  'Ribs': 'Axial. Protect the heart, lungs and kidney. Breathing muscles attach here.',
  'Sternum': 'Axial. The breastbone. Articulates with the first rib (a cartilaginous joint) and the clavicle (saddle joint).',
  'Clavicle': 'Appendicular. The collar bone. Sternoclavicular joint is a saddle joint.',
  'Scapula': 'Appendicular. The shoulder blade. The acromioclavicular joint is gliding.',
  'Humerus': 'Appendicular. Upper arm. Red marrow forms blood cells here.',
  'Radius': 'Appendicular. In line with the thumb. Memory aid: the radius rotates.',
  'Ulna': 'Appendicular. The other forearm bone. Hinge joint at the elbow.',
  'Carpals': 'Appendicular. The wrist bones. Gliding joints between carpals.',
  'Metacarpals': 'Appendicular. The palm bones.',
  'Phalanges (fingers)': 'Appendicular. The finger bones. Hinge joints between phalanges.',
  'Ilium': 'Appendicular. Superior part of the pelvis. The ischium is inferior to it.',
  'Ischium': 'Appendicular. Inferior to the ilium.',
  'Pubis': 'Appendicular. Medial to the ilium. The pubic symphysis is a cartilaginous joint.',
  'Femur': 'Appendicular. The thigh bone. Ball and socket joint at the hip. Trochanter is only on the femur.',
  'Patella': 'Appendicular. The kneecap.',
  'Tibia': 'Appendicular. The thicker lower leg bone.',
  'Fibula': 'Appendicular. The thinner lower leg bone, lateral to the tibia.',
  'Tarsals': 'Appendicular. The ankle bones.',
  'Metatarsals': 'Appendicular. The arch of the foot.',
  'Phalanges (toes)': 'Appendicular. The toe bones.',
};
const AX = new Set(['Cranium (skull)', 'Mandible', 'Cervical vertebrae', 'Thoracic vertebrae', 'Lumbar vertebrae', 'Sacrum', 'Coccyx', 'Ribs', 'Sternum']);
export const BONE_NAMES = Object.keys(FACTS);

export function buildSkeleton(THREE, mat) {
  const root = new THREE.Group();
  const bones = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const up = V(0, 1, 0);
  function mk(quizName, display) {
    const g = new THREE.Group(); const axial = AX.has(quizName);
    g.userData = { quizName, display: display || quizName, axial };
    g.userData.mat = mat(axial ? 0xe9e0cc : 0xc9a468, { roughness: .6 });
    root.add(g); bones.push(g); return g;
  }
  const add = (g, geo, pos, rot) => { const m = new THREE.Mesh(geo, g.userData.mat); m.position.copy(pos); if (rot) m.rotation.set(...rot); g.add(m); return m; };
  function between(g, a, b, r, ends = true) {
    const len = a.distanceTo(b); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(.001, len - 2 * r), 4, 10), g.userData.mat);
    m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize()); g.add(m); return m;
  }
  const sph = (g, p, r, s = [1, 1, 1]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), g.userData.mat); m.position.copy(p); m.scale.set(...s); g.add(m); return m; };
  const tube = (g, pts, r, seg = 24) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 6, false), g.userData.mat); g.add(m); return m; };
  const sides = [1, -1];

  // skull and mandible
  let g = mk('Cranium (skull)');
  sph(g, V(0, 1.69, .005), .095, [1, 1.08, 1.12]);
  sph(g, V(0, 1.625, .075), .05, [1.1, .8, .7]);
  g = mk('Mandible');
  const mand = new THREE.Mesh(new THREE.TorusGeometry(.052, .011, 8, 20, Math.PI), g.userData.mat); mand.rotation.x = Math.PI / 2; mand.position.set(0, 1.585, .018); mand.scale.set(1.05, 1, 1.15); g.add(mand);
  [1, -1].forEach(s => between(g, V(s * .055, 1.585, .018), V(s * .05, 1.64, -.01), .01));

  // vertebrae
  const zc = y => y > 1.4 ? -.02 - (1.55 - y) * .3 : y > 1.0 ? -.05 - .025 * Math.sin((1.4 - y) / .4 * Math.PI) : -.035 + (1 - y) * .0;
  const cn = ['C1 (atlas)', 'C2 (axis)', 'C3', 'C4', 'C5', 'C6', 'C7'];
  for (let i = 0; i < 7; i++) { g = mk('Cervical vertebrae', cn[i]); const y = 1.555 - i * .02; add(g, new THREE.CylinderGeometry(.017 + i * .0012, .017 + i * .0012, .016, 14), V(0, y, zc(y))); }
  for (let i = 0; i < 12; i++) { g = mk('Thoracic vertebrae', 'T' + (i + 1)); const y = 1.40 - i * .0285; add(g, new THREE.CylinderGeometry(.021 + i * .0012, .021 + i * .0012, .022, 14), V(0, y, zc(y))); add(g, new THREE.BoxGeometry(.008, .008, .03), V(0, y - .002, zc(y) - .028), [.5, 0, 0]); }
  for (let i = 0; i < 5; i++) { g = mk('Lumbar vertebrae', 'L' + (i + 1)); const y = 1.045 - i * .037; add(g, new THREE.CylinderGeometry(.034 + i * .001, .035 + i * .001, .03, 16), V(0, y, -.045 + .006 * Math.sin(i * .9))); add(g, new THREE.BoxGeometry(.01, .014, .034), V(0, y, -.082), [.2, 0, 0]); }
  g = mk('Sacrum'); { const m = add(g, new THREE.CylinderGeometry(.06, .028, .13, 4, 1), V(0, .79, -.062), [-.4, Math.PI / 4, 0]); m.scale.set(1, 1, .55); }
  g = mk('Coccyx'); add(g, new THREE.ConeGeometry(.016, .06, 8), V(0, .70, -.065), [Math.PI + .25, 0, 0]);

  // ribs and sternum
  g = mk('Ribs');
  sides.forEach(s => { for (let i = 0; i < 12; i++) {
    const y0 = 1.375 - i * .0285, w = .105 + .05 * Math.sin(Math.PI * (i + 1.4) / 11.5), d = .06 + .004 * Math.min(i, 6), c = .0, end = i < 7 ? .92 : i < 10 ? .78 : .52;
    const pts = []; for (let k = 0; k <= 12; k++) { const ph = Math.PI * end * k / 12; pts.push(V(s * (.03 + w * Math.sin(ph)), y0 - .035 * (k / 12) - .015 * Math.sin(ph), zc(y0) * .55 + c - d * Math.cos(ph) * 1.0 + (i < 7 ? .02 : 0))); }
    tube(g, pts, .0048, 20);
  } });
  g = mk('Sternum'); add(g, new THREE.BoxGeometry(.05, .2, .012), V(0, 1.265, .088)); add(g, new THREE.BoxGeometry(.09, .03, .012), V(0, 1.375, .085));

  // shoulder girdle and arm
  sides.forEach(s => {
    g = mk('Clavicle'); tube(g, [V(s * .018, 1.375, .085), V(s * .07, 1.392, .06), V(s * .13, 1.388, .02), V(s * .185, 1.372, -.005)], .0085, 16);
    g = mk('Scapula'); { const sh = new THREE.Shape(); sh.moveTo(-.055, .075); sh.lineTo(.05, .08); sh.lineTo(.06, .05); sh.lineTo(0, -.09); sh.lineTo(-.04, -.05); sh.closePath();
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .006, bevelEnabled: false }), g.userData.mat); m.position.set(s * .12, 1.285, -.088); m.rotation.y = -s * .45; if (s < 0) m.scale.x = -1; g.add(m);
      between(g, V(s * .085, 1.345, -.095), V(s * .185, 1.375, -.02), .007); }
    g = mk('Humerus'); sph(g, V(s * .192, 1.355, -.003), .024); between(g, V(s * .195, 1.35, -.003), V(s * .205, 1.075, -.008), .0145);
    g = mk('Ulna'); between(g, V(s * .2, 1.07, -.008), V(s * .198, .81, .006), .0095); sph(g, V(s * .2, 1.075, -.025), .014);
    g = mk('Radius'); between(g, V(s * .215, 1.065, .0), V(s * .232, .805, .01), .0085);
    g = mk('Carpals'); for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) add(g, new THREE.BoxGeometry(.017, .016, .014), V(s * (.185 + c * .0175 + (r ? .004 : 0)) + (s < 0 ? 0 : 0), .79 - r * .017, .006));
    const fx = [.255, .235, .214, .193, .174].map(x => s * x);
    g = mk('Metacarpals'); fx.forEach((x, f) => { const y1 = .765 - (f === 0 ? .02 : 0), y2 = .70 + (f === 0 ? .02 : f === 2 ? -.004 : 0); between(g, V(x - s * (f === 0 ? .004 : 0), y1, f === 0 ? .018 : .006), V(x, y2, f === 0 ? .026 : .008), .0058); });
    g = mk('Phalanges (fingers)'); fx.forEach((x, f) => { const segs = f === 0 ? 2 : 3; let y = (f === 0 ? .675 : .695) + (f === 2 ? -.004 : 0); const L = [.034, .022, .018]; for (let k = 0; k < segs; k++) { between(g, V(x, y - .002, f === 0 ? .03 : .01), V(x, y - L[k] * (f === 0 && k ? .9 : 1), f === 0 ? .034 : .01), .0048); y -= L[k] + .003; } });
  });

  // pelvis and leg
  sides.forEach(s => {
    g = mk('Ilium'); { const m = sph(g, V(s * .1, .875, -.012), .088, [1, 1.0, .26]); m.rotation.y = s * .55; m.rotation.z = -s * .12; }
    g = mk('Ischium'); between(g, V(s * .085, .79, -.01), V(s * .068, .715, -.03), .015); sph(g, V(s * .066, .712, -.032), .02);
    g = mk('Pubis'); between(g, V(s * .09, .785, .02), V(s * .085, .765, .062), .013); between(g, V(s * .085, .765, .062), V(s * .014, .742, .068), .012);
    g = mk('Femur'); sph(g, V(s * .088, .785, .008), .027); between(g, V(s * .1, .775, .008), V(s * .1, .765, .008), .01); between(g, V(s * .1, .765, .01), V(s * .072, .435, .012), .0165); sph(g, V(s * .118, .765, .005), .02);
    sph(g, V(s * .088, .43, .01), .03, [1.25, .85, 1]);
    g = mk('Patella'); sph(g, V(s * .072, .425, .052), .022, [1, 1.1, .45]);
    g = mk('Tibia'); between(g, V(s * .075, .405, .014), V(s * .078, .082, .004), .0165); sph(g, V(s * .076, .405, .012), .028, [1.3, .55, 1.0]); sph(g, V(s * .076, .078, .003), .022, [1, .8, 1]);
    g = mk('Fibula'); between(g, V(s * .108, .392, -.004), V(s * .107, .075, -.008), .0085); sph(g, V(s * .108, .392, -.004), .014); sph(g, V(s * .107, .074, -.008), .015);
    g = mk('Tarsals'); [[.0, 0, 0], [.014, .005, .028], [-.012, .003, .035], [.0, -.004, -.03], [.02, 0, -.02], [-.015, 0, .002], [.012, .004, .002]].forEach(o => add(g, new THREE.BoxGeometry(.027, .026, .03), V(s * (.078 + o[0]), .042 + o[1], o[2] + .004)));
    const tx = [.058, .069, .081, .092, .103].map(x => s * x);
    g = mk('Metatarsals'); tx.forEach((x, f) => between(g, V(x, .028, .046 - (f === 0 ? .004 : 0)), V(x + s * (f - 2) * .002, .02, .122 - f * .004), .0072));
    g = mk('Phalanges (toes)'); tx.forEach((x, f) => { let z = .13 - f * .004; const segs = f === 0 ? 2 : 3, L = f === 0 ? [.03, .022] : [.016, .012, .01]; for (let k = 0; k < segs; k++) { between(g, V(x, .02, z), V(x, .018, z + L[k]), .0055); z += L[k] + .003; } });
  });

  // pivot group-level tweaks: make every mesh pickable by its group
  bones.forEach(b => b.traverse(o => { if (o.isMesh) o.userData.bone = b; }));
  return { root, bones };
}

export function skeletonLab(app, { THREE, makeStage, mat, label, COL }) {
  app.innerHTML = `
    <a class="back" href="#/labs">3D labs</a>
    <div class="page-head"><div class="eyebrow">3D lab</div><h2>Skeleton</h2><p class="muted small">Drag to turn, pinch to zoom, tap a bone to name it.</p></div>
    <div class="lab-grid">
      <div class="stage" id="stage"><div class="tag" id="tag">Tap a bone</div><div class="hintb">drag · pinch · tap</div></div>
      <div>
        <div class="panel"><h4>Show</h4>
          <label class="toggle">Axial <input type="checkbox" id="vAx" checked></label>
          <label class="toggle">Appendicular <input type="checkbox" id="vAp" checked></label>
          <label class="toggle">Ribs and sternum <input type="checkbox" id="vRib" checked></label>
          <label class="toggle">Colour by division <input type="checkbox" id="vCol" checked></label>
          <div class="legend" style="margin-top:6px"><span><i style="background:#e9e0cc;box-shadow:inset 0 0 0 1px #0003"></i>Axial</span><span><i style="background:#c9a468"></i>Appendicular</span></div>
        </div>
        <div class="panel"><h4>Selected</h4><div id="info" class="small">Nothing selected.</div></div>
        <div class="panel"><h4>Find the bone</h4><div id="quiz"><button class="btn" id="qs">Start quiz</button></div></div>
      </div>
    </div>`;
  const host = $('#stage');
  const S = makeStage(host, { pos: [0, 1.2, 3.1], target: [0, .92, 0], bg: COL.ink, minD: .5, maxD: 6 });
  const { root, bones } = buildSkeleton(THREE, mat);
  S.scene.add(root);
  // floor ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(.5, .52, 64), new THREE.MeshBasicMaterial({ color: COL.brass, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; S.scene.add(ring);

  let selected = null, colorMode = true;
  function paint() { bones.forEach(b => { const u = b.userData; u.mat.color.set(colorMode ? (u.axial ? 0xe9e0cc : 0xc9a468) : 0xe4d9c2); u.mat.emissive.set(0x000000); });
    if (selected) selected.userData.mat.emissive.set(0x6a5326); }
  function highlight(name) { bones.forEach(b => { if (b.userData.quizName === name) b.userData.mat.emissive.set(0x8a6a2a); }); }
  function select(b) {
    selected = b; paint();
    if (!b) return;
    const q = b.userData.quizName; bones.forEach(x => { if (x.userData.quizName === q) x.userData.mat.emissive.set(0x6a5326); });
    $('#tag').textContent = (b.userData.display !== q ? b.userData.display + ' · ' : '') + q;
    $('#info').innerHTML = `<b style="color:var(--ink)">${esc(q)}</b> <span class="pill">${b.userData.axial ? 'Axial' : 'Appendicular'}</span><p style="margin:8px 0 0">${esc(FACTS[q])}</p>`;
  }
  const vis = () => { const ax = $('#vAx').checked, ap = $('#vAp').checked, rib = $('#vRib').checked;
    bones.forEach(b => { const u = b.userData; b.visible = (u.axial ? ax : ap) && (rib || (u.quizName !== 'Ribs' && u.quizName !== 'Sternum')); }); };
  ['vAx', 'vAp', 'vRib'].forEach(i => $('#' + i).onchange = vis);
  $('#vCol').onchange = e => { colorMode = e.target.checked; paint(); if (selected) select(selected); };

  // tap to pick
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let down = null;
  S.dom.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  S.dom.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 7) return;
    const r = S.dom.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, S.camera);
    const hit = ray.intersectObjects(bones.filter(b => b.visible), true).find(h => h.object.userData.bone);
    const b = hit?.object.userData.bone || null;
    if (quizState) return answer(b); select(b);
  });

  // quiz
  let quizState = null;
  function startQuiz() {
    quizState = { order: shuffle(BONE_NAMES).slice(0, 10), i: 0, right: 0, tries: 0 }; select(null); $('#tag').textContent = 'Quiz'; nextQ();
  }
  function nextQ() {
    const q = quizState; paint();
    if (q.i >= q.order.length) { $('#quiz').innerHTML = `<div class="score" style="font-size:44px">${q.right}/${q.order.length}</div><p class="small">first-try taps correct</p><button class="btn" id="qs">Again</button>`; $('#qs').onclick = startQuiz; quizState = null; $('#tag').textContent = 'Tap a bone'; return; }
    const name = q.order[q.i]; q.tries = 0;
    $('#quiz').innerHTML = `<div class="eyebrow">${q.i + 1} of ${q.order.length}</div><h3>Tap the ${esc(name)}</h3><p class="small muted" id="fb">&nbsp;</p><button class="btn ghost sm" id="skip">Show me</button>`;
    $('#skip').onclick = () => { highlight(name); q.tries = 9; $('#fb').textContent = 'That is the highlighted bone. Tap anywhere to continue.'; q.reveal = true; };
    $('#tag').textContent = `Find: ${name}`;
  }
  function answer(b) {
    const q = quizState, name = q.order[q.i];
    if (q.reveal) { q.reveal = false; q.i++; return nextQ(); }
    if (!b) return;
    if (b.userData.quizName === name) { if (q.tries === 0) q.right++; q.i++; $('#tag').textContent = 'Correct'; nextQ(); }
    else { q.tries++; $('#fb').textContent = `That is the ${b.userData.display === b.userData.quizName ? b.userData.quizName : b.userData.display + ' (' + b.userData.quizName + ')'}. Try again.`; }
  }
  $('#qs').onclick = startQuiz;

  // slow idle turn until touched
  let idle = true; S.dom.addEventListener('pointerdown', () => idle = false);
  S.ticks.push(dt => { if (idle) root.rotation.y += dt * .25; });
  return () => S.dispose();
}
