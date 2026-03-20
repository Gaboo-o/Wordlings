import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_THEME_ID, isValidThemeId, THEME_STORAGE_KEY, THEMES } from '../themes';

const ThemeContext = createContext(null);

function getInitialTheme() {
  const env = (import.meta.env.VITE_THEME || '').trim();
  const fromEnv = env && isValidThemeId(env) ? env : null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isValidThemeId(stored)) return stored;
  } catch {
    // ignore
  }

  return fromEnv || DEFAULT_THEME_ID;
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(getInitialTheme);

  useEffect(() => {
    // Keep theme on the <html> element.
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = themeId;
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      // ignore
    }
  }, [themeId]);

  const setTheme = useCallback((id) => {
    if (!isValidThemeId(id)) return;
    setThemeId(id);
  }, []);

  const cycleTheme = useCallback(() => {
    const ids = THEMES.map((t) => t.id);
    const idx = Math.max(0, ids.indexOf(themeId));
    const next = ids[(idx + 1) % ids.length];
    setThemeId(next);
  }, [themeId]);

  const value = useMemo(
    () => ({
      themeId,
      setTheme,
      cycleTheme,
      themes: THEMES,
    }),
    [themeId, setTheme, cycleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fail softly; app still works with default tokens.
    return {
      themeId: DEFAULT_THEME_ID,
      setTheme: () => {},
      cycleTheme: () => {},
      themes: THEMES,
    };
  }
  return ctx;
}