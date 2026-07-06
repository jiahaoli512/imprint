import { createSetting } from '../settings/createSetting';
import { getStoredMarkerColor, setStoredMarkerColor } from '../../api/client';
import { MARKER_COLOR } from './mapStyle';

// Per-device marker (point) color. Users pick one of the presets below or any
// custom hex via the color wheel. The app's original amber (MARKER_COLOR) stays
// the default so untouched maps look unchanged.
export const DEFAULT_MARKER_COLOR = MARKER_COLOR;

// The default palette (a rainbow), shown as swatches in Display settings.
export const MARKER_PRESETS = [
  '#ff0000', // red
  '#ff3b00', // vermilion
  '#ff7f00', // orange
  '#ffb300', // amber
  '#ffff00', // yellow
  '#7fff00', // chartreuse
  '#00e000', // green
  '#0000ff', // blue
  '#7f00ff', // violet
  '#ff00ff', // magenta
];

const HEX_RE = /^#[0-9a-f]{6}$/;

// Coerce any stored/incoming value to a valid lowercase "#rrggbb", else default.
function normalize(c) {
  return typeof c === 'string' && HEX_RE.test(c.toLowerCase()) ? c.toLowerCase() : DEFAULT_MARKER_COLOR;
}

// Module-level setting so the picker (settings) and the renderer (MapView) share
// one source of truth and the map re-colors the instant the color changes.
const markerColor = createSetting({
  read: getStoredMarkerColor,
  write: setStoredMarkerColor,
  normalize,
});

export const setMarkerColor = markerColor.set;
// [color, setMarkerColor] — subscribes so any consumer re-renders on change.
export const useMarkerColor = markerColor.use;
