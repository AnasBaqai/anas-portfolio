import { clamp, easeInOut, lerp, mulberry32 } from './math';

export const FORMATION_COUNT = 5;

/**
 * Where the subject sits and how big it is, per formation:
 * [x fraction of width, y fraction of height, scale fraction of min(w,h)].
 * The large horizontal swings are the point — the subject must visibly
 * traverse the viewport, not drift.
 */
export const JOURNEY = [
  [0.72, 0.5, 0.34], // 0 cloud (hero)
  [0.74, 0.48, 0.46], // 1 embedding field
  [0.28, 0.5, 0.44], // 2 pipeline — crosses to the far left
  [0.7, 0.52, 0.4], // 3 agent graph — back right
  [0.42, 0.44, 0.5], // 4 constellation — centre-left, largest
] as const satisfies readonly (readonly [number, number, number])[];

/**
 * Where the subject travels *after* the narrative ends.
 *
 * The narrative occupies only the first ~50% of the page; without this the
 * subject parked at JOURNEY[4] for the whole of Experience, Projects, Skills
 * and Contact. The first entry must equal JOURNEY[4] so the hand-off from
 * `journeyAt` to `epilogueAt` is seamless (asserted in formations.test.ts).
 *
 * There are five entries — one per formation — because the epilogue runs the
 * five formations in reverse (see `epilogueStage`), and a position keyframe has
 * to line up with each shape change or the two drift out of step.
 */
export const EPILOGUE = [
  [0.42, 0.44, 0.5], // hand-off — identical to JOURNEY[4]
  [0.8, 0.58, 0.36], // experience — swings right and down
  [0.18, 0.4, 0.3], // projects — crosses back to the far left
  [0.72, 0.5, 0.24], // skills — right again, smaller
  [0.45, 0.56, 0.18], // credentials / contact — settles small and low
] as const satisfies readonly (readonly [number, number, number])[];

/** Cluster centres for the constellation formation. Shared with the overlay. */
export const CLUSTERS = [
  [-0.62, -0.28],
  [0.05, 0.34],
  [0.66, -0.16],
] as const;

/** Rail offsets for the pipeline formation. Shared with the overlay. */
export const RAILS = [-0.42, 0, 0.42] as const;

/**
 * Build all five formations in normalised local space.
 * Deterministic for a given seed so reloads and SSR/CSR agree.
 */
export function buildFormations(n: number, seed = 1): Float32Array[] {
  const rand = mulberry32(seed);
  const forms = Array.from({ length: FORMATION_COUNT }, () => new Float32Array(n * 2));
  const [cloud, embed, pipeline, agent, constellation] = forms;

  for (let i = 0; i < n; i++) {
    const k = i * 2;

    // 0 · scattered cloud
    const a0 = rand() * Math.PI * 2;
    const d0 = Math.sqrt(rand()) * 0.95;
    cloud[k] = Math.cos(a0) * d0;
    cloud[k + 1] = Math.sin(a0) * d0 * 0.9;

    // 1 · embedding field — wider, denser toward the edge
    const a1 = rand() * Math.PI * 2;
    const d1 = Math.pow(rand(), 0.62);
    embed[k] = Math.cos(a1) * d1;
    embed[k + 1] = Math.sin(a1) * d1 * 0.82;

    // 2 · pipeline — three horizontal rails
    const rail = RAILS[i % 3];
    pipeline[k] = rand() * 2 - 1;
    pipeline[k + 1] = rail + (rand() - 0.5) * 0.07;

    // 3 · agent graph — router core plus seven tool clusters
    if (i < 18) {
      const a = rand() * Math.PI * 2;
      const d = rand() * 0.13;
      agent[k] = Math.cos(a) * d;
      agent[k + 1] = Math.sin(a) * d;
    } else {
      const tool = (i - 18) % 7;
      const a = -Math.PI / 2 + tool * ((Math.PI * 2) / 7);
      const spread = (Math.floor((i - 18) / 7) % 4) / 4 * 0.16;
      const r = 0.78 - spread;
      agent[k] = Math.cos(a) * r + (rand() - 0.5) * 0.1;
      agent[k + 1] = Math.sin(a) * r + (rand() - 0.5) * 0.1;
    }

    // 4 · constellation — three project clusters
    const [ccx, ccy] = CLUSTERS[i % 3];
    const a4 = rand() * Math.PI * 2;
    const d4 = Math.sqrt(rand()) * 0.3;
    constellation[k] = ccx + Math.cos(a4) * d4;
    constellation[k + 1] = ccy + Math.sin(a4) * d4 * 0.9;
  }

  return forms;
}

/** Split narrative progress into a formation index and an eased fraction. */
export function stageAt(progress: number): { index: number; frac: number } {
  const s = clamp(progress, 0, 1) * (FORMATION_COUNT - 1);
  const index = clamp(Math.floor(s), 0, FORMATION_COUNT - 2);
  return { index, frac: easeInOut(s - index) };
}

/**
 * Write the interpolated point buffer for the given stage into `out`.
 * Pure interpolation, never a simulation — this is what guarantees that
 * scrolling up morphs backwards exactly.
 */
export function interpolateInto(
  formations: Float32Array[],
  index: number,
  frac: number,
  out: Float32Array,
): void {
  const a = formations[index];
  const b = formations[index + 1];
  for (let i = 0; i < out.length; i++) out[i] = lerp(a[i], b[i], frac);
}

/**
 * The epilogue runs the five formations in REVERSE: constellation -> agents ->
 * pipeline -> embedding -> cloud, dissolving back to the shape the page opened
 * with. Returns the equivalent *narrative* progress, so the caller can reuse
 * `stageAt` and the overlay weights unchanged — the subject keeps morphing and
 * keeps its overlays instead of sitting frozen as three clusters.
 *
 * A sixth formation would have been the obvious alternative; the spec caps the
 * count at five because more than that reads as mush.
 */
export function epilogueStage(progress: number): number {
  return 1 - clamp(progress, 0, 1);
}

/**
 * Position and scale during the epilogue — the scroll past the narrative.
 * Same shape as `journeyAt`, keyed on a single 0..1 progress instead of a
 * formation index, because the formation no longer changes here.
 */
export function epilogueAt(
  progress: number,
  width: number,
  height: number,
): { cx: number; cy: number; scale: number } {
  const segments = EPILOGUE.length - 1;
  const s = clamp(progress, 0, 1) * segments;
  const index = clamp(Math.floor(s), 0, segments - 1);
  const frac = easeInOut(s - index);
  const a = EPILOGUE[index];
  const b = EPILOGUE[index + 1];
  const min = Math.min(width, height);
  return {
    cx: lerp(a[0], b[0], frac) * width,
    cy: lerp(a[1], b[1], frac) * height,
    scale: lerp(a[2], b[2], frac) * min,
  };
}

/** Position and scale of the whole subject in viewport pixels. */
export function journeyAt(
  index: number,
  frac: number,
  width: number,
  height: number,
): { cx: number; cy: number; scale: number } {
  const a = JOURNEY[index];
  const b = JOURNEY[index + 1];
  const min = Math.min(width, height);
  return {
    cx: lerp(a[0], b[0], frac) * width,
    cy: lerp(a[1], b[1], frac) * height,
    scale: lerp(a[2], b[2], frac) * min,
  };
}
