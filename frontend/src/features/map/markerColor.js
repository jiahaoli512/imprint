import { createSetting } from '../settings/createSetting';
import { getStoredMarkerColor, setStoredMarkerColor } from '../../api/client';
import { MARKER_COLOR, LOCATE_BLUE } from './mapStyle';

// Per-device marker (point) color. Users pick one of the presets below or any
// custom hex via the color wheel. The app's original amber (MARKER_COLOR) stays
// the default so untouched maps look unchanged.
export const DEFAULT_MARKER_COLOR = MARKER_COLOR;

// Imprint's own brand colors — the accent gradient (amber + teal) plus the map's
// locate blue — so users can match the app's identity in one tap.
export const IMPRINT_PRESETS = [
  MARKER_COLOR, // imprint amber (--accent, the default)
  '#34c9ae',    // imprint teal (--accent2)
  LOCATE_BLUE,  // imprint blue (the "locate me" accent)
];

// A rainbow of general-purpose colors.
const RAINBOW_PRESETS = [
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

// Imprint brand colors first, then the rainbow. Shown as swatches in settings.
export const MARKER_PRESETS = [...IMPRINT_PRESETS, ...RAINBOW_PRESETS];

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
