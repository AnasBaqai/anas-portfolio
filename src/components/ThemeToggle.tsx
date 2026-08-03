'use client';

import { useEffect, useState } from 'react';
import { applyTheme, loadStoredTheme, resolveInitialTheme, type Theme } from '@/lib/theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  // The inline bootstrap script already set data-theme before paint;
  // this only syncs React state to it.
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(resolveInitialTheme(loadStoredTheme(), prefersDark));
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="cursor-pointer rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-body text-[11.5px] text-[var(--ink)] transition-colors hover:border-[var(--acc)]"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
