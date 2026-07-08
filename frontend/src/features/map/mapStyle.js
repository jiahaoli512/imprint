import L from 'leaflet';
import { hexToRgb } from '../../utils/color';

// Map geometry + palette + marker icons, shared by MapView and MapCard. The
// presentation concern, split out of the old mapUtils grab-bag.
export const MARKER_RADIUS_M = 15.24;   // mirrors MARKER_RADIUS_M in backend markerService
export const LOCATION_RADIUS_M = 80;   // accuracy circle around the user's location
export const MARKER_COLOR = '#e2a156';      // saved markers (and accent)
export const MARKER_EDIT_COLOR = '#e2685a'; // markers/errors while editing
export const LOCATE_BLUE = '#5aa9e6';       // the "locate me" dot/highlight

// A translucent "r,g,b,a" glow string from a "#rrggbb" marker color.
const glow = (hex, a) => { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

// Builds the saved-marker DOM dot for a given color (the "dot" Point Shape). The
// marker color is a per-device setting (see markerColor.js), so the icon is
// generated per color rather than fixed at module load. Cached so repeated
// renders reuse instances.
const dotCache = new Map();
export function makeDotIcon(color = MARKER_COLOR) {
  let icon = dotCache.get(color);
  if (!icon) {
    icon = L.divIcon({
      className: '',
      html: `<div style="width:10px;height:10px;background:${color};border:2px solid #0b0e13;border-radius:50%;box-shadow:0 0 4px ${glow(color, 0.25)}"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    dotCache.set(color, icon);
  }
  return icon;
}

// Builds the saved-marker DOM pin for a given color (the "pin" Point Shape).
// Same 10x10 icon footprint/anchor as the dot — center-anchored, not the
// classic bottom-tip-anchored map pin — so switching shape never shifts a
// marker's position on the map. The inner glyph itself is sized a bit past
// that box (an 8.5px square rotated -45deg, ~12px bounding diagonal) rather
// than inscribed inside it: at a matching literal footprint the tapered
// teardrop silhouette read visibly smaller/lighter than the dot's filled
// circle, so it's allowed to bleed slightly past the 10x10 box for equivalent
// visual weight — harmless since edit-mode markers (the only ones needing
// precise click targets) always render as the dot via pinIconEdit, never this.
const pinCache = new Map();
export function makePinIcon(color = MARKER_COLOR) {
  let icon = pinCache.get(color);
  if (!icon) {
    icon = L.divIcon({
      className: '',
      html: `<div style="width:10px;height:10px;position:relative;"><div style="position:absolute;left:0.75px;top:0.75px;width:8.5px;height:8.5px;background:${color};border:1.75px solid #0b0e13;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 4px ${glow(color, 0.25)};"></div></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    pinCache.set(color, icon);
  }
  return icon;
}

export const pinIconEdit = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#e2685a;border:2px solid #0b0e13;border-radius:50%;box-shadow:0 0 4px rgba(226,104,90,0.25);cursor:pointer"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});
