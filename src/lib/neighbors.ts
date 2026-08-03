/**
 * Find all point pairs closer than `radius`, using a uniform grid.
 *
 * Bucket size equals the radius, so any pair within the radius must share a
 * bucket or sit in one of the four already-visited neighbours. That turns the
 * naive O(n^2) sweep into roughly O(n) for evenly spread points — this is the
 * difference between 60fps and a stuttering hero on a mid-tier phone.
 *
 * Writes pairs as consecutive point indices into `out`.
 * Returns the number of PAIRS written, not the number of integers.
 */
export function computeLinks(points: Float32Array, radius: number, out: Int32Array): number {
  const n = points.length / 2;
  const maxPairs = Math.floor(out.length / 2);
  if (n === 0 || maxPairs === 0 || radius <= 0) return 0;

  let minX = Infinity, minY = Infinity;
  for (let i = 0; i < n; i++) {
    const x = points[i * 2];
    const y = points[i * 2 + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
  }

  const cell = radius;
  const buckets = new Map<number, number[]>();
  const cols = 0x10000; // key packing stride

  const keyOf = (cx: number, cy: number) => cy * cols + cx;

  const cxOf = new Int32Array(n);
  const cyOf = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const cx = Math.floor((points[i * 2] - minX) / cell);
    const cy = Math.floor((points[i * 2 + 1] - minY) / cell);
    cxOf[i] = cx;
    cyOf[i] = cy;
    const k = keyOf(cx, cy);
    const b = buckets.get(k);
    if (b) b.push(i);
    else buckets.set(k, [i]);
  }

  // Half-neighbourhood: own bucket plus four of the eight neighbours, so each
  // pair is considered exactly once.
  const OFFSETS: readonly (readonly [number, number])[] = [
    [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
  ];

  const r2 = radius * radius;
  let pairs = 0;

  for (let i = 0; i < n; i++) {
    const ix = points[i * 2];
    const iy = points[i * 2 + 1];
    for (const [ox, oy] of OFFSETS) {
      const b = buckets.get(keyOf(cxOf[i] + ox, cyOf[i] + oy));
      if (!b) continue;
      for (const j of b) {
        // Within the own bucket, only look forward to avoid duplicate pairs.
        if (ox === 0 && oy === 0 && j <= i) continue;
        const dx = ix - points[j * 2];
        const dy = iy - points[j * 2 + 1];
        if (dx * dx + dy * dy >= r2) continue;
        if (pairs >= maxPairs) return pairs;
        out[pairs * 2] = i;
        out[pairs * 2 + 1] = j;
        pairs++;
      }
    }
  }

  return pairs;
}
