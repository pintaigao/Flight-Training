import type { Theme } from '@/lib/types/ui';

const STORAGE_KEY = 'flightlog.theme';

function isTheme(value: any): value is Theme {
  return value === 'light' || value === 'dark';
}

export function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
      ? 'dark'
      : 'light';
  } catch {
    return 'dark';
  }
}

export function getInitialTheme(): Theme {
  return readStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export function toggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
