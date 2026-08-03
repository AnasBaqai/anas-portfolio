import { describe, it, expect } from 'vitest';
import { rgba, stageWeight } from '@/lib/overlays';

describe('rgba', () => {
  it('expands six-digit hex', () => {
    expect(rgba('#4F7CFF', 0.5)).toBe('rgba(79,124,255,0.5)');
  });

  it('expands three-digit shorthand hex', () => {
    expect(rgba('#FFF', 1)).toBe('rgba(255,255,255,1)');
  });

  it('tolerates the whitespace getComputedStyle leaves behind', () => {
    expect(rgba('  #0A0A0C ', 1)).toBe('rgba(10,10,12,1)');
  });
});

describe('stageWeight', () => {
  it('is 1 exactly on its stage and 0 a full stage away', () => {
    expect(stageWeight(2, 2)).toBe(1);
    expect(stageWeight(3, 2)).toBe(0);
    expect(stageWeight(1, 2)).toBe(0);
  });

  it('fades linearly between stages', () => {
    expect(stageWeight(2.5, 2)).toBeCloseTo(0.5);
    expect(stageWeight(2.5, 3)).toBeCloseTo(0.5);
  });

  it('never goes negative', () => {
    for (let s = 0; s <= 4; s += 0.1) {
      for (let stage = 0; stage < 5; stage++) {
        expect(stageWeight(s, stage)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('always has at least one overlay visible at any progress', () => {
    for (let s = 0; s <= 4; s += 0.05) {
      const total = [0, 1, 2, 3, 4].reduce((acc, st) => acc + stageWeight(s, st), 0);
      expect(total).toBeGreaterThan(0.9);
    }
  });
});
