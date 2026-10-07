# Simply: Brand Guidelines

Brand design by Daniel · simplybydaniel · v1

## For Claude Code

Read this file before designing or building anything for Simply. Rules:

- Use only the colors, fonts, radii and motion tokens defined in `assets/brand.css`. Import that file; don't redefine tokens.
- Three fonts, three jobs: Fraunces (wordmark only), Bricolage Grotesque (headings), Figtree (body and UI). Never swap or add a fourth.
- Every corner is soft. No sharp 90° corners on cards, buttons, images or icons.
- Use the SVGs in `assets/logo/`. Never redraw the mark.
- Items marked **(decided)** came from design review. Items marked **(proposed)** are sensible defaults and can be changed.

## 1. Brand

| | |
|---|---|
| Name | Simply (written with a capital S) |
| Domain | simplybydaniel |
| What it is | Brand design: logos, brand kits, websites |
| Personality | Premium, modern, soft-edged, quietly confident |
| Idea | Simple but ownable. One clear idea per element. |
| Tagline | Not decided. Sample copy used in mockups: "Brands that feel simple and refined." |

## 2. Logo (decided)

The mark is an S built from two solid rounded half-discs separated by a clear gap. The top half bulges left with its flat side on the right and is ink. The bottom half bulges right with its flat side on the left and is brass. **The direction matters: never mirror or rotate the mark.**

### Files (`assets/logo/`)

| File | Use |
|---|---|
| `mark.svg` | Default mark on cream, sand or white |
| `mark-reversed.svg` | On ink or other dark backgrounds |
| `mark-mono-ink.svg` | One-color use (stamps, print, embossing) on light backgrounds |
| `mark-mono-cream.svg` | One-color use on dark backgrounds |
| `app-icon.svg` | Favicon, app icon, social avatar (ink rounded square) |

### Geometry (viewBox 0 0 100 100)

```
Top half (ink):    M48 10H75A5 5 0 0 1 80 15V41A5 5 0 0 1 75 46H48A18 18 0 0 1 48 10Z
Bottom half (brass): M52 54H25A5 5 0 0 0 20 59V85A5 5 0 0 0 25 90H52A18 18 0 0 0 52 54Z
```

Each half is 36 units tall with an 18-unit semicircular end and 5-unit corner radius. The gap between halves is 8 units. Keep it; the gap was chosen over a tight gap and no gap.

### Lockup

Mark on the left, wordmark on the right, vertically centered.

- Mark is a 1em square (same size as the wordmark font-size).
- Gap between mark and wordmark is 0.2em.
- Wordmark: Fraunces, weight 600, `font-variation-settings: "opsz" 144, "SOFT" 100, "WONK" 0`, letter-spacing 0.03em.
- Build the lockup in HTML and CSS (class `.logo-lockup`), not as a flattened image, so the font stays crisp.

```html
<a class="logo-lockup" href="/" aria-label="Simply home" style="--logo-size: 28px">
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <path class="mark-top" d="M48 10H75A5 5 0 0 1 80 15V41A5 5 0 0 1 75 46H48A18 18 0 0 1 48 10Z"/>
    <path class="mark-bottom" d="M52 54H25A5 5 0 0 0 20 59V85A5 5 0 0 0 25 90H52A18 18 0 0 0 52 54Z"/>
  </svg>
  <span class="wordmark">Simply</span>
</a>
```

On dark sections, wrap in `.theme-ink` and the top half switches to cream automatically.

### Space and size (proposed)

- Clear space: half the mark's width on all sides.
- Minimum lockup size: 24px font-size. Minimum standalone mark: 16px. Below that, use `app-icon.svg`.
- Standard nav lockup: 26–28px.

### Don't

- Don't mirror, rotate, stretch or outline the mark.
- Don't change the gap, the colors or the corner radii.
- Don't set the wordmark in any font other than Fraunces.
- Don't place the full-color mark on photos or busy backgrounds. Use a mono version on a calm area.
- Don't add shadows, gradients or effects.

## 3. Color (decided)

| Token | Hex | Role |
|---|---|---|
| `--cream` | `#F4EEE3` | Default page background |
| `--sand` | `#EBE3D3` | Cards and surfaces |
| `--ink` | `#1A1816` | Headings, logo, primary buttons, dark sections |
| `--ink-soft` | `#3D3832` | Body text |
| `--stone` | `#5C554B` | Secondary and muted text |
| `--brass` | `#B8935A` | Accent: logo half, thin rules, icons and decorative shapes |

Rough proportions: cream 60%, ink and sand 35%, brass under 5%. Brass is a highlight, not a theme color.

### Contrast (WCAG)

| Pair | Ratio | OK for |
|---|---|---|
| Ink on cream | 15.3 | All text |
| Ink on sand | 13.9 | All text |
| Ink-soft on cream | 10.1 | Body text |
| Stone on cream | 6.4 | Body and small text |
| Stone on sand | 5.8 | Body and small text |
| Cream on ink | 15.3 | All text |
| Brass on ink | 6.2 | Text and icons on dark backgrounds |
| Ink on brass | 6.2 | Text on brass buttons |
| Brass on cream | 2.5 | **Decorative only, never text** |
| Brass on sand | 2.2 | **Decorative only, never text** |

Because brass is low-contrast on light backgrounds, never rely on it alone to show state, links or required information.

## 4. Typography (decided)

| Role | Font | Weight | Notes |
|---|---|---|---|
| Wordmark | Fraunces | 600 | Logo only. Optical size 144, softness 100, wonk 0, tracking 0.03em. |
| Headings | Bricolage Grotesque | 600 | Tight tracking, sentence case. |
| Body and UI | Figtree | 400 / 500 / 600 | 400 body, 500 buttons and links, 600 emphasis. |

Fraunces is not used for headings or body text. Both Bricolage and Figtree load from Google Fonts in `brand.css`; self-host them in production for speed.

### Scale (proposed; tokens in `brand.css`)

| Style | Size | Line height | Tracking |
|---|---|---|---|
| Display | clamp 44px–88px | 1.02 | -0.04em |
| H1 | clamp 36px–64px | 1.05 | -0.035em |
| H2 | clamp 28px–44px | 1.1 | -0.03em |
| H3 | clamp 20px–28px | 1.15 | -0.02em |
| H4 | 20px | 1.2 | -0.01em |
| Lead | 18px | 1.6 | 0 |
| Body | 16px | 1.6 | 0 |
| Small | 14px | 1.5 | 0 |
| Eyebrow | 12px, uppercase, weight 500 | 1.4 | 0.14em |

Body line length 60–75 characters. Headings in sentence case.

## 5. Shape and surfaces (decided: soft corners; values proposed)

| Element | Radius |
|---|---|
| Buttons, tags, pills | 999px (fully round) |
| Cards | 24px |
| Inner panels, images, inputs | 16px |
| Small chips, focus outlines | 12px |
| App icon | 28% of its width |

- Borders: 1px at `rgba(26,24,22,0.12)`. Prefer a fill change over a border.
- Shadows: avoid. If needed, one soft, low-opacity shadow, never a hard or dark one.
- Cards use sand on cream pages. Inner panels use cream on sand cards.

## 6. Components (classes in `brand.css`)

- **Primary button** `.btn.btn--primary`: ink pill, cream text, Figtree 500 at 14px, min height 44px.
- **Secondary button** `.btn.btn--secondary`: transparent with 1px ink border, fills ink on hover.
- **Accent button** `.btn.btn--accent`: brass fill with **ink** text. Use rarely, once per view at most.
- **Link**: inherits text color, underlined, offset 3px. Medium weight in nav and CTAs.
- **Card** `.card` with `.card__stage` for an inner panel.
- **Nav**: lockup left, links right in Figtree 14px, one primary button. Sticky nav on cream with a 1px bottom line once scrolled.
- **Eyebrow** `.eyebrow` above section headings.
- **Focus**: 2px ink outline, 3px offset (cream on dark sections). Never remove it.

## 7. Layout (proposed)

- Max content width 1200px, side gutters `clamp(20px, 5vw, 56px)`.
- 8px spacing scale (`--space-1` through `--space-10`). Section padding 96–128px on desktop, 64px on mobile.
- Lots of whitespace. One idea per section. Maximum two columns of text.
- Alternate cream sections with one dark `.theme-ink` section for rhythm. Keep dark sections to roughly one in four.
- Mobile first. Tap targets at least 44px.

## 8. Motion

The site will have a lot of animation. Keep it calm, precise and soft: things slide, fade and settle. Nothing bounces or flashes.

### Tokens (decided easing, proposed durations)

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` (default for everything) |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` (loops and long moves) |
| `--dur-fast` | 200ms (hover, press) |
| `--dur-base` | 400ms (menus, small reveals) |
| `--dur-slow` | 700ms (scroll reveals) |
| `--dur-hero` | 1000ms (signature moves) |

### Rules

- Animate `transform` and `opacity` only. No animating width, height, top or left.
- Scroll reveals: fade up 16px, 700ms, stagger siblings by 60ms (`.reveal` with `--i`). Trigger once with IntersectionObserver.
- Hover: buttons rise 1px; cards may lift 2–4px. No scale above 1.03.
- Respect `prefers-reduced-motion` (already handled in `brand.css`; keep it).
- Never auto-play motion that loops forever near body text.

### Signature move: the halves close the gap

The two halves of the mark are the brand's motion language. The top half slides in from the right and the bottom half from the left, then settle into place.

- **Logo reveal**: add `.logo-reveal` to the lockup. Top half 1000ms, bottom half 100ms later, wordmark fades up 12px starting at 500ms.
- **Page loader**: the halves slide apart and back together on a loop (ease-in-out, 1.6s) while loading.
- **Scroll hero**: the two halves, drawn large, move in opposite horizontal directions as the user scrolls, meeting at the section edge.
- **Section transitions**: a soft rounded-corner shape wipes across the screen using the mark's half-disc form.

The halves must always keep the gap and the S reading correctly at rest.

## 9. Voice (proposed)

Calm, clear, confident. Short sentences. Plain words over jargon. No exclamation marks, no hype, no filler like "unlock" or "elevate". Say what it is and what the person gets.

## 10. Accessibility

- Body text meets 4.5:1 (see the contrast table). Never use brass for text on light backgrounds.
- Keyboard focus is always visible.
- Logo `aria-label` or `<title>` reads "Simply". Decorative marks use `aria-hidden="true"`.
- All motion has a reduced-motion fallback.
- Use real `<button>`, `<a>`, `<input>` + `<label>` elements.

## 11. Not decided yet

- Tagline and final homepage copy
- Photography and illustration style
- Icon set (if needed, match the soft corners and a 1.5px stroke)
- Dark mode as a full theme (the `.theme-ink` section style exists)
- Print and social templates

## 12. Quick start

```html
<link rel="stylesheet" href="/assets/brand.css">

<header class="container" style="padding-block: 20px">
  <a class="logo-lockup logo-reveal" href="/" aria-label="Simply home" style="--logo-size: 28px">
    <!-- svg from the lockup snippet above -->
    <span class="wordmark">Simply</span>
  </a>
</header>

<section class="container" style="padding-block: var(--space-10)">
  <p class="eyebrow reveal">Brand design</p>
  <h1 class="reveal" style="--i: 1">Brands that feel simple and refined.</h1>
  <p class="lead reveal" style="--i: 2">Logos, brand kits and websites for companies that want to look established from day one.</p>
  <a class="btn btn--primary reveal" style="--i: 3" href="#contact">Start a project</a>
</section>
```

Add the small IntersectionObserver that adds `.is-visible` to `.reveal` elements when they enter the viewport.
