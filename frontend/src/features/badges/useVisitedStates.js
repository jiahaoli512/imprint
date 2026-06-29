import { useVisitedSet } from './useVisitedSet';
import { computeVisitedStates } from './usStates';

// Visited US states (by name) from a marker list — see useVisitedSet. Gated by
// `active` so the us-atlas chunk loads only when the US-states category is open.
export function useVisitedStates(markers, active) {
  return useVisitedSet(markers, active, computeVisitedStates);
}
