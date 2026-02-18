import { useEffect } from 'react';

export function useErrorBoundary(onError: (error: Error) => void) {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      onError(event.error);
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, [onError]);
}
