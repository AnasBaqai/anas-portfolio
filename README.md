# Muhammad Anas — Portfolio

Single-page portfolio. Next.js App Router, TypeScript, Tailwind v4, no animation library.

## Develop

    npm install
    npm run dev

## Test

    npm test        # Vitest — pure animation and content modules
    npm run test:e2e  # Playwright — scroll morph and accessibility

## Architecture

All resume content lives in `src/content/resume.ts`, and components never paraphrase it.
Section labels and other UI chrome are inline.

The signature animation is one particle system that morphs across five formations
and traverses the viewport, driven purely by scroll offset. It is split into pure,
testable modules — `lib/formations.ts`, `lib/neighbors.ts`, `lib/overlays.ts`,
`lib/scroll.ts` — with exactly one stateful component, `components/Subject.tsx`.

Particle position is a pure function of scroll offset, never a simulation. That is
what makes scrolling backwards reverse the morph exactly, and it is covered by a
Playwright regression test.

See `docs/superpowers/specs/2026-08-03-portfolio-website-design.md` for the full design.
