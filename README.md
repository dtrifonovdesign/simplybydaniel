# Simply

Portfolio site for Simply (brand design by Daniel). Vite + Three.js + GSAP + Lenis.

    npm install
    npm run dev       # http://localhost:5173  (add ?skip to bypass the intro)
    npm run build     # outputs dist/

## Where things live
- `src/poses.js`  the 3D mark choreography. Each `data-pose="name"` section in index.html maps to a pose; edit numbers to change how the mark moves.
- `src/scene.js`  the Three.js scene (extruded mark built from the BRAND.md geometry).
- `src/main.js`   intro, smooth scroll, reveals, pointer effects.
- `public/images/daniel-1.jpg`, `daniel-2.jpg`  drop your photos here; the placeholders disappear automatically.
- Contact form sends through FormSubmit to `dtrifonovmn@gmail.com` (set in index.html).

## Mobile vs desktop
Under 860px: native scroll, no cursor effects, lower-poly mark, lower pixel ratio, mark fades behind text.
Fine pointer + wide screen: Lenis smooth scroll, cursor tilt, scroll-velocity spin, tilt cards.
`prefers-reduced-motion`: no intro, no spin or idle motion.

## Contact form
`#contact-form` in index.html has `data-endpoint="https://formsubmit.co/ajax/<email>"`, so submissions are POSTed as JSON to FormSubmit and emailed to that address. The first submission triggers an activation email that must be confirmed once. If `data-endpoint` is emptied, the form falls back to opening the visitor's email app (mailto).

## Performance and quality tiers

The site picks how heavily to draw itself, so weaker machines still get the full design in a lighter form.

- `src/perf.js` guesses a tier (`high`, `medium`, `low`) from the device, then watches the real frame rate and
  steps down if the page can't keep up. It never steps back up in the same visit, and remembers a step-down
  (in `localStorage`, 14 days) so a weak machine starts at the right tier next time.
- A tier sets the 3D pixel budget and pixel ratio, geometry detail, and whether the SVG wobble filters, the
  cursor blend mode, the frosted nav and Lenis smooth scrolling are on. The settings live in `CONFIG` at the top
  of `perf.js`.
- `src/scroll.js` holds one shared, time-smoothed scroll value that the 3D pose, the path walk, the lit chips and
  the flying wordmark all read.

Testing helpers (add to the URL):

- `?perf` shows a live readout: tier, fps, frame time, pixel ratio and canvas size.
- `?tier=low|medium|high` forces a tier and turns the automatic monitor off.
- In the console, `__perf.stepDown()` or `__perf.set('low')` switches tier live. To reset a remembered step-down:
  `localStorage.removeItem('simply-tier')`.
- Real-world check: Chrome DevTools > Performance > CPU throttling (4x or 6x slowdown) with `?perf`.
