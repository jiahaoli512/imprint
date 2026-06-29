import { useState, useEffect } from 'react';

// Generic hook behind useVisitedStates / useVisitedCountries: resolves a Set of
// visited region keys from a marker list via `compute(markers)`, but only once
// `active` is true (i.e. the relevant passport category has been opened) so the
// boundary data + geometry work are deferred until actually needed. Returns null
// while loading — callers treat that as "nothing unlocked yet". `compute` is
// expected to be a stable module-level function.
export function useVisitedSet(markers, active, compute) {
  const [visited, setVisited] = useState(null);

  useEffect(() => {
    if (!active || !markers || markers.length === 0) return;
    let alive = true;
    compute(markers)
      .then((set) => { if (alive) setVisited(set); })
      .catch(() => { /* leave locked on failure */ });
    return () => { alive = false; };
  }, [active, markers, compute]);

  return visited;
}
