import { useState, useEffect } from 'react';

// Runs an async `fn` on mount (and whenever `deps` change), exposing
// { data, loading, error }. Handles the boilerplate every fetch-on-mount site
// repeated: an `alive` guard so a resolve after unmount doesn't set state, and
// resetting loading between runs. `fn` should return the value to store; throw
// to surface an error. Deliberately minimal — no caching or refetch control.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    // Reset to loading on (re)run so a deps change doesn't show stale data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fn)
      .then((data) => { if (alive) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (alive) setState({ data: undefined, loading: false, error }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
