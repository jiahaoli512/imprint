import { useRef, useEffect, useCallback } from 'react';

// Returns a debounced version of `fn` that waits `delay` ms after the last call
// before firing. The returned function has a `.cancel()` to drop a pending call
// (e.g. when input is cleared). The latest `fn` is always used, and any pending
// timer is cleared on unmount.
export function useDebouncedCallback(fn, delay) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timer = useRef(null);

  const cancel = useCallback(() => clearTimeout(timer.current), []);
  useEffect(() => cancel, [cancel]);

  const debounced = useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);
  debounced.cancel = cancel;

  return debounced;
}
