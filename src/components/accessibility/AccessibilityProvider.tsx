'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type FontScale = 'sm' | 'md' | 'lg' | 'xl';

export interface A11yPreferences {
  fontScale: FontScale;
  highContrast: boolean;
  highlightLinks: boolean;
  legibleFont: boolean;
  reducedMotion: boolean;
  increaseSpacing: boolean;
}

const DEFAULT_PREFERENCES: A11yPreferences = {
  fontScale: 'md',
  highContrast: false,
  highlightLinks: false,
  legibleFont: false,
  reducedMotion: false,
  increaseSpacing: false,
};

const STORAGE_KEY = 'portal18:a11y-preferences';

const FONT_SCALE_VALUES: Record<FontScale, string> = {
  sm: '0.9',
  md: '1.0',
  lg: '1.15',
  xl: '1.3',
};

interface AccessibilityContextType {
  preferences: A11yPreferences;
  setFontScale: (scale: FontScale) => void;
  toggleHighContrast: () => void;
  toggleHighlightLinks: () => void;
  toggleLegibleFont: () => void;
  toggleReducedMotion: () => void;
  toggleIncreaseSpacing: () => void;
  resetPreferences: () => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<A11yPreferences>(DEFAULT_PREFERENCES);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Load preferences safely from localStorage on client mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          setPreferences({
            fontScale: parsed.fontScale || 'md',
            highContrast: Boolean(parsed.highContrast),
            highlightLinks: Boolean(parsed.highlightLinks),
            legibleFont: Boolean(parsed.legibleFont),
            reducedMotion: Boolean(parsed.reducedMotion),
            increaseSpacing: Boolean(parsed.increaseSpacing),
          });
        }
      }
    } catch {
      // Non-fatal
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Synchronize DOM attributes whenever preferences change
  useEffect(() => {
    if (!isHydrated || typeof document === 'undefined') return;

    try {
      // Font Scale custom property
      const scaleVal = FONT_SCALE_VALUES[preferences.fontScale] || '1.0';
      document.documentElement.style.setProperty('--a11y-font-scale', scaleVal);

      // Contrast
      if (preferences.highContrast) {
        document.documentElement.setAttribute('data-a11y-contrast', 'high');
      } else {
        document.documentElement.removeAttribute('data-a11y-contrast');
      }

      // Links highlight
      if (preferences.highlightLinks) {
        document.documentElement.setAttribute('data-a11y-links', 'highlight');
      } else {
        document.documentElement.removeAttribute('data-a11y-links');
      }

      // Legible font
      if (preferences.legibleFont) {
        document.documentElement.setAttribute('data-a11y-font', 'legible');
      } else {
        document.documentElement.removeAttribute('data-a11y-font');
      }

      // Reduced motion
      if (preferences.reducedMotion) {
        document.documentElement.setAttribute('data-a11y-motion', 'reduced');
      } else {
        document.documentElement.removeAttribute('data-a11y-motion');
      }

      // Spacing
      if (preferences.increaseSpacing) {
        document.documentElement.setAttribute('data-a11y-spacing', 'large');
      } else {
        document.documentElement.removeAttribute('data-a11y-spacing');
      }

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Non-fatal
    }
  }, [preferences, isHydrated]);

  const setFontScale = useCallback((scale: FontScale) => {
    setPreferences((prev) => ({ ...prev, fontScale: scale }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setPreferences((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const toggleHighlightLinks = useCallback(() => {
    setPreferences((prev) => ({ ...prev, highlightLinks: !prev.highlightLinks }));
  }, []);

  const toggleLegibleFont = useCallback(() => {
    setPreferences((prev) => ({ ...prev, legibleFont: !prev.legibleFont }));
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setPreferences((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  }, []);

  const toggleIncreaseSpacing = useCallback(() => {
    setPreferences((prev) => ({ ...prev, increaseSpacing: !prev.increaseSpacing }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
      if (typeof document !== 'undefined') {
        document.documentElement.style.removeProperty('--a11y-font-scale');
        document.documentElement.removeAttribute('data-a11y-contrast');
        document.documentElement.removeAttribute('data-a11y-links');
        document.documentElement.removeAttribute('data-a11y-font');
        document.documentElement.removeAttribute('data-a11y-motion');
        document.documentElement.removeAttribute('data-a11y-spacing');
      }
    } catch {
      // Non-fatal
    }
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        setFontScale,
        toggleHighContrast,
        toggleHighlightLinks,
        toggleLegibleFont,
        toggleReducedMotion,
        toggleIncreaseSpacing,
        resetPreferences,
        isPanelOpen,
        setIsPanelOpen,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
