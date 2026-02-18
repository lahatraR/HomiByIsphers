import { useEffect } from 'react';

export function useResponsive() {
  useEffect(() => {
    function handleResize() {
      document.body.setAttribute('data-width', window.innerWidth.toString());
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
}
