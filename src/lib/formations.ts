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
