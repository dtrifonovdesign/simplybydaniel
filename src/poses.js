// Choreography for the 3D mark. Each pose is anchored to a DOM element with
// data-pose="name". As the anchor passes the middle of the viewport the mark
// eases from one pose to the next.
//
// Process steps (p1..p6) are different: each one holds the page still (sticky), and
// has a start state ("from") and an end state (the pose itself). Scrolling while the
// step is held moves the mark steadily from the start state to the end state, so every
// wheel tick advances that step's animation.
//
// x, y        position as -1..1 of the viewport (x right, y up)
// s           scale
// rx ry rz    whole-mark rotation (radians)
// tx ty tz / trx try trz   top half offset (world units) and own rotation
// bx by bz / brx bry brz   bottom half offset and own rotation
// dark        1 while the page is on the ink background (top half turns cream)
// a           canvas opacity
// solid       opacity of the solid body (0 = only the pencil lines show)
// sketch      0..1 pencil outline drawn on
// flat        0..1 mark flattens to a vector shape
// vec         0..1 vector tools (artboard, handles, anchors) drawn on
// deck        0..1 other brands' logos cascade in behind the mark
// files       0..1 file variants export out
// pull        0..1 how strongly the halves lean toward the cursor
// merge       0..1 other brands' logos get drawn into the mark
// orbit       0..1 the halves leave their pose and circle Daniel's head instead
// sit         0..1 Daniel (side view) sits on the top edge of the ink half
// sitB        0..1 Daniel (smiling, front view) sits on it in About
// m           overrides on mobile
// from        start state of a held step: { pose: 'name' } starts from another pose's end state,
//             any other keys override it

const PI = Math.PI;
const TAU = PI * 2;

export const DEFAULT = {
  x: 0, y: 0, s: 1,
  rx: 0, ry: 0, rz: 0,
  tx: 0, ty: 0, tz: 0, trx: 0, try: 0, trz: 0,
  bx: 0, by: 0, bz: 0, brx: 0, bry: 0, brz: 0,
  dark: 0, a: 1,
  solid: 1, sketch: 0, flat: 0, vec: 0, deck: 0, files: 0,
  pull: 0.55, merge: 0, orbit: 0, sit: 0, sitB: 0,
};

const MP = { x: 0, y: 0.5, s: 1.1, a: 0.3 };
// Phone: the drawing steps sit lower and a little smaller, so the art clears the nav and ends above the text
const MPD = { ...MP, y: 0.41, s: 0.95 };

export const poses = {
  // Open on the right, tilted, halves just touching.
  hero: { x: 0.42, y: -0.24, s: 0.98, rx: 0.1, ry: -0.35, pull: 1.4, sit: 1,
    m: { x: 0, y: 0.2, s: 1.0 } },

  // The halves slide to opposite edges around "Brands, made simply."
  split: { x: 0, y: 0, s: 1.4, ry: 0,
    tx: 3.4, ty: 0.7, try: -0.7, trz: 0.12,
    bx: -3.4, by: -0.7, bry: 0.7, brz: 0.12,
    m: { s: 1.5, tx: 1.5, bx: -1.5, ty: 1.6, by: -1.6, a: 0.45 } },

  // 01 Words: the halves part more and more, leaving room for the brief.
  p1: { x: -0.5, y: 0, s: 1.0, rx: 0.1, ry: 0.9, ty: 0.9, by: -0.9, dark: 1, m: MP,
    from: { ry: -0.1, ty: 0.12, by: -0.12, rx: 0 } },

  // 02 Research: other brands' logos cascade in one by one behind the mark.
  p2: { x: -0.62, y: 0.02, s: 0.95, rx: 0.06, ry: TAU + 0.55, deck: 1, dark: 1, m: { ...MP, x: -0.3, y: 0.5, s: 0.85, a: 0.55 },
    from: { pose: 'p1', deck: 0, ry: TAU - 0.1, ty: 0, by: 0 } },

  // 03 Sketch: the other logos fold into the mark, then it turns into a pencil drawing.
  p3: { x: -0.5, y: 0, s: 1.05, ry: TAU, solid: 0.04, sketch: 1, dark: 1, pull: 0, merge: 1, m: MPD,
    from: { pose: 'p2', deck: 0, merge: 1, ry: TAU + 0.25, solid: 1, sketch: 0 } },

  // 04 Digital design: the drawing is rebuilt as a flat vector with design-tool handles.
  p4: { x: -0.5, y: 0, s: 1.05, ry: TAU, solid: 1, sketch: 1, flat: 1, vec: 1, dark: 1, pull: 0, m: MPD,
    from: { pose: 'p3', merge: 0, solid: 0.04, sketch: 1, flat: 0, vec: 0 } },

  // 05 Finish: it gains depth again and exports into the file set, one by one.
  p5: { x: -0.34, y: 0.3, s: 0.72, rx: -0.08, ry: TAU + 0.35, files: 1, dark: 1,
    m: { ...MP, y: 0.5, s: 0.82 },
    from: { pose: 'p4', files: 0, vec: 1, flat: 1, ry: TAU } },

  // 06 System: the copies fold away and the halves part to the top and bottom of the screen,
  // framing the empty middle where the flat lockup flies in from the corner.
  p6: { x: -0.46, y: 0, s: 1.0, ry: TAU + 0.1, rx: 0, ty: 1.4, by: -1.5, dark: 1, m: { ...MP, a: 0 },
    from: { pose: 'p5', a: 1 } },

  // Case studies: the halves sit apart like an open book, waiting.
  cases: { x: 0.62, y: 0.05, s: 0.85, ry: TAU + 0.25,
    tx: 0.7, ty: 0.95, try: -0.6, bx: -0.2, by: -0.95, bry: 0.6,
    m: { x: 0, y: 0.55, s: 1, a: 0.22 } },

  // About: small and out of the way, still watching the cursor.
  about: { x: -0.48, y: -0.42, s: 0.66, rx: 0.05, ry: TAU - 0.18, pull: 0.8, sitB: 1,
    m: { x: 0, y: -0.12, s: 1.0, a: 1 } },

  // Contact: one full turn, closes up, centered.
  contact: { x: -0.46, y: 0.02, s: 1.0, ry: TAU * 2, pull: 0.8,
    m: { x: 0, y: 0.5, s: 1.15, a: 0.5 } },
};

function endState(name, mobile) {
  const p = poses[name] || {};
  const merged = { ...DEFAULT, ...p };
  if (mobile) {
    if (p.m) Object.assign(merged, p.m);
    else { merged.x *= 0.3; merged.a = Math.min(merged.a, 0.35); }
  }
  delete merged.m;
  delete merged.from;
  return merged;
}

// variant 'end' (default) is the pose itself; 'from' is the start state of a held step.
export function resolvePose(name, mobile, variant = 'end') {
  const end = endState(name, mobile);
  const f = (poses[name] || {}).from;
  if (variant !== 'from' || !f) return end;
  const { pose, ...over } = f;
  const start = pose ? endState(pose, mobile) : end;
  return { ...end, ...start, ...over };
}

export const hasFrom = (name) => !!(poses[name] && poses[name].from);
