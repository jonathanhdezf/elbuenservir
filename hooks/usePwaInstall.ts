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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => {
    if (typeof window !== 'undefined' && (window as any).deferredPrompt) {
      return (window as any).deferredPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    
    // Check standalone mode (PWA installed and running standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    const isTwa = document.referrer.includes('android-app://');
    const localSaved = localStorage.getItem('pwa_installed') === 'true';

    return isStandalone || isIosStandalone || isTwa || localSaved;
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
      const localSaved = localStorage.getItem('pwa_installed') === 'true';
      if (isStandalone || isIosStandalone || isTwa || localSaved) {
        setIsInstalled(true);
      }
    };

    checkInstalled();

    // Check if early capture in index.html already got the event
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

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
      (window as any).deferredPrompt = e;
      setDeferredPrompt(e);
    };

    // Listen for custom event dispatched from index.html early capture
    const handlePromptAvailable = (e: any) => {
      const promptObj = e?.detail || (window as any).deferredPrompt;
      if (promptObj) {
        setDeferredPrompt(promptObj);
      }
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
      setShowInstructions(false);
      try {
        localStorage.setItem('pwa_installed', 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } catch {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    // 1. Get active prompt from React state or window global
    let activePrompt = deferredPrompt || (typeof window !== 'undefined' ? (window as any).deferredPrompt : null);

    // If prompt is not yet in memory and not iOS, wait up to 400ms in case the event is just arriving
    if (!activePrompt && typeof window !== 'undefined' && !isIos) {
      await new Promise(r => setTimeout(r, 400));
      activePrompt = (window as any).deferredPrompt || deferredPrompt;
    }

    if (activePrompt) {
      try {
        // Trigger native browser install dialog directly
        await activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') (window as any).deferredPrompt = null;
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
      
      // Prompt was shown (or closed)
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') (window as any).deferredPrompt = null;
      return false;
    }

    // 2. If prompt is genuinely not available, show manual instructions modal
    // (Crucial for iOS Safari which doesn't support programmatic prompt, or in-app webviews)
    setShowInstructions(true);
    return false;
  }, [deferredPrompt, isIos]);

  return {
    isInstalled,
    canInstall: !isInstalled,
    hasPrompt: !!deferredPrompt || (typeof window !== 'undefined' && !!(window as any).deferredPrompt),
    isIos,
    showInstructions,
    setShowInstructions,
    installApp
  };
}
