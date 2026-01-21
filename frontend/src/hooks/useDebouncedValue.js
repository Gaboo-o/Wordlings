import { useEffect, useState } from 'react';

/*
  useDebouncedValue
  Returns a value that only updates after `delayMs` passes without the input changing.

  Useful for:
  - Waiting before running search logic
  - Reducing API calls during typing
*/
export default function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
