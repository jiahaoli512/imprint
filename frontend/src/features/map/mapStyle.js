import L from 'leaflet';

// Map geometry + palette + marker icons, shared by MapView and MapCard. The
// presentation concern, split out of the old mapUtils grab-bag.
export const MARKER_RADIUS_M = 15.24;   // mirrors MARKER_RADIUS_M in backend markerService
export const LOCATION_RADIUS_M = 80;   // accuracy circle around the user's location
export const MARKER_COLOR = '#e2a156';      // saved markers (and accent)
export const MARKER_EDIT_COLOR = '#e2685a'; // markers/errors while editing
export const LOCATE_BLUE = '#5aa9e6';       // the "locate me" dot/highlight

// "#rrggbb" → "r,g,b" for building an rgba() glow from an arbitrary marker color.
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

// Builds the saved-marker DOM pin for a given color. The marker color is a
// per-device setting (see markerColor.js), so the icon is generated per color
// rather than fixed at module load. Cached so repeated renders reuse instances.
const pinCache = new Map();
export function makePinIcon(color = MARKER_COLOR) {
  let icon = pinCache.get(color);
  if (!icon) {
    icon = L.divIcon({
      className: '',
      html: `<div style="width:10px;height:10px;background:${color};border:2px solid #0b0e13;border-radius:50%;box-shadow:0 0 4px rgba(${hexToRgb(color)},0.25)"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    pinCache.set(color, icon);
  }
  return icon;
}

// The default-colored saved pin (for any consumer that doesn't theme by color).
export const pinIcon = makePinIcon(MARKER_COLOR);

export const pinIconEdit = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#e2685a;border:2px solid #0b0e13;border-radius:50%;box-shadow:0 0 4px rgba(226,104,90,0.25);cursor:pointer"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});
