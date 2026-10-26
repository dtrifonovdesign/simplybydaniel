import { esc, shuffle, $, $$ } from './util.js';

const D = Math.PI / 180;
const ease = x => x * x * (3 - 2 * x);
const tri = t => ease(t < .5 ? t * 2 : 2 - 2 * t);

/* ---------- mannequin ---------- */
export function makeMannequin(THREE, mat, COL) {
  const skin = mat(0x6e655a, { roughness: .8 }), dark = mat(0x3d3832), mark = mat(COL.brass, { roughness: .5 });
  const rig = new THREE.Group();
  const body = new THREE.Group(); rig.add(body);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const cap = (parent, r, len, pos, m = skin) => { const g = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 12), m); g.position.set(...pos); parent.add(g); return g; };
  const ball = (parent, r, pos, m = dark) => { const g = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); g.position.set(...pos); parent.add(g); return g; };
  const box = (parent, s, pos, m = skin) => { const g = new THREE.Mesh(new THREE.BoxGeometry(...s), m); g.position.set(...pos); parent.add(g); return g; };
  const J = { body };
  box(body, [.3, .13, .17], [0, 0, 0]);
  J.waist = new THREE.Group(); J.waist.position.set(0, .07, 0); body.add(J.waist);
  const chest = box(J.waist, [.34, .5, .2], [0, .27, 0]); chest.geometry = new THREE.CapsuleGeometry(.12, .26, 4, 12); chest.scale.set(1.4, 1, .9);
  J.neck = new THREE.Group(); J.neck.position.set(0, .55, 0); J.waist.add(J.neck);
  cap(J.neck, .035, .05, [0, .04, 0], dark); ball(J.neck, .105, [0, .17, 0], skin); const nose = new THREE.Mesh(new THREE.ConeGeometry(.02, .05, 8), mark); nose.rotation.x = Math.PI / 2; nose.position.set(0, .165, .12); J.neck.add(nose);
  const side = (s, n) => {
    const sh = new THREE.Group(); sh.position.set(s * .21, .47, 0); J.waist.add(sh); ball(sh, .042, [0, 0, 0]); cap(sh, .036, .22, [0, -.15, 0]);
    const el = new THREE.Group(); el.position.set(0, -.3, 0); sh.add(el); ball(el, .035, [0, 0, 0]);
    const fore = new THREE.Group(); el.add(fore); cap(fore, .03, .2, [0, -.14, 0]);
    const wr = new THREE.Group(); wr.position.set(0, -.28, 0); fore.add(wr); ball(wr, .026, [0, 0, 0]);
    box(wr, [.09, .13, .03], [0, -.08, 0]); box(wr, [.078, .11, .006], [0, -.085, .017], mark);
    const tip = new THREE.Object3D(); tip.position.set(0, -.15, 0); wr.add(tip);
    J['sh' + n] = sh; J['el' + n] = el; J['for' + n] = fore; J['wr' + n] = wr; J['tip' + n] = tip;
    const hip = new THREE.Group(); hip.position.set(s * .09, -.05, 0); body.add(hip); ball(hip, .05, [0, 0, 0]); cap(hip, .05, .3, [0, -.22, 0]);
    const kn = new THREE.Group(); kn.position.set(0, -.44, 0); hip.add(kn); ball(kn, .042, [0, 0, 0]); cap(kn, .04, .3, [0, -.22, 0]);
    const an = new THREE.Group(); an.position.set(0, -.43, 0); kn.add(an); ball(an, .032, [0, 0, 0]);
    box(an, [.09, .05, .22], [0, -.025, .06]); box(an, [.07, .004, .19], [0, -.052, .06], mark);
    J['hip' + n] = hip; J['kn' + n] = kn; J['an' + n] = an;
  };
  side(1, 'L'); side(-1, 'R');
  rig.traverse(o => { if (o.isMesh) o.userData.keep = true; });
  const home = new Map(); rig.traverse(o => home.set(o, [o.position.clone(), o.rotation.clone(), o.scale.clone()]));
  J.rest = () => { home.forEach(([p, r, s], o) => { o.position.copy(p); o.rotation.copy(r); o.scale.copy(s); }); body.position.set(0, .95, 0); body.rotation.set(0, 0, 0); };
  // plant both feet on the floor for a given hip and knee flexion (degrees)
  J.ground = (h, k, lean = 0) => { const a = h * D, b = (h - k) * D; const y = .44 * Math.cos(a) + .43 * Math.cos(b) + .05 + .052; const z = -(.44 * Math.sin(a) + .43 * Math.sin(b)); body.position.set(0, y, z); ['L', 'R'].forEach(n => { J['hip' + n].rotation.x = -a; J['kn' + n].rotation.x = k * D; J['an' + n].rotation.x = (h - k) * D; }); };
  body.position.set(0, .95, 0);
  return { rig, J };
}

/* ---------- planes and axes helpers ---------- */
export function planeMesh(THREE, w, h, color, rot, name) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .2, side: THREE.DoubleSide, depthWrite: false }));
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)), new THREE.LineBasicMaterial({ color, transparent: true }));
  g.add(m, e); g.rotation.set(...rot); g.userData = { m, e }; return g;
}
export function axisMesh(THREE, dir, len, color) {
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, len, 10), new THREE.MeshBasicMaterial({ color, transparent: true }));
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(.04, .12, 12), new THREE.MeshBasicMaterial({ color, transparent: true }));
  const c2 = c1.clone(); c1.position.y = len / 2; c2.position.y = -len / 2; c2.rotation.x = Math.PI;
  g.add(cyl, c1, c2); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.userData = { mats: [cyl.material, c1.material, c2.material] }; return g;
}
function arcArrow(THREE, color) {
  const g = new THREE.Group();
  const arc = new THREE.Mesh(new THREE.TorusGeometry(.62, .02, 8, 48, Math.PI * 1.5), new THREE.MeshBasicMaterial({ color }));
  const head = new THREE.Mesh(new THREE.ConeGeometry(.06, .16, 12), new THREE.MeshBasicMaterial({ color }));
  head.position.set(0, -.62, 0); head.rotation.z = 0; const a = Math.PI * 1.5; head.position.set(Math.cos(a) * .62, Math.sin(a) * .62, 0); head.rotation.z = a;
  g.add(arc, head); return g;
}

export const ACTS3D = [
  { n: 'Sit up', p: 'Sagittal', a: 'Frontal', dur: 3 },
  { n: 'Basketball free throw', p: 'Sagittal', a: 'Frontal', dur: 2.6 },
  { n: 'Throwing a dart', p: 'Sagittal', a: 'Frontal', dur: 2 },
  { n: 'Cartwheel', p: 'Frontal', a: 'Sagittal', dur: 3 },
  { n: 'Backflip', p: 'Sagittal', a: 'Frontal', dur: 2.4 },
  { n: 'Front somersault', p: 'Sagittal', a: 'Frontal', dur: 2.4 },
  { n: 'Half twist', p: 'Transverse', a: 'Vertical', dur: 2.2 },
  { n: 'Tuck jump', p: 'Sagittal', a: 'Frontal', dur: 1.8 },
  { n: 'Squat exercise', p: 'Sagittal', a: 'Frontal', dur: 3 },
  { n: 'Lateral leg raise', p: 'Frontal', a: 'Sagittal', dur: 2.6 },
  { n: 'Pike jump', p: 'Sagittal', a: 'Frontal', dur: 1.8 },
  { n: 'Shot put throw', p: 'Transverse', a: 'Vertical', dur: 2.2, note: 'Body rotation shown. The arm push also has a sagittal part.' },
  { n: 'High knees drill', p: 'Sagittal', a: 'Frontal', dur: 1.6 },
  { n: 'Lateral dumbbell raise', p: 'Frontal', a: 'Sagittal', dur: 2.6 },
  { n: 'Standing spinal twist', p: 'Transverse', a: 'Vertical', dur: 3 },
];

function playAct(name, t, J) {
  const B = J.body, s = tri(t), both = (k, f) => { J[k + 'L'].rotation.x = f; J[k + 'R'].rotation.x = f; };
  J.rest();
  const shAbd = d => { J.shL.rotation.z = d * D; J.shR.rotation.z = -d * D; };
  switch (name) {
    case 'Sit up': B.rotation.x = -90 * D; B.position.set(0, .14, .1); J.waist.rotation.x = s * 75 * D; J.neck.rotation.x = s * 15 * D; break;
    case 'Basketball free throw': { J.ground(35 * (1 - s), 70 * (1 - s)); both('sh', -(40 + 110 * s) * D); both('el', -(120 - 110 * s) * D); break; }
    case 'Throwing a dart': J.shR.rotation.x = -(70 + 25 * s) * D; J.elR.rotation.x = -(120 - 100 * s) * D; J.shL.rotation.z = 12 * D; break;
    case 'Cartwheel': B.rotation.z = -2 * Math.PI * ease(t); B.position.set(-.9 + 1.8 * t, .98 + .1 * Math.sin(Math.PI * t), 0); shAbd(170); J.hipL.rotation.z = 38 * D; J.hipR.rotation.z = -38 * D; break;
    case 'Backflip': { const u = Math.sin(Math.PI * Math.min(1, t * 1.0)); B.rotation.x = -2 * Math.PI * ease(t); B.position.y = .95 + .8 * u; const tk = Math.pow(Math.sin(Math.PI * t), .7); both('hip', -105 * D * tk); both('kn', 115 * D * tk); both('sh', -40 * D * tk); break; }
    case 'Front somersault': { const u = Math.sin(Math.PI * t); B.rotation.x = 2 * Math.PI * ease(t); B.position.y = .95 + .8 * u; const tk = Math.pow(u, .7); both('hip', -105 * D * tk); both('kn', 115 * D * tk); both('sh', -40 * D * tk); break; }
    case 'Half twist': B.rotation.y = Math.PI * ease(t); B.position.y = .95 + .5 * Math.sin(Math.PI * t); shAbd(30 * Math.sin(Math.PI * t)); break;
    case 'Tuck jump': { const u = Math.sin(Math.PI * t); B.position.y = .95 + .55 * u; both('hip', -100 * D * u); both('kn', 110 * D * u); both('sh', -50 * D * u); break; }
    case 'Squat exercise': J.ground(95 * s, 105 * s); J.waist.rotation.x = 30 * D * s; both('sh', -90 * D * s); break;
    case 'Lateral leg raise': J.hipR.rotation.z = -s * 50 * D; J.shL.rotation.z = 10 * D; J.shR.rotation.z = -10 * D; break;
    case 'Pike jump': { const u = Math.sin(Math.PI * t); B.position.y = .95 + .5 * u; both('hip', -88 * D * u); both('sh', -88 * D * u); J.waist.rotation.x = 8 * D * u; break; }
    case 'Shot put throw': J.waist.rotation.y = (40 - 90 * s) * D; J.shR.rotation.x = -(100 - 30 * s) * D; J.elR.rotation.x = -(130 - 120 * s) * D; J.neck.rotation.y = (-40 + 80 * s) * D * 0; break;
    case 'High knees drill': { const ph = Math.sin(2 * Math.PI * t); J.hipL.rotation.x = -Math.max(0, ph) * 95 * D; J.knL.rotation.x = Math.max(0, ph) * 105 * D; J.hipR.rotation.x = -Math.max(0, -ph) * 95 * D; J.knR.rotation.x = Math.max(0, -ph) * 105 * D; J.shL.rotation.x = Math.max(0, -ph) * 30 * D - Math.max(0, ph) * 30 * D; J.shR.rotation.x = -J.shL.rotation.x; J.elL.rotation.x = J.elR.rotation.x = -80 * D; B.position.y = .95 + .02 * Math.abs(ph); break; }
    case 'Lateral dumbbell raise': shAbd(s * 90); break;
    case 'Standing spinal twist': J.waist.rotation.y = Math.sin(2 * Math.PI * t) * 50 * D; J.shL.rotation.z = 70 * D; J.shR.rotation.z = -70 * D; break;
  }
}

/* ---------- Planes lab ---------- */
export function planesLab(app, { THREE, makeStage, mat, label, COL }) {
  app.innerHTML = `
    <a class="back" href="#/labs">3D labs</a>
    <div class="page-head"><div class="eyebrow">3D lab</div><h2>Planes and axes</h2><p class="muted small">Drag to turn the view. Pick a skill to see its plane and axis light up.</p></div>
    <div class="lab-grid">
      <div class="stage" id="stage"><div class="tag" id="tag">Explore</div><div class="hintb">drag · pinch</div></div>
      <div>
        <div class="seg" id="mode" style="margin-bottom:12px"><button data-m="explore" class="on">Explore</button><button data-m="skills">Skills</button><button data-m="test">Test me</button></div>
        <div id="side"></div>
      </div>
    </div>`;
  const S = makeStage($('#stage'), { pos: [2.5, 1.7, 3.6], target: [0, .95, 0], bg: COL.sand, minD: 2, maxD: 9 });
  const { rig, J } = makeMannequin(THREE, mat, COL); S.scene.add(rig);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48), new THREE.MeshBasicMaterial({ color: 0xdcd2bd })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.002; S.scene.add(floor);
  const C = { Sagittal: COL.sag, Frontal: COL.fro, Transverse: COL.tra };
  const C0 = new THREE.Vector3(0, .95, 0);
  const P = {
    Sagittal: planeMesh(THREE, 1.7, 2.3, C.Sagittal, [0, Math.PI / 2, 0]),
    Frontal: planeMesh(THREE, 1.7, 2.3, C.Frontal, [0, 0, 0]),
    Transverse: planeMesh(THREE, 1.7, 1.7, C.Transverse, [-Math.PI / 2, 0, 0]),
  };
  Object.values(P).forEach(p => { p.position.copy(C0); S.scene.add(p); });
  const A = {
    Vertical: axisMesh(THREE, new THREE.Vector3(0, 1, 0), 2.5, C.Transverse),
    Sagittal: axisMesh(THREE, new THREE.Vector3(0, 0, 1), 1.9, C.Frontal),
    Frontal: axisMesh(THREE, new THREE.Vector3(1, 0, 0), 1.9, C.Sagittal),
  };
  Object.values(A).forEach(a => { a.position.copy(C0); S.scene.add(a); });
  const pl = {
    Sagittal: label('Sagittal plane', { size: .11 }), Frontal: label('Frontal plane', { size: .11 }), Transverse: label('Transverse plane', { size: .11 }),
    aV: label('Vertical axis', { size: .1 }), aS: label('Sagittal axis', { size: .1 }), aF: label('Frontal axis', { size: .1 }),
  };
  pl.Sagittal.position.set(0, 2.05, .8); pl.Frontal.position.set(.75, 2.05, 0); pl.Transverse.position.set(.78, .95, .78);
  pl.aV.position.set(0, 2.32, 0); pl.aS.position.set(0, .95, 1.05); pl.aF.position.set(1.05, .95, 0);
  Object.values(pl).forEach(s => S.scene.add(s));
  const arc = arcArrow(THREE, 0x1a1816); arc.visible = false; arc.position.copy(C0); S.scene.add(arc);
  // arc orientation: lies in the plane of movement, perpendicular to the axis
  const arcRot = { Sagittal: [0, Math.PI / 2, 0], Frontal: [0, 0, 0], Transverse: [-Math.PI / 2, 0, 0] };

  const planeOfAxis = { Frontal: 'Sagittal', Sagittal: 'Frontal', Vertical: 'Transverse' };
  const axisLabel = { Vertical: 'aV', Sagittal: 'aS', Frontal: 'aF' };
  function focus(plane, axis) {            // null = show all
    Object.entries(P).forEach(([k, p]) => { const on = !plane || k === plane; p.userData.m.material.opacity = on ? (plane ? .34 : .2) : .04; p.userData.e.material.opacity = on ? 1 : .15; pl[k].visible = !plane || k === plane; });
    Object.entries(A).forEach(([k, a]) => { const on = !axis || k === axis; a.userData.mats.forEach(m => m.opacity = on ? 1 : .12); pl[axisLabel[k]].visible = !axis || k === axis; });
    if (plane) { arc.visible = true; arc.rotation.set(...arcRot[plane]); } else arc.visible = false;
  }
  let vis = { Sagittal: true, Frontal: true, Transverse: true, Vertical: true, SagAx: true, FroAx: true };
  function showAll(on) { Object.values(P).forEach(p => p.visible = on); Object.values(A).forEach(a => a.visible = on); Object.values(pl).forEach(s => s.visible = on); }
  focus(null, null);

  let cur = null, tTest = null, playing = true, tt = 0;
  S.ticks.push(dt => {
    if (cur) { const act = ACTS3D.find(a => a.n === cur); tt = (tt + dt / act.dur) % 1; playAct(cur, tt, J); }
    if (arc.visible) arc.children.forEach(c => c); if (arc.visible) arc.rotateZ(-dt * 1.4);
  });
  const side = $('#side');

  function explore() {
    cur = null; J.rest(); focus(null, null); arc.visible = false; $('#tag').textContent = 'Explore';
    side.innerHTML = `
      <div class="panel"><h4>Planes cut the body</h4>
        <div class="kv"><b style="color:#9a7a3c">Sagittal</b><span>left from right</span><b>Frontal</b><span>front from back</span><b style="color:#4d6b58">Transverse</b><span>top from bottom</span></div></div>
      <div class="panel"><h4>Axes of rotation</h4>
        <div class="kv"><b>Vertical</b><span>head to feet, through the transverse plane</span><b>Sagittal</b><span>front to back, through the frontal plane</span><b>Frontal</b><span>side to side, through the sagittal plane</span></div>
        <p class="small muted" style="margin:10px 0 0">Movement in a plane happens about an axis perpendicular to it. Each axis is coloured like the plane that spins around it.</p></div>
      <div class="panel"><h4>Show</h4>
        ${['Sagittal', 'Frontal', 'Transverse'].map(k => `<label class="toggle">${k} plane <input type="checkbox" data-p="${k}" checked></label>`).join('')}
        ${['Vertical', 'Sagittal', 'Frontal'].map(k => `<label class="toggle">${k} axis <input type="checkbox" data-a="${k}" checked></label>`).join('')}
      </div>
      <div class="panel"><h4>Highlight a pair</h4><div class="mv-list">${['Sagittal', 'Frontal', 'Transverse'].map(k => `<button class="chip" data-hl="${k}">${k} plane + ${Object.entries(planeOfAxis).find(([, v]) => v === k)[0].toLowerCase()} axis</button>`).join('')}<button class="chip" data-hl="">All</button></div></div>`;
    $$('[data-p]', side).forEach(c => c.onchange = () => P[c.dataset.p].visible = pl[c.dataset.p].visible = c.checked);
    $$('[data-a]', side).forEach(c => c.onchange = () => { A[c.dataset.a].visible = pl[axisLabel[c.dataset.a]].visible = c.checked; });
    $$('[data-hl]', side).forEach(c => c.onclick = () => { const k = c.dataset.hl; if (!k) { focus(null, null); $('#tag').textContent = 'Explore'; return; } const ax = Object.entries(planeOfAxis).find(([, v]) => v === k)[0]; focus(k, ax); $('#tag').textContent = `${k} plane · ${ax.toLowerCase()} axis`; });
  }
  function skills() {
    showAll(true);
    side.innerHTML = `<div class="panel"><h4>Pick a skill</h4><div class="mv-list">${ACTS3D.map(a => `<button class="chip" data-a="${esc(a.n)}">${esc(a.n)}</button>`).join('')}</div></div><div class="panel" id="res"><p class="muted small" style="margin:0">Choose a skill. Its plane and axis light up while it plays.</p></div>`;
    $$('[data-a]', side).forEach(c => c.onclick = () => { $$('.chip', side).forEach(x => x.classList.remove('sel')); c.classList.add('sel'); play(c.dataset.a); });
  }
  function play(n) {
    const a = ACTS3D.find(x => x.n === n); cur = n; tt = 0; focus(a.p, a.a); $('#tag').textContent = n;
    const res = $('#res'); if (res) res.innerHTML = `<h4>${esc(n)}</h4><div class="kv"><b>Plane</b><span>${a.p}</span><b>Axis</b><span>${a.a === 'Vertical' ? 'Vertical (longitudinal)' : a.a}</span></div>${a.note ? `<p class="small muted" style="margin:8px 0 0">${esc(a.note)}</p>` : ''}`;
  }
  function test() {
    showAll(false); arc.visible = false; $('#tag').textContent = 'Name the plane and axis';
    const pool = shuffle(ACTS3D.slice(0, 13)); let i = 0, right = 0, pa = null, aa = null;
    const q = () => {
      if (i >= 10) { cur = null; J.rest(); side.innerHTML = `<div class="panel" style="text-align:center"><div class="eyebrow">Done</div><div class="score">${right}/10</div><button class="btn" id="again" style="margin-top:12px">Again</button></div>`; $('#again').onclick = test; return; }
      const a = pool[i % pool.length]; cur = a.n; tt = 0; pa = aa = null;
      side.innerHTML = `<div class="panel"><div class="eyebrow">${i + 1} of 10</div><h3>${esc(a.n)}</h3>
        <h4 style="margin:14px 0 6px">Plane</h4><div class="seg" id="pl">${['Sagittal', 'Frontal', 'Transverse'].map(x => `<button>${x}</button>`).join('')}</div>
        <h4 style="margin:14px 0 6px">Axis</h4><div class="seg" id="ax">${['Frontal', 'Sagittal', 'Vertical'].map(x => `<button>${x}</button>`).join('')}</div>
        <div style="margin-top:16px" id="fb"><button class="btn" id="ck" disabled>Check</button></div></div>`;
      const wire = (id, set) => $$(`#${id} button`).forEach(b => b.onclick = () => { $$(`#${id} button`).forEach(x => x.classList.remove('on')); b.classList.add('on'); set(b.textContent); $('#ck').disabled = !(pa && aa); });
      wire('pl', v => pa = v); wire('ax', v => aa = v);
      $('#ck').onclick = () => { const ok = pa === a.p && aa === a.a; if (ok) right++; showAll(true); focus(a.p, a.a);
        $('#fb').innerHTML = `<div class="why" style="${ok ? 'background:var(--good-bg);color:var(--good)' : 'background:var(--bad-bg);color:var(--bad)'}">${ok ? 'Correct' : 'Not quite'}: ${a.p.toLowerCase()} plane, ${a.a.toLowerCase()} axis.</div><button class="btn" id="nx">Next</button>`; $('#nx').onclick = () => { i++; showAll(false); arc.visible = false; q(); }; };
    };
    q();
  }
  $$('#mode button').forEach(b => b.onclick = () => { $$('#mode button').forEach(x => x.classList.remove('on')); b.classList.add('on'); showAll(true); cur = null; J.rest(); ({ explore, skills, test })[b.dataset.m](); });
  explore();
  return () => S.dispose();
}

/* ---------- Movements lab ---------- */
const MOVES = [
  { id: 'flex', names: ['Flexion', 'Extension'], joint: 'Elbow (hinge)', plane: 'Sagittal', axis: 'Frontal', def: ['Closing of the joint angle (bending)', 'Opening of the joint angle (straightening)'],
    f: (J, p) => { J.elL.rotation.x = J.elR.rotation.x = -p * 130 * D; J.shL.rotation.z = 6 * D; J.shR.rotation.z = -6 * D; }, dir: p => p },
  { id: 'hyper', names: ['Extension', 'Hyperextension'], joint: 'Shoulder (ball and socket)', plane: 'Sagittal', axis: 'Frontal', def: ['Returning to the starting position', 'Beyond 180 degrees, or back past the starting position'],
    f: (J, p) => { J.shL.rotation.x = J.shR.rotation.x = p * 55 * D; }, dir: p => p },
  { id: 'abd', names: ['Abduction', 'Adduction'], joint: 'Shoulder and hip', plane: 'Frontal', axis: 'Sagittal', def: ['Away from the midline. Memory aid: taken away.', 'Toward the midline. Memory aid: adding, putting together.'],
    f: (J, p) => { J.shL.rotation.z = p * 150 * D; J.shR.rotation.z = -p * 150 * D; J.hipL.rotation.z = p * 25 * D; J.hipR.rotation.z = -p * 25 * D; }, dir: p => p },
  { id: 'pron', names: ['Supination', 'Pronation'], joint: 'Radioulnar joint (forearm)', plane: 'Transverse', axis: 'Vertical (along the forearm)', def: ['Palm faces upward (anteriorly in anatomical position)', 'Palm faces downward (posteriorly in anatomical position)'],
    f: (J, p) => { J.elL.rotation.x = J.elR.rotation.x = -90 * D; J.forL.rotation.y = -p * Math.PI; J.forR.rotation.y = p * Math.PI; }, dir: p => p },
  { id: 'inv', names: ['Eversion', 'Inversion'], joint: 'Tarsals (foot)', plane: 'Frontal', axis: 'Sagittal', def: ['Sole faces away from the midline', 'Sole faces toward the midline'],
    f: (J, p) => { J.hipR.rotation.x = 0; J.knR.rotation.x = 95 * D; J.hipL.rotation.x = 0; J.knL.rotation.x = 95 * D; J.anR.rotation.z = (p - .5) * 2 * 25 * D; J.anL.rotation.z = -(p - .5) * 2 * 25 * D; J.body.position.y = .95; }, dir: p => p, note: 'Both knees bent so the soles are visible.' },
  { id: 'dorsi', names: ['Dorsiflexion', 'Plantar flexion'], joint: 'Ankle', plane: 'Sagittal', axis: 'Frontal', def: ['Brings the foot closer to the shin', 'Brings the foot farther from the shin'],
    f: (J, p) => { J.hipL.rotation.x = J.hipR.rotation.x = -35 * D; J.anL.rotation.x = J.anR.rotation.x = (p - .5) * 2 * 40 * D * 1 + 12 * D; J.knL.rotation.x = J.knR.rotation.x = 10 * D; J.body.position.y = .95; }, dir: p => 1 - p },
  { id: 'palmar', names: ['Dorsiflexion', 'Palmar flexion'], joint: 'Wrist', plane: 'Sagittal', axis: 'Frontal', def: ['Brings the hand closer to the lower arm', 'Brings the hand farther from the lower arm'],
    f: (J, p) => { J.shL.rotation.x = J.shR.rotation.x = -90 * D; J.wrL.rotation.x = J.wrR.rotation.x = (p - .5) * 2 * -55 * D; }, dir: p => p, note: 'Arms forward, palms up.' },
  { id: 'elev', names: ['Elevation', 'Depression'], joint: 'Shoulder girdle', plane: 'Frontal', axis: 'Sagittal', def: ['Raising a part (shrugging)', 'Lowering a part (drooping the shoulders)'],
    f: (J, p) => { const y = .47 + (1 - p) * .055 - p * .025; J.shL.position.y = J.shR.position.y = y; J.shL.position.x = .21 - .005 * (1 - p); J.shR.position.x = -.21 + .005 * (1 - p); }, dir: p => 1 - p, shrug: true },
  { id: 'circ', names: ['Circumduction'], joint: 'Shoulder (ball and socket)', plane: 'Frontal + sagittal combined', axis: 'All three (cone shape)', def: ['Moving a part so that it follows a circular path'],
    f: (J, p, t) => { const a = t * 2 * Math.PI; J.shR.rotation.x = -Math.sin(a) * 60 * D - 20 * D; J.shR.rotation.z = -(Math.cos(a) * 60 * D + 70 * D); }, circ: true },
  { id: 'rot', names: ['Rotation'], joint: 'Neck (pivot) and trunk', plane: 'Transverse', axis: 'Vertical', def: ['Moving a part around an axis (twisting the head from side to side)'],
    f: (J, p, t) => { J.neck.rotation.y = Math.sin(t * 2 * Math.PI) * 65 * D; }, rot: true },
];

export function movementsLab(app, { THREE, makeStage, mat, label, COL }) {
  app.innerHTML = `
    <a class="back" href="#/labs">3D labs</a>
    <div class="page-head"><div class="eyebrow">3D lab</div><h2>Joint movements</h2><p class="muted small">Pick a movement and watch it. The name changes with the direction.</p></div>
    <div class="lab-grid">
      <div class="stage" id="stage"><div class="tag" id="tag">Choose a movement</div><div class="hintb">drag · pinch</div></div>
      <div>
        <div class="seg" id="mode" style="margin-bottom:12px"><button data-m="learn" class="on">Learn</button><button data-m="test">Name it</button></div>
        <div id="side"></div>
      </div>
    </div>`;
  const S = makeStage($('#stage'), { pos: [1.7, 1.4, 3.0], target: [0, 1.0, 0], bg: COL.sand, minD: 1.5, maxD: 7 });
  const { rig, J } = makeMannequin(THREE, mat, COL); S.scene.add(rig);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), new THREE.MeshBasicMaterial({ color: 0xdcd2bd })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.002; S.scene.add(floor);
  // trail for circumduction
  const trailN = 160, trailPts = new Float32Array(trailN * 3); const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPts, 3));
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: COL.brass })); trail.visible = false; trail.frustumCulled = false; S.scene.add(trail);
  let trailCount = 0;
  let cur = null, tt = 0, hideTag = false; const tmp = new THREE.Vector3();
  const TIME = 3.2;
  S.ticks.push(dt => {
    if (!cur) return;
    tt = (tt + dt / TIME) % 1; const p = tri(tt);
    J.rest(); cur.f(J, p, tt);
    if (cur.circ) { J.tipR.getWorldPosition(tmp); if (trailCount < trailN) { trailPts.set([tmp.x, tmp.y, tmp.z], trailCount * 3); trailCount++; } else { trailPts.copyWithin(0, 3); trailPts.set([tmp.x, tmp.y, tmp.z], (trailN - 1) * 3); } trailGeo.attributes.position.needsUpdate = true; trailGeo.setDrawRange(0, trailCount); }
    if (!hideTag) { const n = cur.names; $('#tag').textContent = n.length === 1 ? n[0] : (tt < .5 ? n[1] : n[0]); }
  });

  const side = $('#side');
  const choose = m => { cur = m; tt = 0; trail.visible = !!m.circ; trailCount = 0; };
  function learn() {
    hideTag = false; trail.visible = false;
    side.innerHTML = `<div class="panel"><h4>Movements</h4><div class="mv-list">${MOVES.map(m => `<button class="chip" data-id="${m.id}">${esc(m.names.join(' / '))}</button>`).join('')}</div></div><div class="panel" id="info"><p class="muted small" style="margin:0">Choose a movement.</p></div>`;
    $$('[data-id]', side).forEach(b => b.onclick = () => { $$('.chip', side).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); const m = MOVES.find(x => x.id === b.dataset.id); choose(m);
      $('#info').innerHTML = `<h4>${esc(m.names.join(' and '))}</h4><div class="kv"><b>Joint</b><span>${esc(m.joint)}</span><b>Plane</b><span>${esc(m.plane)}</span><b>Axis</b><span>${esc(m.axis)}</span></div>
        ${m.names.map((n, i) => `<p style="margin:10px 0 0"><b style="color:var(--ink)">${esc(n)}:</b> ${esc(m.def[i])}</p>`).join('')}${m.note ? `<p class="small muted" style="margin:10px 0 0">${esc(m.note)}</p>` : ''}`; });
  }
  function test() {
    hideTag = true; $('#tag').textContent = 'Which movement?';
    const pool = shuffle(MOVES.flatMap(m => m.names.map((n, i) => ({ m, n, i })))); let i = 0, right = 0;
    const allNames = [...new Set(MOVES.flatMap(m => m.names))];
    const q = () => {
      if (i >= 8) { cur = null; J.rest(); trail.visible = false; side.innerHTML = `<div class="panel" style="text-align:center"><div class="eyebrow">Done</div><div class="score">${right}/8</div><button class="btn" id="again" style="margin-top:12px">Again</button></div>`; $('#again').onclick = test; return; }
      const it = pool[i]; choose(it.m); if (it.m.names.length > 1) tt = it.i === 0 ? .25 : .75; $('#tag').textContent = 'Which movement?';
      const other = shuffle(allNames.filter(n => n !== it.n)).slice(0, 3); const opts = shuffle([it.n, ...other]);
      side.innerHTML = `<div class="panel"><div class="eyebrow">${i + 1} of 8</div><h3>Name the movement</h3><p class="small muted">${esc(it.m.joint)}. Watch the ${it.i === 0 ? 'first half' : 'second half'} of the loop.</p><div class="opts" style="margin-top:12px">${opts.map(o => `<button class="opt">${esc(o)}</button>`).join('')}</div><div id="fb"></div></div>`;
      $$('.opt', side).forEach(b => b.onclick = () => { const ok = b.textContent === it.n; if (ok) right++; $$('.opt', side).forEach(x => { x.disabled = true; if (x.textContent === it.n) x.classList.add('ok'); }); if (!ok) b.classList.add('no'); $('#tag').textContent = it.n;
        $('#fb').innerHTML = `<div class="why">${esc(it.n)}: ${esc(it.m.def[it.i])}</div><button class="btn" id="nx">Next</button>`; $('#nx').onclick = () => { i++; q(); }; });
    };
    q();
  }
  $$('#mode button').forEach(b => b.onclick = () => { $$('#mode button').forEach(x => x.classList.remove('on')); b.classList.add('on'); cur = null; J.rest(); ({ learn, test })[b.dataset.m](); });
  learn();
  return () => S.dispose();
}
