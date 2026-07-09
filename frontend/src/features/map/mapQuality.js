import { createSetting, keyNormalizer } from '../../utils/createSetting';
import { getStoredMapQuality, setStoredMapQuality } from '../../api/client';

// Map render-quality tiers. Each tier is a combination of the marker primitive
// plus the three thinning knobs in MapView's MarkerLayer — higher tiers draw
// more faithfully (more pins, no thinning) at the cost of performance.
//   marker: 'dom'    → constant-size DOM pin icons (smooth zoom)
//           'circle' → canvas CircleMarker dots (cheapest)
//   cap:  hard ceiling on mounted markers (stride down to this many)
//   cull: render only markers in the current viewport
//   grid: collapse markers sharing a screen cell to one dot
//
// The cap is a per-tier DOM-node ceiling because rebuilding the DOM marker layer
// costs super-linearly with pin count (benchmarked: ~11ms/500, ~29ms/1000,
// ~76ms/2000, ~250ms/4000, then a cliff — ~660ms/8000, ~2.2s/16000). 500 stays
// under one 60fps frame for the everyday tiers; ultra/high-fidelity tiers trade
// smoothness for coverage but stay bounded, so a heavily-tracked map can never
// mount tens of thousands of nodes and freeze the tab (what an uncapped 'max'
// did). Nothing is ever uncapped.
export const QUALITY = {
  low:    { marker: 'circle', cap: 500,  cull: true,  grid: true },
  medium: { marker: 'dom',    cap: 500,  cull: true,  grid: true },
  high:   { marker: 'dom',    cap: 500,  cull: true,  grid: false },
  ultra:  { marker: 'dom',    cap: 2000, cull: false, grid: false },
  max:    { marker: 'dom',    cap: 4000, cull: false, grid: false },
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
