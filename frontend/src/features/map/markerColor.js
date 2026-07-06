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

// Hue angle (0–360) of a "#rrggbb", for spectral ordering.
function hueOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

// Brand + rainbow swatches, ordered by hue so the imprint colors slot into their
// spectral positions and the overall row still reads as a rainbow.
export const MARKER_PRESETS = [...IMPRINT_PRESETS, ...RAINBOW_PRESETS].sort((a, b) => hueOf(a) - hueOf(b));

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
