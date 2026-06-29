import { useVisitedSet } from './useVisitedSet';
import { computeVisitedCountries } from './countryGeo';

// Visited countries (by ISO numeric code) from a marker list — see useVisitedSet.
// Gated by `active` so the world-atlas chunk loads only when the Passports
// category is open.
export function useVisitedCountries(markers, active) {
  return useVisitedSet(markers, active, computeVisitedCountries);
}
