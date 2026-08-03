import { describe, it, expect } from 'vitest';
import { narrativeProgress, panelVisibility } from '@/lib/scroll';

describe('narrativeProgress', () => {
  it('clamps to [0, 1] outside the narrative range', () => {
    expect(narrativeProgress(0, 500, 4500)).toBe(0);
    expect(narrativeProgress(9999, 500, 4500)).toBe(1);
  });

  it('is 0.5 at the midpoint', () => {
    expect(narrativeProgress(2500, 500, 4500)).toBeCloseTo(0.5);
  });

  it('is monotonically non-decreasing in scrollY', () => {
    let prev = -1;
    for (let y = 0; y <= 5000; y += 100) {
      const p = narrativeProgress(y, 500, 4500);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it('never divides by zero when the range is degenerate', () => {
    const p = narrativeProgress(500, 500, 500);
    expect(Number.isFinite(p)).toBe(true);
  });
});

describe('panelVisibility', () => {
  const VH = 900;
  const H = 990; // one act is 110vh

  it('is 0 before the panel enters and after it leaves', () => {
    expect(panelVisibility(VH, H, VH)).toBe(0);
    expect(panelVisibility(-H, H, VH)).toBe(0);
  });

  it('reaches full opacity while the panel is centred', () => {
    // act centred: its top sits just above the viewport top
    expect(panelVisibility(-(H - VH) / 2, H, VH)).toBe(1);
  });

  it('holds at 1 across a readable band rather than peaking instantaneously', () => {
    let full = 0;
    for (let top = VH; top > -H; top -= 5) {
      if (panelVisibility(top, H, VH) === 1) full++;
    }
    // the plateau must span a meaningful portion of the act's travel
    expect(full).toBeGreaterThan(50);
  });

  it('is symmetric on entry and exit', () => {
    const centre = -(H - VH) / 2;
    for (const d of [200, 400, 600]) {
      expect(panelVisibility(centre + d, H, VH)).toBeCloseTo(
        panelVisibility(centre - d, H, VH), 5,
      );
    }
  });
});
