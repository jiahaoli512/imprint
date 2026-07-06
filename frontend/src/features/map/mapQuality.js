import { createSetting, keyNormalizer } from '../../utils/createSetting';
import { getStoredMapQuality, setStoredMapQuality } from '../../api/client';

// Map render-quality tiers. Each tier is a combination of the marker primitive
// plus the three thinning knobs in MapView's MarkerLayer — higher tiers draw
// more faithfully (more pins, no thinning) at the cost of performance.
//   marker: 'dom'    → constant-size DOM pin icons (smooth zoom)
//           'circle' → canvas CircleMarker dots (cheapest)
//   cap:  cap mounted markers at MAX_RENDERED_PINS
//   cull: render only markers in the current viewport
//   grid: collapse markers sharing a screen cell to one dot
export const QUALITY = {
  low:    { marker: 'circle', cap: true,  cull: true,  grid: true },
  medium: { marker: 'dom',    cap: true,  cull: true,  grid: true },
  high:   { marker: 'dom',    cap: true,  cull: true,  grid: false },
  ultra:  { marker: 'dom',    cap: true,  cull: false, grid: false },
  max:    { marker: 'dom',    cap: false, cull: false, grid: false },
};

// Order shown in the picker (ascending fidelity) and human labels.
export const QUALITY_ORDER = ['low', 'medium', 'high', 'ultra', 'max'];
export const QUALITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', ultra: 'Ultra High', max: 'Max' };
export const DEFAULT_QUALITY = 'medium';

// Module-level setting so the picker (in Settings) and the renderer (in MapView)
// share one source of truth and the map re-renders the instant the tier changes.
const quality = createSetting({
  read: getStoredMapQuality,
  write: setStoredMapQuality,
  normalize: keyNormalizer(QUALITY, DEFAULT_QUALITY),
});

export const setMapQuality = quality.set;
// [quality, setMapQuality] — subscribes so any consumer re-renders on change.
export const useMapQuality = quality.use;
