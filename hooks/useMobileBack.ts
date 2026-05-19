import { useEffect, useRef } from 'react';

interface UseMobileBackOptions {
  hasOpenModal?: boolean;
  onCloseModal?: () => void;
  hasSubSection?: boolean;
  onBackSubSection?: () => void;
  isRoot?: boolean;
  onExit?: () => void;
  confirmExitMessage?: string;
}

export function useMobileBack({
  hasOpenModal = false,
  onCloseModal,
  hasSubSection = false,
  onBackSubSection,
  isRoot = false,
  onExit,
  confirmExitMessage
}: UseMobileBackOptions) {
  const optionsRef = useRef({
    hasOpenModal,
    onCloseModal,
    hasSubSection,
    onBackSubSection,
    isRoot,
    onExit,
    confirmExitMessage
  });

  useEffect(() => {
    optionsRef.current = {
      hasOpenModal,
      onCloseModal,
      hasSubSection,
      onBackSubSection,
      isRoot,
      onExit,
      confirmExitMessage
    };
  });

  useEffect(() => {
    // Push trap state only once when the view mounts
    window.history.pushState({ modal: 'trap' }, '');

    const handlePopState = (event: PopStateEvent) => {
      const {
        hasOpenModal,
        onCloseModal,
        hasSubSection,
        onBackSubSection,
        isRoot,
        onExit,
        confirmExitMessage
      } = optionsRef.current;

      // 1. Check for open modals or temporary overlay states
      if (hasOpenModal && onCloseModal) {
        onCloseModal();
        window.history.pushState({ modal: 'trap' }, '');
        return;
      }

      // 2. Check for sub-sections within the current view
      if (hasSubSection && onBackSubSection) {
        onBackSubSection();
        window.history.pushState({ modal: 'trap' }, '');
        return;
      }

      // 3. If at the root of the entire application (PublicView)
      if (isRoot) {
        if (confirmExitMessage) {
          if (window.confirm(confirmExitMessage)) {
            // Allow the browser to exit or go back normally
            return;
          } else {
            // User canceled exit, push state back to stay in app
            window.history.pushState({ modal: 'trap' }, '');
            return;
          }
        } else {
          // If no confirm message, allow normal back behavior
          return;
        }
      }

      // 4. If in a secondary view (Admin, TPV, Kitchen, etc.), exit back to Control Panel / Public View
      if (onExit) {
        onExit();
        window.history.pushState({ modal: 'trap' }, '');
        return;
      }

      // Fallback: keep trap active
      window.history.pushState({ modal: 'trap' }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
