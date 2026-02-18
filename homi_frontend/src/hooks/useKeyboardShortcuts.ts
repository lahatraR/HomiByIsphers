import { useEffect } from 'react';

export function useKeyboardShortcuts(shortcuts: { [key: string]: () => void }) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const fn = shortcuts[e.key];
      if (fn) fn();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
