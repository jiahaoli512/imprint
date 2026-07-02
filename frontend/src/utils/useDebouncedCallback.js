import { useRef, useEffect, useMemo } from 'react';

// Returns a debounced version of `fn` that waits `delay` ms after the last call
// before firing. The returned function has a `.cancel()` to drop a pending call
// (e.g. when input is cleared). The latest `fn` is always used, and any pending
// timer is cleared on unmount.
export function useDebouncedCallback(fn, delay) {
  // Keep the latest fn in a ref, updated in an effect (never written during
  // render) so the debounced closure always calls the current one.
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; }, [fn]);

  const timer = useRef(null);
  // Clear any pending call on unmount.
  useEffect(() => () => clearTimeout(timer.current), []);

  // Build the debounced function (and attach .cancel) once per `delay`, so the
  // property is set at creation rather than by mutating a memoized value.
  return useMemo(() => {
    const debounced = (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timer.current);
    return debounced;
  }, [delay]);
}
