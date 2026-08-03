export type Theme = 'dark' | 'light';

export interface Palette {
  acc: string;
  acc2: string;
  line: string;
  faint: string;
  warn: string;
  node: string;
}

const STORAGE_KEY = 'anas-theme';

export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'dark' || stored === 'light') return stored;
  return prefersDark ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  // Private-mode Safari throws on setItem. A missing preference is recoverable;
  // a crashed toggle is not.
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* preference simply will not persist */
  }
}

export function loadStoredTheme(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const g = (n: string) => s.getPropertyValue(n).trim();
  return {
    acc: g('--acc'),
    acc2: g('--acc2'),
    line: g('--line'),
    faint: g('--faint'),
    warn: g('--warn'),
    node: g('--node'),
  };
}
