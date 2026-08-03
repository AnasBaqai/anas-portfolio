import { describe, it, expect, beforeEach } from 'vitest';
import { resolveInitialTheme, applyTheme, readPalette } from '@/lib/theme';

describe('resolveInitialTheme', () => {
  it('honours a stored preference over the system preference', () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
    expect(resolveInitialTheme('dark', false)).toBe('dark');
  });

  it('falls back to the system preference when nothing is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });

  it('ignores a stored value that is not a valid theme', () => {
    expect(resolveInitialTheme('banana', false)).toBe('light');
  });
});

describe('applyTheme', () => {
  beforeEach(() => { document.documentElement.removeAttribute('data-theme'); });

  it('writes the theme to the document element', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('readPalette', () => {
  it('returns a string for every palette key', () => {
    document.documentElement.style.setProperty('--acc', '#4F7CFF');
    document.documentElement.style.setProperty('--acc2', '#7CE0C3');
    document.documentElement.style.setProperty('--line', '#232329');
    document.documentElement.style.setProperty('--faint', '#52525B');
    document.documentElement.style.setProperty('--warn', '#FBBF24');
    document.documentElement.style.setProperty('--node', '#0A0A0C');
    document.documentElement.style.setProperty('--ink', '#F4F4F5');
    const p = readPalette();
    expect(p.acc).toBe('#4F7CFF');
    expect(p.node).toBe('#0A0A0C');
    for (const v of Object.values(p)) expect(v.length).toBeGreaterThan(0);
  });
});
