'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ageVerificationService } from '@/services/ageVerification/ageVerificationService';

interface PWAInstallContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  showPrompt: boolean;
  showIOSInstructions: boolean;
  promptToInstall: () => Promise<void>;
  dismissPrompt: () => void;
  openIOSInstructions: () => void;
  closeIOSInstructions: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

const DISMISS_STORAGE_KEY = 'portal18:pwa-dismissed';
const INSTALLED_STORAGE_KEY = 'portal18:pwa-installed';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // 1. Initial platform and standalone detection
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((navigator as any).standalone) ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    const userAgent = navigator.userAgent || '';
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isStandaloneMode) {
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      } catch {}
      return;
    }

    // 2. Listen for beforeinstallprompt event (Android / Desktop Chrome / Edge)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Check dismiss cooldown and AgeGate sequencing
      checkAndShowPrompt();
    };

    // 3. Listen for successful installation
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setShowPrompt(false);
      setShowIOSInstructions(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If iOS Safari, evaluate prompt eligibility after initial delay
    if (isIOSDevice && !isStandaloneMode) {
      setIsInstallable(true);
      checkAndShowPrompt();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const checkAndShowPrompt = useCallback(() => {
    // Non-intrusive delay (~1.5s) to allow first paint and interactive hydration
    const timer = setTimeout(() => {
      try {
        const isInstalled = localStorage.getItem(INSTALLED_STORAGE_KEY) === 'true';
        if (isInstalled) return;

        const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
        if (dismissedAt) {
          const timeSinceDismiss = Date.now() - Number(dismissedAt);
          if (timeSinceDismiss < COOLDOWN_MS) {
            return; // In active cooldown
          }
        }

        // Sequence after Age Gate (do not overlap Age Gate)
        if (!ageVerificationService.isAgeVerified()) {
          return;
        }

        setShowPrompt(true);
      } catch {}
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const promptToInstall = useCallback(async () => {
    if (isIOS) {
      setShowPrompt(false);
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, isIOS]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {}
  }, []);

  const openIOSInstructions = useCallback(() => {
    setShowIOSInstructions(true);
  }, []);

  const closeIOSInstructions = useCallback(() => {
    setShowIOSInstructions(false);
  }, []);

  return (
    <PWAInstallContext.Provider
      value={{
        isInstallable,
        isStandalone,
        isIOS,
        showPrompt,
        showIOSInstructions,
        promptToInstall,
        dismissPrompt,
        openIOSInstructions,
        closeIOSInstructions,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
}
