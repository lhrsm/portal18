'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (theme: ThemePreference) => void;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'portal18:theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Resolve effective theme from system media query
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // 2. Initialize from localStorage on client mount (safe from SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      const initialPref: ThemePreference = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
      setThemePreferenceState(initialPref);

      const resolved = initialPref === 'system' ? getSystemTheme() : initialPref;
      setResolvedTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);

      // Update meta theme-color tag
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0a0c10' : '#f8fafc');
      }
    } catch {
      // Non-fatal
    } finally {
      setIsHydrated(true);
    }
  }, [getSystemTheme]);

  // 3. Listen for system theme changes in real-time when preference is 'system'
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (themePreference === 'system') {
        const nextResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextResolved);
        document.documentElement.setAttribute('data-theme', nextResolved);

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', nextResolved === 'dark' ? '#0a0c10' : '#f8fafc');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference]);

  // 4. Setter for user preference
  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // Non-fatal
    }

    const nextResolved = pref === 'system' ? getSystemTheme() : pref;
    setResolvedTheme(nextResolved);
    document.documentElement.setAttribute('data-theme', nextResolved);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', nextResolved === 'dark' ? '#0a0c10' : '#f8fafc');
    }
  }, [getSystemTheme]);

  return (
    <ThemeContext.Provider value={{ themePreference, resolvedTheme, setThemePreference, isHydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Pre-hydration anti-flash script to evaluate and apply data-theme before first paint
 */
export function ThemeScript() {
  const scriptContent = `
    (function() {
      try {
        var stored = localStorage.getItem('portal18:theme');
        var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = stored === 'light' || stored === 'dark' ? stored : (systemDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  `;

  return (
    <script
      id="portal18-theme-script"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}
