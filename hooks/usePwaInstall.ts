import { useState, useEffect, useCallback } from 'react';

export interface UsePwaInstallReturn {
  isInstalled: boolean;
  canInstall: boolean;
  hasPrompt: boolean;
  isIos: boolean;
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
  installApp: () => Promise<boolean>;
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    
    // Check standalone mode (PWA installed and running standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    const isTwa = document.referrer.includes('android-app://');

    return isStandalone || isIosStandalone || isTwa;
  });

  const [isIos, setIsIos] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // Initial check in case it changed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      const isTwa = document.referrer.includes('android-app://');
      if (isStandalone || isIosStandalone || isTwa) {
        setIsInstalled(true);
      }
    };

    checkInstalled();

    // Listen for media query change (e.g., app launched as standalone)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    try {
      mediaQuery.addEventListener('change', handleMediaChange);
    } catch {
      // Fallback for older browsers
      mediaQuery.addListener(handleMediaChange);
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstructions(false);
      try {
        localStorage.setItem('pwa_installed', 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } catch {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setShowInstructions(false);
          try {
            localStorage.setItem('pwa_installed', 'true');
          } catch {
            // ignore
          }
          return true;
        }
      } catch (err) {
        console.error('Error al invocar instalación PWA:', err);
      }
      setDeferredPrompt(null);
      return false;
    }

    // If deferredPrompt is not available (e.g., iOS or browser already prompted/disabled)
    setShowInstructions(true);
    return false;
  }, [deferredPrompt]);

  return {
    isInstalled,
    canInstall: !isInstalled,
    hasPrompt: !!deferredPrompt,
    isIos,
    showInstructions,
    setShowInstructions,
    installApp
  };
}
