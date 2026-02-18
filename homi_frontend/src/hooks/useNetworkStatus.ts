import { useEffect } from 'react';

export function useNetworkStatus(onChange: (online: boolean) => void) {
  useEffect(() => {
    function handler() {
      onChange(navigator.onLine);
    }
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, [onChange]);
}
