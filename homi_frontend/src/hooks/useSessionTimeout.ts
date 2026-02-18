import { useEffect } from 'react';

export function useSessionTimeout(timeoutMs: number, onTimeout: () => void) {
  useEffect(() => {
    let timer = setTimeout(onTimeout, timeoutMs);
    function reset() {
      clearTimeout(timer);
      timer = setTimeout(onTimeout, timeoutMs);
    }
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [timeoutMs, onTimeout]);
}
