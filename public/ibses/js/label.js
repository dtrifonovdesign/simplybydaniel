import { $, $$, esc, shuffle } from './util.js';

// Pins: [label, pinX, pinY, targetX, targetY]. Pins sit in the margins, leaders run to the structure.
const BONE = '#D8CBB0', BONE2 = '#C7B891', MUSCLE = '#D9A58F', INK = '#1A1816', BRASS = '#B8935A';

function longBone() {
  const outline = 'M240,215 C225,205 200,185 200,150 C200,85 250,60 280,60 C310,60 360,85 360,150 C360,185 335,205 320,215 L320,545 C335,555 365,575 365,625 C365,685 315,710 280,710 C245,710 195,685 195,625 C195,575 225,555 240,545 Z';
  const dots = (cx, cy, n, seed) => Array.from({ length: n }, (_, i) => { const a = i * 2.4 + seed, r = 8 + (i * 7) % 44; return `<circle cx="${cx + Math.cos(a) * r * 1.2}" cy="${cy + Math.sin(a) * r * .9}" r="${3 + (i % 3)}" fill="#B5533C"/>`; }).join('');
  const web = (cx, cy, rx, ry) => Array.from({ length: 22 }, (_, i) => { const a = i * 0.9, b = a + 1.7; return `<path d="M${cx + Math.cos(a) * rx * .9} ${cy + Math.sin(a) * ry * .9} L${cx + Math.cos(b) * rx * .6} ${cy + Math.sin(b) * ry * .6}" stroke="#A8966D" stroke-width="2" fill="none"/>`; }).join('');
  return {
    id: 'longbone', title: 'Long bone (cow femur)',
    svg: `<path d="${outline}" fill="${BONE}" stroke="${BRASS}" stroke-width="4"/>
      <ellipse cx="280" cy="140" rx="64" ry="58" fill="${BONE2}"/>${web(280, 140, 64, 58)}${dots(280, 142, 9, 1)}
      <ellipse cx="280" cy="632" rx="72" ry="56" fill="${BONE2}"/>${web(280, 632, 72, 56)}${dots(280, 632, 9, 3)}
      <rect x="258" y="222" width="44" height="316" rx="22" fill="#EFDDA0" stroke="#A8966D" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="M222 100 C235 75 260 62 280 62 C300 62 325 75 338 100 L330 104 C318 86 298 76 280 76 C262 76 242 86 230 104 Z" fill="#FBFAF5" stroke="#8d98a3" stroke-width="2"/>
      <path d="M215 600 C215 625 240 700 280 706 C320 700 345 625 345 600 L335 604 C330 640 305 690 280 692 C255 690 230 640 225 604 Z" fill="#FBFAF5" stroke="#8d98a3" stroke-width="2"/>
      <path d="M320 382 L296 396" stroke="#B5533C" stroke-width="3"/><circle cx="320" cy="382" r="5" fill="#3a1a14"/>
      <g stroke="${INK}" stroke-width="2.5" fill="none"><path d="M196 62 h-12 v152 h12"/><path d="M222 222 h-8 v316 h8"/><path d="M196 548 h-12 v162 h12"/></g>`,
    vb: '0 0 560 770',
    pins: [
      ['Proximal epiphysis', 60, 138, 182, 138], ['Diaphysis', 60, 380, 214, 380], ['Distal epiphysis', 60, 628, 182, 628], ['Compact (cortical) bone', 60, 470, 248, 470],
      ['Articular cartilage', 500, 70, 292, 68], ['Spongy bone', 500, 140, 332, 120], ['Red marrow', 500, 212, 285, 150], ['Periosteum', 500, 275, 322, 275],
      ['Nutrient foramen', 500, 355, 321, 382], ['Medullary cavity', 500, 440, 299, 440], ['Yellow marrow', 500, 510, 280, 510],
    ],
  };
}

function kneeSide() {
  return {
    id: 'knee-side', title: 'Synovial joint: knee, side view',
    vb: '0 0 560 780',
    svg: `<path d="M280 140 C250 160 235 220 235 270 C235 310 238 335 250 352 L405 352 C415 330 420 290 418 250 C414 200 395 160 372 140 Z" fill="#CFE0EA" stroke="${BRASS}" stroke-width="4"/>
      <g fill="#A8966D" stroke="#A8966D" stroke-width="5"><rect x="282" y="10" width="90" height="205"/><circle cx="326" cy="248" r="72"/><rect x="290" y="372" width="76" height="400"/><rect x="252" y="352" width="152" height="40" rx="14"/></g>
      <g fill="${BONE}"><rect x="282" y="10" width="90" height="205"/><circle cx="326" cy="248" r="72"/><rect x="290" y="372" width="76" height="400"/><rect x="252" y="352" width="152" height="40" rx="14"/></g>
      <path d="M262 288 A70 70 0 0 0 390 288" fill="none" stroke="#FBFAF5" stroke-width="9" stroke-linecap="round"/>
      <path d="M262 352 H394" stroke="#FBFAF5" stroke-width="9" stroke-linecap="round"/>
      <path d="M244 352 C244 318 274 322 306 352 Z" fill="#6C7F8F"/><path d="M412 352 C412 318 380 322 346 352 Z" fill="#6C7F8F"/>
      <ellipse cx="226" cy="226" rx="22" ry="40" fill="${BONE2}" stroke="#A8966D" stroke-width="2"/>
      <ellipse cx="190" cy="230" rx="13" ry="32" fill="#E5D6B6" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="262" cy="130" rx="14" ry="28" fill="#E5D6B6" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="232" cy="345" rx="13" ry="20" fill="#E5D6B6" stroke="${INK}" stroke-width="2"/>`,
    pins: [
      ['Femur', 480, 60, 372, 60], ['Tibia', 480, 600, 366, 600], ['Patella', 60, 120, 210, 218], ['Articular cartilage', 480, 300, 392, 296],
      ['Synovial membrane', 480, 200, 400, 200], ['Joint cavity (articular capsule)', 480, 380, 330, 340], ['Meniscus', 60, 410, 262, 340], ['Bursa', 60, 40, 190, 214],
    ],
  };
}

function kneeFront() {
  return {
    id: 'knee-front', title: 'Synovial joint: knee, front view',
    vb: '0 0 560 780',
    svg: `<path d="M240 20 L320 20 L322 170 C340 200 372 215 372 250 C372 285 340 300 310 300 C300 300 290 296 281 290 C272 296 262 300 252 300 C222 300 190 285 190 250 C190 215 222 200 238 170 Z" fill="${BONE}" stroke="#A8966D" stroke-width="3"/>
      <path d="M190 335 L372 335 C372 350 360 360 340 362 L330 450 L328 760 L238 760 L236 450 L222 362 C200 360 190 350 190 335 Z" fill="${BONE}" stroke="#A8966D" stroke-width="3"/>
      <rect x="346" y="368" width="30" height="392" rx="14" fill="${BONE2}" stroke="#A8966D" stroke-width="3"/>
      <path d="M200 285 C212 300 232 302 252 300" stroke="#FBFAF5" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M362 285 C350 300 330 302 310 300" stroke="#FBFAF5" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M200 334 H362" stroke="#FBFAF5" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="236" cy="318" rx="44" ry="12" fill="#6C7F8F"/><ellipse cx="326" cy="318" rx="38" ry="12" fill="#6C7F8F"/>
      <path d="M270 334 L318 283" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M296 334 L254 283" stroke="#7A6F5F" stroke-width="10" stroke-linecap="round"/>
      <path d="M200 255 C196 300 204 380 214 432" stroke="${BRASS}" stroke-width="15" stroke-linecap="round" fill="none"/>
      <path d="M374 255 C380 300 372 345 364 392" stroke="${BRASS}" stroke-width="9" stroke-linecap="round" fill="none"/>`,
    pins: [
      ['Femur', 60, 70, 242, 70], ['Tibia', 60, 560, 237, 560], ['Fibula', 500, 580, 372, 580], ['Medial collateral ligament (MCL)', 60, 250, 198, 262],
      ['Lateral collateral ligament (LCL)', 500, 250, 376, 262], ['Anterior cruciate ligament (ACL)', 60, 420, 272, 330], ['Posterior cruciate ligament (PCL)', 500, 420, 296, 330],
      ['Medial meniscus', 60, 340, 205, 320], ['Lateral meniscus', 500, 340, 355, 320], ['Articular cartilage', 500, 160, 360, 292],
    ],
  };
}

function spine() {
  const ctrl = [[100, 262], [200, 250], [260, 262], [360, 292], [460, 300], [540, 286], [600, 262], [700, 250], [760, 262], [840, 300], [890, 322]];
  const X = y => { for (let i = 1; i < ctrl.length; i++) if (y <= ctrl[i][0]) { const [y0, x0] = ctrl[i - 1], [y1, x1] = ctrl[i]; return x0 + (x1 - x0) * (y - y0) / (y1 - y0); } return ctrl[ctrl.length - 1][1]; };
  let g = '';
  const vert = (y, w, h) => `<rect x="${X(y) - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h / 3}" fill="${BONE}" stroke="#A8966D" stroke-width="2"/>`;
  for (let i = 0; i < 7; i++) g += vert(140 + 18 * i, 30 + i, 14);
  for (let i = 0; i < 12; i++) g += vert(272 + 26 * i, 40 + i, 21);
  for (let i = 0; i < 5; i++) g += vert(590 + 38 * i, 58 + i * 2, 30);
  g += `<path d="M${X(770) - 32} 760 L${X(770) + 32} 760 L${X(830) + 14} 846 L${X(830) - 14} 846 Z" fill="${BONE2}" stroke="#A8966D" stroke-width="2"/>`;
  g += `<path d="M${X(860) - 10} 852 L${X(860) + 10} 852 L${X(885)} 888 Z" fill="${BONE}" stroke="#A8966D" stroke-width="2"/>`;
  g = `<ellipse cx="270" cy="62" rx="60" ry="46" fill="${BONE}" stroke="#A8966D" stroke-width="2"/><path d="M222 80 C230 112 262 112 276 92" fill="${BONE2}" stroke="#A8966D" stroke-width="2"/>` + g;
  return {
    id: 'spine', title: 'Vertebral column regions', vb: '0 0 560 900', svg: g,
    pins: [['Cranium (skull)', 470, 60, 332, 60], ['Cervical vertebrae', 470, 190, X(190) + 20, 190], ['Thoracic vertebrae', 470, 415, X(415) + 26, 415], ['Lumbar vertebrae', 470, 670, X(670) + 36, 670], ['Sacrum', 470, 790, X(790) + 28, 790], ['Coccyx', 470, 868, X(868) + 12, 868]],
  };
}

function muscle() {
  const fas = [[280, 210], [200, 160], [360, 160], [200, 270], [360, 270], [280, 110], [280, 310]];
  let g = `<circle cx="280" cy="210" r="196" fill="${MUSCLE}" stroke="${INK}" stroke-width="8"/>`;
  fas.forEach(([x, y], i) => { g += `<circle cx="${x}" cy="${y}" r="${i === 0 ? 62 : 50}" fill="#C98F78" stroke="#5a2f22" stroke-width="4"/>`; });
  const fibs = []; [[0, 0], [24, 0], [-24, 0], [12, 21], [-12, 21], [12, -21], [-12, -21], [0, 42], [0, -42], [36, 21], [-36, 21], [36, -21], [-36, -21]].forEach(([dx, dy]) => fibs.push([280 + dx, 210 + dy]));
  fibs.forEach(([x, y]) => { g += `<circle cx="${x}" cy="${y}" r="11" fill="#E8C2B1" stroke="#7a4636" stroke-width="2"/>`; });
  g += `<circle cx="450" cy="470" r="62" fill="#E8C2B1" stroke="#7a4636" stroke-width="6"/>`;
  for (let i = 0; i < 14; i++) { const a = i * 2.4, r = (i % 4) * 14 + (i ? 8 : 0); g += `<circle cx="${450 + Math.cos(a) * r}" cy="${470 + Math.sin(a) * r}" r="6" fill="#9b4b3a"/>`; }
  g += `<path d="M304 224 L402 440" stroke="${INK}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  g += `<ellipse cx="110" cy="640" rx="90" ry="40" fill="${MUSCLE}" stroke="${INK}" stroke-width="3"/><path d="M196 622 L300 632 L300 650 L196 658 Z" fill="#F2EAD8" stroke="${INK}" stroke-width="2"/><rect x="300" y="620" width="230" height="44" rx="20" fill="${BONE}" stroke="#A8966D" stroke-width="2"/>`;
  return {
    id: 'muscle', title: 'Muscle and tendon structure', vb: '0 0 560 720', svg: g,
    pins: [['Epimysium', 520, 90, 440, 120], ['Perimysium', 520, 190, 400, 182], ['Fascicle', 60, 210, 200, 210], ['Endomysium', 60, 340, 262, 252], ['Muscle fiber', 60, 100, 280, 210], ['Myofibril', 520, 340, 458, 470], ['Tendon', 150, 570, 248, 628], ['Bone', 410, 570, 410, 620]],
  };
}

export const LABEL_SETS = [longBone(), kneeSide(), kneeFront(), spine(), muscle()];

export function labelGame(app, id) {
  const S = LABEL_SETS.find(s => s.id === id) || LABEL_SETS[0];
  let selPin = null, selChip = null, done = new Set(), errors = 0, reveal = false;
  const bank = shuffle(S.pins.map((p, n) => ({ t: p[0], n })));
  function draw() {
    const solved = done.size === S.pins.length;
    app.innerHTML = `<a class="back" href="#/games">Games</a>
      <div class="page-head row between"><div><div class="eyebrow">Label the diagram</div><h2>${esc(S.title)}</h2></div>
        <div class="row"><span class="pill">${done.size} of ${S.pins.length} · ${errors} wrong</span><button class="btn ghost sm" id="rv">${reveal ? 'Hide answers' : 'Show answers'}</button><button class="btn ghost sm" id="rs">Restart</button></div></div>
      <div class="lbl-layout">
        <div class="diagram"><svg viewBox="${S.vb}" role="img" aria-label="${esc(S.title)}">${S.svg}
          ${S.pins.map((p, n) => `<g class="pin ${done.has(n) || reveal ? 'ok' : ''} ${selPin === n ? 'sel' : ''}" data-n="${n}">
            <line x1="${p[1]}" y1="${p[2]}" x2="${p[3]}" y2="${p[4]}" stroke="${INK}" stroke-width="2"/><circle cx="${p[3]}" cy="${p[4]}" r="4.5" fill="${INK}"/>
            <circle class="big" cx="${p[1]}" cy="${p[2]}" r="30"/><circle class="dot" cx="${p[1]}" cy="${p[2]}" r="17"/><text x="${p[1]}" y="${p[2] + 1}">${n + 1}</text></g>`).join('')}
        </svg></div>
        <div>
          <div class="panel"><h4>Words</h4><div class="bank-list">${bank.map(b => `<button class="chip ${selChip === b.n ? 'sel' : ''} ${done.has(b.n) ? 'used' : ''}" data-n="${b.n}">${esc(b.t)}</button>`).join('')}</div></div>
          <div class="panel"><h4>${solved ? 'All labelled' : 'Answers'}</h4><ol style="margin:0;padding-left:24px;font-size:15px">${S.pins.map((p, n) => `<li style="${done.has(n) || reveal ? 'color:var(--good);font-weight:600' : 'color:var(--text-muted)'}">${done.has(n) || reveal ? esc(p[0]) : '…'}</li>`).join('')}</ol></div>
          ${solved ? `<div class="panel dark" style="margin-top:12px"><div class="eyebrow">Done</div><h3>${errors} mistake${errors === 1 ? '' : 's'}</h3><div class="row" style="margin-top:12px"><button class="btn accent sm" id="rs2">Go again</button><a class="btn ghost sm" style="color:var(--cream);box-shadow:inset 0 0 0 1px #f4eee355" href="#/games">More games</a></div></div>` : '<p class="muted small" style="margin-top:12px">Tap a numbered pin, then tap its word. Or tap the word first.</p>'}
        </div>
      </div>`;
    $$('.pin', app).forEach(g => g.onclick = () => { const n = +g.dataset.n; if (done.has(n)) return; selPin = selPin === n ? null : n; try_(); });
    $$('.bank-list .chip', app).forEach(c => c.onclick = () => { const n = +c.dataset.n; selChip = selChip === n ? null : n; try_(); });
    $('#rv').onclick = () => { reveal = !reveal; draw(); };
    const rs = () => { selPin = selChip = null; done = new Set(); errors = 0; reveal = false; draw(); };
    $('#rs').onclick = rs; $('#rs2')?.addEventListener('click', rs);
  }
  function try_() {
    if (selPin !== null && selChip !== null) {
      if (selPin === selChip) done.add(selPin); else errors++;
      const bad = selPin !== selChip, bp = selPin; selPin = selChip = null; draw();
      if (bad) { const g = $(`.pin[data-n="${bp}"]`, app); g?.classList.add('bad'); setTimeout(() => g?.classList.remove('bad'), 500); }
    } else draw();
  }
  draw();
}
