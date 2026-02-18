import { useEffect } from 'react';

export function useDarkMode() {
  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark', dark);
  }, []);
}
