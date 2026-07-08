import { createSetting, keyNormalizer } from '../../utils/createSetting';
import { getStoredMapStyle, setStoredMapStyle } from '../../api/client';

// Per-device map base style. All three come from CARTO (one provider, one
// attribution — the same string MapView already uses), so switching is just a
// tile-URL swap. `dark` matches the app's dark theme and is the default.
export const BASEMAPS = {
  dark:    { label: 'Imprint Dark',    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png' },
  light:   { label: 'Imprint Light',   url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png' },
  streets: { label: 'Streets', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png' },
};

export const BASEMAP_ORDER = ['dark', 'light', 'streets'];
export const DEFAULT_BASEMAP = 'dark';

// Module-level setting so the picker (settings) and the renderer (MapView) share
// one source of truth and the map re-tiles the instant the style changes.
const basemap = createSetting({
  read: getStoredMapStyle,
  write: setStoredMapStyle,
  normalize: keyNormalizer(BASEMAPS, DEFAULT_BASEMAP),
});

export const setBasemap = basemap.set;
// [basemap, setBasemap] — subscribes so any consumer re-renders on change.
export const useBasemap = basemap.use;
