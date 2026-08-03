# Portfolio Website — Muhammad Anas

**Date:** 2026-08-03
**Status:** Approved (design locked)

## Purpose

A single-page portfolio for Muhammad Anas — Full-Stack & AI Engineer, Munich — aimed at
**EU/German recruiters and hiring managers**. It has to do two jobs at once: survive a
ten-second recruiter scan, and leave a technical reviewer convinced the person built the
things listed.

**Success criteria**
- Name, role, location, and work-authorisation status are readable without scrolling.
- The three headline outcomes (10h/week saved, 60% faster, 111 licensors) are visible above the fold.
- A recruiter can reach email/LinkedIn/GitHub/CV from any scroll position.
- Loads and animates at 60fps on a mid-tier phone.
- No dependency on a backend, database, or paid service.

**Non-goals**
- Blog, CMS, i18n, analytics, dark/light auto-detection beyond `prefers-color-scheme`.
- Contact form (explicitly declined — links only).
- Case-study detail pages.

## Content Source

All copy derives from `anas_two_pages.pdf` (the resume). No invented facts, metrics, or
employers. Where the site paraphrases for tone, the underlying claim must trace to a
resume line.

## Visual Design

**Direction:** Editorial / Swiss, dark by default, light mode available.

### Tokens

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0A0A0C` | `#FAFAF9` |
| `--surface` | `#111116` | `#FFFFFF` |
| `--ink` | `#F4F4F5` | `#09090B` |
| `--dim` | `#A1A1AA` | `#52525B` |
| `--faint` | `#8A8A94` | `#6A6A73` |
| `--line` | `#232329` | `#D4D4D8` |
| `--acc` (primary accent) | `#4F7CFF` | `#2563EB` |
| `--acc2` (secondary accent) | `#7CE0C3` | `#0F766E` |
| `--warn` | `#FBBF24` | `#D97706` |
| `--node` (canvas node fill) | `#0A0A0C` | `#FFFFFF` |

Light-mode `--faint` is deliberately darker than the dark-mode equivalent: at `#A1A1AA` on
`#FAFAF9` the canvas particles measured ~2.3:1 and washed out. This was caught and fixed
during mockup verification. Dark `--faint` was later raised from `#52525B` to `#8A8A94`
because the original measured 2.56:1 against `--bg`; it is used for body-sized labels in
eight components, which need 4.5:1, and it now measures 5.79:1. Light `--acc2` was darkened
from `#0D9488` to `#0F766E` because the original measured 3.59:1 and is used for body-sized
text in the project taglines and publication venue; it now measures 5.24:1. Light `--faint`
was later darkened again from `#71717A` to `#6A6A73` when the background texture landed: the
grain lifts the effective background, which cut `#71717A` to 4.55:1 — passing, but only
0.05 above the floor. `#6A6A73` restores the margin at 5.04:1 over the composited background.

`--warn` is used **only inside the aria-hidden canvas**, never as text, so the WCAG text
threshold does not apply to it. It is the one token deliberately below 4.5:1 in light mode.

### Background texture

Two fixed, decorative layers under everything (`body::before` and `body::after`, `z-index: 0`,
`pointer-events: none`, below the canvas at `z-1` and the content at `z-2`):

- **Grain** — one inline `feTurbulence` fractal-noise SVG, `--grain-opacity` (0.055 dark /
  0.05 light). No image file.
- **Dots** — a `radial-gradient` lattice in `--dot` at 26px, `--dot-opacity` 0.7.

Because text now sits on a composited background rather than the flat token, **every text
token is measured against the dominant composited background**, not against `--bg`. That
check is automated in `e2e/accessibility.spec.ts` and it fails if a texture opacity is
raised past the AA floor — verified by mutation. Light-mode grain is capped at 0.05 for this
reason: the 0.085 that looked best in the mockup pushed `--faint` to 4.51:1.

Measured cost: 0/222 frames over 16.7ms while scrolling the full page at 4× CPU throttle on
a 390×844 viewport. The layers are `fixed`, so they composite rather than repaint per frame.

Theme is driven by `data-theme` on `<html>`. Default dark; a header toggle flips it and
persists to `localStorage`. Initial value respects `prefers-color-scheme` when no stored
preference exists. **Every canvas colour is read from CSS custom properties via
`getComputedStyle`, re-cached on theme change** — one flip must drive DOM and canvas
together.

### Typography

- **Display / headings:** Archivo 900, uppercase, `letter-spacing: -0.05em`, `line-height: 0.9`, sized `clamp(2rem, 5.8vw, 4.9rem)`. (Reduced from a `6.6rem` cap — 106px read as oversized on a 1440px screen; 78px still holds three lines with the metrics above the fold.)
- **Body / UI:** Space Grotesk 400–600.
- **Accent:** Instrument Serif italic, used only for one emphasised word per heading, in `--acc2`.
- Loaded via `next/font/google` with `display: swap` and subset `latin`.

### Layout

Strict grid, generous whitespace, one hairline vertical rule as the only decoration.
Content max-width 1240px, horizontal gutter `6vw`. Body copy capped at 60–75 characters.

## The Signature Element: One Morphing Subject

This is the defining feature and the main implementation risk. A single full-viewport
`<canvas>`, `position: fixed`, `z-index: 1`, `pointer-events: none`, sitting behind the
content. It hosts **one particle system that never resets** — it transforms in place as
the user scrolls, and physically traverses the viewport.

### Formations

The same N particles interpolate between five formations, each built once in normalised
local space (−1..1) and rebuilt on resize:

| # | Formation | Meaning | Section |
|---|---|---|---|
| 0 | Scattered cloud | — | Hero |
| 1 | Embedding field | RAG / vector retrieval | 01 Retrieval |
| 2 | Three horizontal rails | Extraction pipeline | 02 Extraction |
| 3 | Router core + 7 tool nodes | Agent tool-calling loop | 03 Agents |
| 4 | Three clusters | Shipped projects | 04 Shipped |

Each formation carries an **overlay** drawn on top, weighted by proximity to that stage
(`w(n) = clamp(1 - |S - n|, 0, 1)`, where `S = progress × 4`):

- **Embedding:** nearest-neighbour links, a query vector orbiting, its neighbourhood lighting in `--acc2`.
- **Pipeline:** rails, three stage gates, packets flowing left→right; ~1 in 7 flagged `--warn` and rerouted upward — this represents "flags fields the model is unsure about" from the resume.
- **Agent:** spokes from core to tool nodes, call pulses travelling out in `--acc` and returning in `--acc2`.
- **Constellation:** dashed cluster hulls, intra-cluster links.

### Journey

The subject's `[x, y, scale]` is keyframed per stage and interpolated:

```
hero        [0.72, 0.50, 0.34]
retrieval   [0.74, 0.48, 0.46]
extraction  [0.28, 0.50, 0.44]   ← crosses to the far left
agents      [0.70, 0.52, 0.40]
shipped     [0.42, 0.44, 0.50]
```

Verified in the mockup: the rendered centroid moves 73% → 33% → 70% → 45% of viewport
width across the scroll, with the ink-pixel count changing at each depth. The
discriminating test for this feature is that **at 25%, 50% and 75% scroll depth the user
sees different shapes in different places** — not one shape recoloured. Any implementation
that fails that test has regressed.

### The epilogue

The narrative ends at `#story`, which is only ~50% of total scroll height. Originally
`narrativeProgress` clamped to 1 there, so the subject **parked for the entire second half of
the page** — Experience, Projects, Skills, Credentials and Contact all sat behind a frozen
shape. `EPILOGUE` continues the journey past that point:

```
hand-off     [0.42, 0.44, 0.50]   ← identical to JOURNEY[4], so there is no jump
experience   [0.80, 0.58, 0.36]
projects     [0.18, 0.40, 0.30]   ← crosses back to the far left
skills       [0.72, 0.50, 0.24]
contact      [0.45, 0.56, 0.18]   ← settles small and low
```

**The epilogue also keeps morphing**, by running the five formations in reverse —
constellation → agents → pipeline → embedding → cloud — dissolving back to the shape the page
opened with. A first attempt moved the subject but left the formation frozen at the
constellation, so it read as "three circles sliding around"; travel alone is not enough. Note
that this needs no sixth formation, which the risks section rules out.

There is one `EPILOGUE` position keyframe per formation so shape changes and position changes
stay in step. Overlays follow the same reversed stage, so each formation keeps its own overlay
on the way back. Still a pure function of `scrollY`; the subject shrinks throughout so it
recedes as the reader moves into the CV proper.

Guarded by two e2e tests: a seamless hand-off, and one asserting **both** traversal (>0.3
centroid spread) **and** shape change (>2× ink ratio). The shape assertion exists because the
first version of that test checked position only and therefore passed while the formation was
frozen — the regression the user actually reported. Both were mutation-tested: disconnecting
`epilogueAt` fails the first, re-freezing the formation fails the second.

### Scrub semantics

Particle position is a **pure function of scroll offset** — interpolation between
formations, never a physics simulation or a one-shot trigger. Scrolling up must morph
backwards exactly. A small sinusoidal idle drift (±0.012 local units) keeps it breathing
when the user stops, and is the only non-deterministic component.

### No scroll hijacking

The page does **not** pin sections or intercept scroll. The canvas is `fixed` and reads
`scrollY`; sections scroll normally. This is what makes the effect safe on touch devices —
native scroll momentum is never fought.

## Mobile

The animation runs on mobile — it is not disabled. Adaptations:

- Particle count: **180 desktop → 90 on viewports under 768px**.
- The O(n²) nearest-neighbour loop in the embedding overlay is the one real performance
  hazard (180 particles = ~16k pair checks per frame). Mitigation: compute links on a
  **uniform spatial grid** (bucket size = link radius, check own + adjacent buckets), and
  recompute links at 20fps rather than every frame while drawing them every frame.
- Canvas backing store capped at `devicePixelRatio ≤ 2`.
- Text panels stack full-width; the alternating left/right layout collapses to left-aligned.
- The act panels' enter/exit slide is capped at **6% of viewport width**. A flat 70px offset
  was 18% of a 390px phone and pushed the copy past both screen edges while it faded in.
  Desktop is unaffected (6% of 1440px exceeds the 70px cap).
- The progress spine is hidden below 900px.
- The `requestAnimationFrame` callback early-returns when `document.hidden` is true. The
  canvas is `fixed inset-0`, so it has no off-screen state — an IntersectionObserver would
  be dead code.

**Performance budget:** 60fps on a mid-tier Android device. If the spatial-grid
optimisation does not get there, the fallback is reducing mobile particle count further
(90 → 60) — *not* disabling the morph, since the animation working on mobile is an
explicit requirement.

## Accessibility

- `prefers-reduced-motion: reduce` → the canvas renders the formation for the current
  section **statically** (no morph interpolation, no idle drift, no overlay animation),
  and panel reveals become instant. Content is never hidden behind motion.
- The canvas is decorative: `aria-hidden="true"`, no text conveyed only through it.
- All content is in the DOM and readable with JavaScript disabled — panels default to
  `opacity: 1` in CSS, and the scroll script only *takes over* opacity once it runs.
- Contrast: body text ≥4.5:1, large text ≥3:1, in **both** themes, verified independently.
- Visible focus rings on every interactive element. Keyboard-reachable in visual order.
- Heading hierarchy `h1 → h2 → h3`, no skipped levels.

## Page Structure

1. **Header** — name mark, anchor nav, theme toggle, CV download. Sticky, backdrop-blurred.
2. **Hero** — eyebrow (Munich, EU Blue Card eligible), masked line-reveal headline, one-paragraph summary, three metrics, scroll cue.
3. **Narrative** (the four morph acts) — Retrieval, Extraction, Agents, Shipped. Each carries real copy and tech chips from the resume.
4. **Experience** — Redseven Entertainment (ProSiebenSat.1), Arcpeak, Boardd, WorkSpin. Reverse chronological, outcome-first bullets.
5. **Projects** — InsightQL, bugSage, CLI Assistant.
6. **Skills** — grouped as on the resume (Languages, AI & LLM, Backend, Frontend, Databases, Cloud & DevOps, Practices).
7. **Education & Publication** — Passau MSc, FAST-NUCES BS, the IEEE 6G paper.
8. **Contact** — plain links only: email, phone, LinkedIn, GitHub, CV download. No form, no backend.
9. **Footer** — languages (English C1, German A1), work authorisation, copyright.

## Architecture

**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v4. Deployed to Vercel.

**No GSAP.** The mockup proved a hand-rolled `requestAnimationFrame` loop reading `scrollY`
delivers the full effect. GSAP + ScrollTrigger would be ~50KB gzipped to replace roughly 60
lines of arithmetic we have already written and verified. If a future section genuinely
needs pinning or timeline sequencing, revisit then.

**Runtime dependencies beyond Next/React/Tailwind: none.** Icons inline as SVG.

### Modules

| Module | Responsibility | Depends on |
|---|---|---|
| `content/resume.ts` | Every string and number on the site, typed. Single source of truth. | — |
| `lib/theme.ts` | Read/write `data-theme`, persist to `localStorage`, expose a subscribe hook. | — |
| `lib/scroll.ts` | One shared rAF loop + scroll-progress calculation. Consumers register callbacks. | — |
| `lib/formations.ts` | Build the five formations in normalised space for a given N and aspect. Pure, no canvas. | — |
| `lib/overlays.ts` | Draw functions, one per overlay, each `(ctx, state, weight, colors) => void`. Pure draw, no state. | — |
| `components/Subject.tsx` | Owns the canvas, the particle array, theme colour cache, and the draw loop. | scroll, formations, overlays, theme |
| `components/Act.tsx` | One narrative act: panel copy + scroll-driven enter/exit. | scroll |
| `components/*` | Header, Hero, Experience, Projects, Skills, Contact, Footer — presentational, read from `resume.ts`. | content |

`formations.ts` and `overlays.ts` are pure and independently testable — that is the point
of splitting them out of the canvas component. `Subject.tsx` is the only module that
touches canvas state, and it stays small enough to hold in one screen.

### Testing

The animation is visual and not usefully unit-tested end to end, but the arithmetic under
it is:

1. **`formations.test.ts`** — every formation returns exactly N points, all within the
   normalised bounds, deterministic for a fixed seed.
2. **`scroll.test.ts`** — progress is monotonic in `scrollY`, clamps to `[0,1]`, and
   `stageAt(p)` round-trips: interpolating to stage *n* and back yields the original
   positions (this is the property that guarantees scrubbing backwards works).
3. **One Playwright check** — load the page, sample scroll depths 25/50/75%, assert the
   canvas centroid differs by >15% of viewport width between samples and the ink-pixel
   count differs. This is the automated form of "different shapes in different places",
   and it is the regression guard for the whole feature.

Contrast ratios and reduced-motion behaviour are verified manually against the checklist,
in both themes.

### Error handling

There is no network, no user input, and no persistence beyond a theme string, so the
failure surface is small:

- **Canvas unavailable / context creation fails:** the canvas element is skipped entirely; the site is fully readable without it.
- **`localStorage` throws** (private mode): fall back to `prefers-color-scheme`, do not persist.
- **Fonts fail to load:** `display: swap` with a system-sans fallback stack; layout must not shift more than CLS 0.1.
- **Resize / orientation change:** formations and canvas backing store rebuild; debounced to 150ms.

## Open Risks

1. **Mobile performance** is the one genuine unknown. Mitigations are specced above; the
   escape hatch is fewer particles, never a disabled animation.
2. **The morph must stay legible.** Five formations in one system is close to the ceiling —
   adding a sixth is likely to make each one read as mush. Treat five as fixed.
