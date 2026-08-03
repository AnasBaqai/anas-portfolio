import { describe, it, expect } from 'vitest';
import {
  FORMATION_COUNT, JOURNEY, EPILOGUE, buildFormations, stageAt, interpolateInto,
  journeyAt, epilogueAt,
} from '@/lib/formations';

const N = 180;

describe('buildFormations', () => {
  const forms = buildFormations(N, 1);

  it('returns exactly five formations', () => {
    expect(forms).toHaveLength(FORMATION_COUNT);
    expect(JOURNEY).toHaveLength(FORMATION_COUNT);
  });

  it('gives every formation exactly N points', () => {
    for (const f of forms) expect(f.length).toBe(N * 2);
  });

  it('keeps every point inside normalised bounds', () => {
    for (const f of forms) {
      for (let i = 0; i < f.length; i++) {
        expect(Math.abs(f[i])).toBeLessThanOrEqual(1.2);
      }
    }
  });

  it('is deterministic for a fixed seed', () => {
    const again = buildFormations(N, 1);
    for (let k = 0; k < FORMATION_COUNT; k++) {
      expect(Array.from(again[k])).toEqual(Array.from(forms[k]));
    }
  });

  it('makes the formations visibly distinct from one another', () => {
    // If two formations were near-identical the morph would read as static.
    for (let a = 0; a < FORMATION_COUNT; a++) {
      for (let b = a + 1; b < FORMATION_COUNT; b++) {
        let sum = 0;
        for (let i = 0; i < forms[a].length; i++) {
          sum += Math.abs(forms[a][i] - forms[b][i]);
        }
        expect(sum / forms[a].length).toBeGreaterThan(0.15);
      }
    }
  });

  it('lays the pipeline formation onto three horizontal rails', () => {
    const pipeline = forms[2];
    const ys = new Set<number>();
    for (let i = 1; i < pipeline.length; i += 2) ys.add(Math.round(pipeline[i] * 10) / 10);
    // three rails at -0.42, 0, 0.42 with small jitter
    expect(ys.size).toBeLessThanOrEqual(6);
  });
});

describe('stageAt', () => {
  it('maps progress 0..1 onto four segments between five keyframes', () => {
    expect(stageAt(0)).toEqual({ index: 0, frac: 0 });
    expect(stageAt(1).index).toBe(3);
    expect(stageAt(1).frac).toBeCloseTo(1);
  });

  it('never returns an index that would read past the last formation', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const { index } = stageAt(p);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(FORMATION_COUNT - 2);
    }
  });
});

describe('interpolateInto', () => {
  const forms = buildFormations(N, 1);
  const out = new Float32Array(N * 2);

  it('reproduces a formation exactly at frac 0', () => {
    interpolateInto(forms, 2, 0, out);
    for (let i = 0; i < out.length; i++) expect(out[i]).toBeCloseTo(forms[2][i], 5);
  });

  it('reproduces the next formation exactly at frac 1', () => {
    interpolateInto(forms, 2, 1, out);
    for (let i = 0; i < out.length; i++) expect(out[i]).toBeCloseTo(forms[3][i], 5);
  });

  it('is a pure function of its inputs — scrubbing backwards matches exactly', () => {
    const forward = new Float32Array(N * 2);
    const backward = new Float32Array(N * 2);
    interpolateInto(forms, 1, 0.37, forward);
    // simulate scrolling away and returning to the same offset
    interpolateInto(forms, 3, 0.9, backward);
    interpolateInto(forms, 1, 0.37, backward);
    expect(Array.from(backward)).toEqual(Array.from(forward));
  });
});

describe('journeyAt', () => {
  it('moves the subject a long way across the viewport', () => {
    const W = 1440, H = 900;
    const a = journeyAt(0, 0, W, H);
    const b = journeyAt(1, 1, W, H); // extraction keyframe — crosses to the left
    expect(Math.abs(a.cx - b.cx) / W).toBeGreaterThan(0.35);
  });

  it('keeps the subject on screen at every point of the journey', () => {
    const W = 1440, H = 900;
    for (let i = 0; i <= FORMATION_COUNT - 2; i++) {
      for (const f of [0, 0.5, 1]) {
        const j = journeyAt(i, f, W, H);
        expect(j.cx).toBeGreaterThan(0);
        expect(j.cx).toBeLessThan(W);
        expect(j.cy).toBeGreaterThan(0);
        expect(j.cy).toBeLessThan(H);
        expect(j.scale).toBeGreaterThan(0);
      }
    }
  });
});

describe('epilogueAt', () => {
  const W = 1440, H = 900;

  it('hands off from the narrative with no jump', () => {
    // The frozen-subject bug lived exactly here: journeyAt's last position must
    // equal epilogueAt's first, or the subject teleports when the narrative ends.
    const last = journeyAt(FORMATION_COUNT - 2, 1, W, H);
    const first = epilogueAt(0, W, H);
    expect(first.cx).toBeCloseTo(last.cx, 6);
    expect(first.cy).toBeCloseTo(last.cy, 6);
    expect(first.scale).toBeCloseTo(last.scale, 6);
  });

  it('keeps moving after the narrative instead of parking', () => {
    // This is the regression guard for the user-reported freeze. A parked
    // subject makes every sample identical; spread must be substantial.
    const xs = [0, 0.25, 0.5, 0.75, 1].map((p) => epilogueAt(p, W, H).cx / W);
    const spread = Math.max(...xs) - Math.min(...xs);
    expect(spread, 'subject must traverse during the epilogue, not sit still').toBeGreaterThan(0.4);
  });

  it('stays on screen and visible for the whole epilogue', () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const e = epilogueAt(p, W, H);
      expect(e.cx).toBeGreaterThan(0);
      expect(e.cx).toBeLessThan(W);
      expect(e.cy).toBeGreaterThan(0);
      expect(e.cy).toBeLessThan(H);
      expect(e.scale).toBeGreaterThan(0);
    }
  });

  it('is a pure function of progress, so scrolling back up reverses it', () => {
    const a = epilogueAt(0.63, W, H);
    epilogueAt(0.1, W, H);
    epilogueAt(0.95, W, H);
    expect(epilogueAt(0.63, W, H)).toEqual(a);
  });

  it('clamps outside 0..1 rather than flying off', () => {
    expect(epilogueAt(-5, W, H)).toEqual(epilogueAt(0, W, H));
    expect(epilogueAt(9, W, H)).toEqual(epilogueAt(1, W, H));
  });

  it('shrinks the subject so it recedes behind the content sections', () => {
    expect(epilogueAt(1, W, H).scale).toBeLessThan(epilogueAt(0, W, H).scale);
  });

  it('starts from the same keyframe the journey ends on', () => {
    expect(EPILOGUE[0]).toEqual(JOURNEY[FORMATION_COUNT - 1]);
  });
});
