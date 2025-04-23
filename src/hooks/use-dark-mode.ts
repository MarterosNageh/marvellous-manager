
import { useEffect, useState } from "react";

/**
 * Returns true if dark mode is currently active based on media query.
 */
export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);

    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  return isDark;
}
