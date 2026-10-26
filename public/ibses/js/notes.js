import { esc } from './util.js';
import { DECKS, GROUPS, ACTS } from './data.js';

export function notesView(app) {
  const deck = id => DECKS.find(d => d.id === id);
  app.innerHTML = `<div class="page-head"><div class="eyebrow">Reference</div><h1>All the notes</h1><p class="lead">Every card on one page. Read it through once before you start.</p></div>
    <div class="notes">
    ${GROUPS.map(g => g.ids.map(id => { const d = deck(id); return `<h3>${esc(d.title)} <span class="muted small" style="font-family:var(--body);font-weight:400">Lesson ${d.lesson}</span></h3>
      <table><tbody>${d.cards.map(c => `<tr><td>${esc(c[0])}</td><td>${esc(c[1])}</td></tr>`).join('')}</tbody></table>`; }).join('')).join('')}
    <h3>Planes and axes: the 12 activities</h3>
    <table><thead><tr><th>Activity</th><th>Plane</th><th>Axis</th></tr></thead><tbody>${ACTS.map(a => `<tr><td>${esc(a[0])}</td><td>${a[1]}</td><td>${a[2]}</td></tr>`).join('')}</tbody></table>
    <h3>Paper 2 practice answer</h3>
    <div class="card"><p><b style="color:var(--ink)">Distinguish anatomically between the axial and appendicular skeleton in terms of function.</b></p>
    <p>The axial skeleton protects organs (the cranium protects the brain, the rib cage protects the heart and lungs, the vertebrae protect the spinal cord) and supports the body (vertebrae get larger toward the pelvis to carry the upper body). It also gives attachment points for muscles, such as the breathing muscles on the ribs.</p>
    <p>The appendicular skeleton allows movement through the arm and leg bones, which are attachment points for the muscles that move them. It supports the body (lower body bones are larger), forms blood cells in the red marrow of long bones like the femur and humerus, and stores calcium and phosphorus.</p></div>
    </div>`;
}
