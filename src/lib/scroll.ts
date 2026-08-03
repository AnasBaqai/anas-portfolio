import { clamp } from './math';

/** Progress through the narrative, 0 at startY and 1 at endY. */
export function narrativeProgress(scrollY: number, startY: number, endY: number): number {
  const span = endY - startY;
  if (span <= 0) return 0;
  return clamp((scrollY - startY) / span, 0, 1);
}

/**
 * Opacity for one narrative panel, from its bounding-rect top.
 * Ramps in, holds across the middle so the copy is actually readable, ramps out.
 * A pure function of scroll position — scrolling back up reverses it exactly.
 */
export function panelVisibility(
  rectTop: number,
  rectHeight: number,
  viewportHeight: number,
): number {
  // q: 0 as the act enters from the bottom, 1 as it leaves the top
  const q = clamp((viewportHeight - rectTop) / (viewportHeight + rectHeight), 0, 1);
  return clamp(Math.min((q - 0.12) / 0.2, (0.88 - q) / 0.2), 0, 1);
}

type FrameCallback = (scrollY: number, timeSeconds: number) => void;

const callbacks = new Set<FrameCallback>();
let rafId = 0;

function tick(now: number) {
  const y = window.scrollY;
  const t = now / 1000;
  for (const cb of callbacks) cb(y, t);
  rafId = requestAnimationFrame(tick);
}

/**
 * Register a per-frame callback on the single shared rAF loop.
 * One loop for the whole page — not one per component.
 * Returns an unsubscribe function.
 */
export function subscribeToFrame(cb: FrameCallback): () => void {
  callbacks.add(cb);
  if (rafId === 0) rafId = requestAnimationFrame(tick);
  return () => {
    callbacks.delete(cb);
    if (callbacks.size === 0 && rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}
