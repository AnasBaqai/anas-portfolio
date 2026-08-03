import { describe, it, expect } from 'vitest';
import { computeLinks } from '@/lib/neighbors';

/** Reference implementation — the naive O(n²) version we are replacing. */
function naive(points: Float32Array, radius: number): Set<string> {
  const n = points.length / 2;
  const pairs = new Set<string>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = points[i * 2] - points[j * 2];
      const dy = points[i * 2 + 1] - points[j * 2 + 1];
      if (Math.hypot(dx, dy) < radius) pairs.add(`${i}-${j}`);
    }
  }
  return pairs;
}

function toSet(out: Int32Array, count: number): Set<string> {
  const s = new Set<string>();
  for (let p = 0; p < count; p++) {
    const a = out[p * 2];
    const b = out[p * 2 + 1];
    s.add(a < b ? `${a}-${b}` : `${b}-${a}`);
  }
  return s;
}

describe('computeLinks', () => {
  it('finds exactly the same pairs as the naive implementation', () => {
    const n = 200;
    const pts = new Float32Array(n * 2);
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let i = 0; i < n * 2; i++) pts[i] = rnd() * 800;

    const out = new Int32Array(n * n);
    const count = computeLinks(pts, 60, out);
    expect(toSet(out, count)).toEqual(naive(pts, 60));
  });

  it('reports no pairs when every point is further apart than the radius', () => {
    const pts = new Float32Array([0, 0, 500, 0, 1000, 0]);
    const out = new Int32Array(64);
    expect(computeLinks(pts, 50, out)).toBe(0);
  });

  it('never emits a pair twice or links a point to itself', () => {
    const pts = new Float32Array([0, 0, 1, 1, 2, 2, 3, 3]);
    const out = new Int32Array(64);
    const count = computeLinks(pts, 100, out);
    const seen = toSet(out, count);
    expect(seen.size).toBe(count);
    for (const key of seen) {
      const [a, b] = key.split('-');
      expect(a).not.toBe(b);
    }
  });

  it('stops cleanly when the output buffer is full instead of overflowing', () => {
    const n = 100;
    const pts = new Float32Array(n * 2); // all coincident, so every pair is a link
    const out = new Int32Array(20); // room for 10 pairs only
    const count = computeLinks(pts, 10, out);
    expect(count).toBe(10);
  });
});
