import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Theme } from './theme';
import { applyTheme, getInitialTheme, persistTheme, toggleTheme } from './theme';

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const initial = getInitialTheme();
    applyTheme(initial);
    setTheme(initial);
  }, []);

  const value = useMemo(() => {
    return {
      theme,
      toggle: () => {
        setTheme((cur) => {
          const next = toggleTheme(cur);
          applyTheme(next);
          persistTheme(next);
          return next;
        });
      },
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

