import { useState, useEffect } from 'react';
import { computeVisitedCountries } from './countryGeo';

// Resolves the set of visited country ISO numeric codes from a marker list, but
// only once `active` is true (i.e. the Passports category has been opened) so the
// boundary data + geometry work are deferred until actually needed. Returns null
// while loading — callers treat that as "nothing unlocked yet".
export function useVisitedCountries(markers, active) {
  const [visited, setVisited] = useState(null);

  useEffect(() => {
    if (!active || !markers || markers.length === 0) return;
    let alive = true;
    computeVisitedCountries(markers)
      .then((set) => { if (alive) setVisited(set); })
      .catch(() => { /* leave locked on failure */ });
    return () => { alive = false; };
  }, [active, markers]);

  return visited;
}
