import { useEffect } from 'react';

export function useDocumentVisibility(onChange: (visible: boolean) => void) {
  useEffect(() => {
    function handler() {
      onChange(document.visibilityState === 'visible');
    }
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [onChange]);
}
