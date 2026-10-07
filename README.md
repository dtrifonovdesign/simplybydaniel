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
- Contact email is a placeholder (`hello@simplybydaniel.com`) in index.html.

## Mobile vs desktop
Under 860px: native scroll, no cursor effects, lower-poly mark, lower pixel ratio, mark fades behind text.
Fine pointer + wide screen: Lenis smooth scroll, cursor tilt, scroll-velocity spin, tilt cards.
`prefers-reduced-motion`: no intro, no spin or idle motion.

## Contact form
`#contact-form` in index.html has `data-endpoint=""`. Leave it empty and the form opens the visitor's email app (mailto). To send without an email app, put a form service URL there (for example a Formspree endpoint) and it will POST JSON `{ email, message }`.
