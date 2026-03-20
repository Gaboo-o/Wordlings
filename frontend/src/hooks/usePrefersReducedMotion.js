import { useEffect, useState } from 'react';

/**
 * Returns true when the user prefers reduced motion.
 * Used to disable heavy animations/intervals for accessibility and performance.
 */
export default function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(!!mql.matches);
    onChange();

    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener?.(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener?.(onChange);
    };
  }, []);

  return reduced;
}