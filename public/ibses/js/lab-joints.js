import { esc, shuffle, $, $$ } from './util.js';
import { axisMesh } from './lab-planes.js';

const D = Math.PI / 180;
const INFO = {
  gliding: { name: 'Gliding (plane)', axes: 'Uniaxial: 1 plane of movement', desc: 'Flat or curved bones move side to side.', ex: 'Between carpals, between tarsals, acromioclavicular joint (clavicle and scapula).' },
  hinge: { name: 'Hinge', axes: 'Uniaxial: 1 plane of movement', desc: 'Convex fits into a concave surface.', ex: 'Elbow, knee, joints between phalanges.' },
  pivot: { name: 'Pivot', axes: 'Uniaxial: 1 plane of movement', desc: 'Bone rotates within a ring of another bone.', ex: 'Proximal end of radius and ulna; between C1 and C2 (shaking your head "no").' },
  condyloid: { name: 'Condyloid', axes: 'Biaxial: movement in 2 planes', desc: 'Convex fits into a concave surface.', ex: 'Knuckles (metacarpals and phalanges); radiocarpal joint.' },
  saddle: { name: 'Saddle', axes: 'Biaxial: movement in 2 planes', desc: 'Bone fits like a person on a saddle.', ex: 'Carpal and metacarpal of the thumb; sternoclavicular joint.' },
  ball: { name: 'Ball and socket', axes: 'Triaxial: movement in 3 planes', desc: 'Sphere fits into a cavity.', ex: 'Shoulder, hip.' },
};
const ORDER = ['gliding', 'hinge', 'pivot', 'condyloid', 'saddle', 'ball'];

export function jointsLab(app, { THREE, makeStage, mat, label, COL }) {
  app.innerHTML = `
    <a class="back" href="#/labs">3D labs</a>
    <div class="page-head"><div class="eyebrow">3D lab</div><h2>Synovial joint types</h2><p class="muted small">Cream is the fixed bone. Brass is the moving bone. Arrows show the axes it can move about.</p></div>
    <div class="lab-grid">
      <div class="stage" id="stage"><div class="tag" id="tag">Choose a joint</div><div class="hintb">drag · pinch</div></div>
      <div>
        <div class="seg" id="mode" style="margin-bottom:12px"><button data-m="learn" class="on">Learn</button><button data-m="test">Name it</button></div>
        <div id="side"></div>
      </div>
    </div>`;
  const S = makeStage($('#stage'), { pos: [1.7, .9, 2.3], target: [0, .0, 0], bg: COL.ink, minD: 1.2, maxD: 6 });
  const fixed = mat(0xe9e0cc, { roughness: .55 }), moving = mat(0xc9a468, { roughness: .45 });
  const cup = mat(0xe9e0cc, { roughness: .55, side: THREE.DoubleSide });
  const cupM = mat(0xc9a468, { roughness: .45, side: THREE.DoubleSide });
  const cap = (a, b, r, m) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B); const g = new THREE.Mesh(new THREE.CapsuleGeometry(r, len - 2 * r, 4, 12), m); g.position.copy(A).add(B).multiplyScalar(.5); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize()); return g; };
  const at = (parent, m, x, y, z) => { m.position.set(x, y, z); parent.add(m); return m; };
  const saddleGeo = (sign) => { const g = new THREE.PlaneGeometry(.5, .5, 24, 24); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, sign * 1.6 * (x * x - y * y)); } g.computeVertexNormals(); return g; };

  const root = new THREE.Group(); S.scene.add(root);
  const J = {};
  // each builder returns {group, upd(t)}; fixed bone sits low, moving bone above/in front
  J.hinge = () => { const g = new THREE.Group(), pv = new THREE.Group(); g.add(cap([0, -.9, 0], [0, 0, 0], .1, fixed));
    const k = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .34, 24), fixed); k.rotation.z = Math.PI / 2; g.add(k);
    g.add(pv); pv.add(cap([0, 0, 0], [0, .9, 0], .09, moving)); const k2 = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .26, 24), moving); k2.rotation.z = Math.PI / 2; pv.add(k2);
    return { group: g, upd: t => { pv.rotation.x = -(.5 - .5 * Math.cos(t * 1.6)) * 120 * D; }, axes: ['x'] }; };
  J.pivot = () => { const g = new THREE.Group(), pv = new THREE.Group(); g.add(cap([0, -.9, 0], [0, .12, 0], .07, fixed));
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, .5, 16), fixed); peg.position.y = .05; g.add(peg);
    g.add(pv); const ring = new THREE.Mesh(new THREE.TorusGeometry(.17, .05, 14, 32), moving); ring.rotation.x = Math.PI / 2; ring.position.y = .05; pv.add(ring);
    pv.add(cap([.17, .05, 0], [.55, .05, 0], .06, moving)); at(pv, new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .3), moving), .45, .05, 0);
    return { group: g, upd: t => { pv.rotation.y = Math.sin(t * 1.4) * 70 * D; }, axes: ['y'] }; };
  J.ball = () => { const g = new THREE.Group(), pv = new THREE.Group(); g.add(cap([0, -.9, 0], [0, -.2, 0], .1, fixed));
    const c = new THREE.Mesh(new THREE.SphereGeometry(.26, 28, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), cup); c.position.y = -.0; c.rotation.x = 0; c.scale.set(1, 1, 1); g.add(c);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.26, .018, 8, 32), fixed); rim.rotation.x = Math.PI / 2; g.add(rim);
    g.add(pv); pv.add(new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 16), moving)); pv.add(cap([0, .1, 0], [0, .95, 0], .075, moving)); at(pv, new THREE.Mesh(new THREE.BoxGeometry(.3, .04, .12), moving), 0, .8, 0);
    return { group: g, upd: t => { const ph = (t * .5) % 4; if (ph < 1) { pv.rotation.set(Math.sin(ph * Math.PI * 2) * .9, 0, 0); } else if (ph < 2) { pv.rotation.set(0, 0, Math.sin(ph * Math.PI * 2) * .9); } else if (ph < 3) { pv.rotation.set(0, Math.sin(ph * Math.PI * 2) * 1.2, 0); } else { const a = (ph - 3) * Math.PI * 2; pv.rotation.set(Math.sin(a) * .7, 0, Math.cos(a) * .7); } }, axes: ['x', 'y', 'z'] }; };
  J.condyloid = () => { const g = new THREE.Group(), pv = new THREE.Group(); g.add(cap([0, -.9, 0], [0, -.2, 0], .1, fixed));
    const c = new THREE.Mesh(new THREE.SphereGeometry(.26, 28, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), cup); c.scale.set(1.35, 1, .8); g.add(c);
    g.add(pv); const egg = new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 16), moving); egg.scale.set(1.35, 1, .8); pv.add(egg); pv.add(cap([0, .1, 0], [0, .95, 0], .075, moving)); at(pv, new THREE.Mesh(new THREE.BoxGeometry(.3, .04, .12), moving), 0, .8, 0);
    return { group: g, upd: t => { const ph = (t * .5) % 3; if (ph < 1) pv.rotation.set(Math.sin(ph * Math.PI * 2) * .8, 0, 0); else if (ph < 2) pv.rotation.set(0, 0, Math.sin(ph * Math.PI * 2) * .45); else { const a = (ph - 2) * Math.PI * 2; pv.rotation.set(Math.sin(a) * .7, 0, Math.cos(a) * .4); } }, axes: ['x', 'z'] }; };
  J.saddle = () => { const g = new THREE.Group(), pv = new THREE.Group(); g.add(cap([0, -.9, 0], [0, -.05, 0], .1, fixed));
    const s1 = new THREE.Mesh(saddleGeo(1), cup); s1.rotation.x = -Math.PI / 2; s1.position.y = .0; g.add(s1);
    pv.position.y = .0; g.add(pv); const s2 = new THREE.Mesh(saddleGeo(-1), cupM); s2.rotation.x = -Math.PI / 2; s2.rotation.z = 0; s2.position.y = .0; pv.add(s2);
    pv.add(cap([0, .05, 0], [0, .9, 0], .075, moving)); at(pv, new THREE.Mesh(new THREE.BoxGeometry(.3, .04, .12), moving), 0, .8, 0);
    return { group: g, upd: t => { const ph = (t * .5) % 3; if (ph < 1) pv.rotation.set(Math.sin(ph * Math.PI * 2) * .6, 0, 0); else if (ph < 2) pv.rotation.set(0, 0, Math.sin(ph * Math.PI * 2) * .6); else { const a = (ph - 2) * Math.PI * 2; pv.rotation.set(Math.sin(a) * .5, 0, Math.cos(a) * .5); } }, axes: ['x', 'z'], note: 'Rocks about two axes but cannot spin.' }; };
  J.gliding = () => { const g = new THREE.Group(), pv = new THREE.Group(); g.add(cap([0, -.9, 0], [0, -.14, 0], .1, fixed)); const b1 = new THREE.Mesh(new THREE.BoxGeometry(.6, .1, .6), fixed); b1.position.y = -.08; g.add(b1);
    g.add(pv); const b2 = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .5), moving); b2.position.y = .04; pv.add(b2); pv.add(cap([0, .05, 0], [0, .9, 0], .08, moving));
    return { group: g, upd: t => { pv.position.x = Math.sin(t * 1.6) * .1; pv.position.z = 0; }, axes: ['gx'] }; };

  const ax = {}; const axLen = 1.0, AXC = { x: 0xc9a468, y: 0xe9e0cc, z: 0x6f8f7a };
  const axDir = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  let curKey = null, cur = null, tClock = 0, hideLabel = false;
  function show(key) {
    if (cur) { root.remove(cur.group); cur.axG && root.remove(cur.axG); }
    cur = J[key](); cur.group.position.y = .1; root.add(cur.group); curKey = key;
    cur.axG = new THREE.Group(); cur.axG.position.y = .1;
    cur.axes.forEach(a => { const k = a === 'gx' ? 'x' : a; const m = axisMesh(THREE, new THREE.Vector3(...axDir[k]), 1.3, AXC[k]); if (a === 'gx') m.position.y = .0; cur.axG.add(m); });
    root.add(cur.axG); tClock = 0;
  }
  S.ticks.push(dt => { tClock += dt; cur?.upd(tClock); });

  const side = $('#side');
  function learn() {
    hideLabel = false;
    side.innerHTML = `<div class="panel"><h4>Joint type</h4><div class="mv-list">${ORDER.map(k => `<button class="chip" data-k="${k}">${INFO[k].name}</button>`).join('')}</div></div><div class="panel" id="info"><p class="muted small" style="margin:0">Choose a joint.</p></div>`;
    $$('[data-k]', side).forEach(b => b.onclick = () => { $$('.chip', side).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); const k = b.dataset.k; show(k); $('#tag').textContent = INFO[k].name;
      $('#info').innerHTML = `<h4>${INFO[k].name}</h4><div class="kv"><b>Shape</b><span>${INFO[k].desc}</span><b>Movement</b><span>${INFO[k].axes}</span><b>Examples</b><span>${INFO[k].ex}</span></div>${cur.note ? `<p class="small muted" style="margin:10px 0 0">${cur.note}</p>` : ''}`; });
    $$('[data-k]', side)[1].click();
  }
  function test() {
    hideLabel = true; let i = 0, right = 0; const order = shuffle(ORDER.concat(shuffle(ORDER).slice(0, 2)));
    const q = () => {
      if (i >= order.length) { side.innerHTML = `<div class="panel" style="text-align:center"><div class="eyebrow">Done</div><div class="score">${right}/${order.length}</div><button class="btn" id="again" style="margin-top:12px">Again</button></div>`; $('#again').onclick = test; return; }
      const k = order[i]; show(k); $('#tag').textContent = 'Which joint type?';
      side.innerHTML = `<div class="panel"><div class="eyebrow">${i + 1} of ${order.length}</div><h3>Which synovial joint is this?</h3><div class="opts" style="margin-top:12px">${shuffle(ORDER).map(o => `<button class="opt" data-k="${o}">${INFO[o].name}</button>`).join('')}</div><div id="fb"></div></div>`;
      $$('.opt', side).forEach(b => b.onclick = () => { const ok = b.dataset.k === k; if (ok) right++; $$('.opt', side).forEach(x => { x.disabled = true; if (x.dataset.k === k) x.classList.add('ok'); }); if (!ok) b.classList.add('no'); $('#tag').textContent = INFO[k].name;
        $('#fb').innerHTML = `<div class="why"><b style="color:var(--ink)">${INFO[k].name}.</b> ${INFO[k].axes}. ${INFO[k].ex}</div><button class="btn" id="nx">Next</button>`; $('#nx').onclick = () => { i++; q(); }; });
    };
    q();
  }
  $$('#mode button').forEach(b => b.onclick = () => { $$('#mode button').forEach(x => x.classList.remove('on')); b.classList.add('on'); ({ learn, test })[b.dataset.m](); });
  learn();
  return () => S.dispose();
}
