import { useState, useEffect } from 'react';
import { computeVisitedStates } from './usStates';

// Resolves the set of visited US state names from a marker list, but only once
// `active` is true (i.e. the US-states category has been opened) so the boundary
// data + geometry work are deferred until actually needed. Returns null while
// loading — callers treat that as "nothing unlocked yet".
export function useVisitedStates(markers, active) {
  const [visited, setVisited] = useState(null);

  useEffect(() => {
    if (!active || !markers || markers.length === 0) return;
    let alive = true;
    computeVisitedStates(markers)
      .then((set) => { if (alive) setVisited(set); })
      .catch(() => { /* leave locked on failure */ });
    return () => { alive = false; };
  }, [active, markers]);

  return visited;
}
