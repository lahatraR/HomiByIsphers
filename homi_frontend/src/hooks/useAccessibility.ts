import { useEffect } from 'react';

export function useAccessibility() {
  useEffect(() => {
    document.body.setAttribute('tabindex', '-1');
    document.body.setAttribute('aria-label', 'Homi App');
  }, []);
}
