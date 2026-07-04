import { useState, useEffect } from 'react';
import { createStore } from '../location/createStore';
import { getStoredMapStyle, setStoredMapStyle } from '../../api/client';

// Per-device map base style. All three come from CARTO (one provider, one
// attribution — the same string MapView already uses), so switching is just a
// tile-URL swap. `dark` matches the app's dark theme and is the default.
export const BASEMAPS = {
  dark:    { label: 'Dark',    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png' },
  light:   { label: 'Light',   url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png' },
  streets: { label: 'Streets', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png' },
};

export const BASEMAP_ORDER = ['dark', 'light', 'streets'];
export const DEFAULT_BASEMAP = 'dark';

// Coerce any stored/incoming value to a known style.
function normalize(s) {
  return s && Object.prototype.hasOwnProperty.call(BASEMAPS, s) ? s : DEFAULT_BASEMAP;
}

// Module-level store so the picker (settings) and the renderer (MapView) share one
// source of truth and the map re-tiles the instant the style changes.
const basemapStore = createStore(normalize(getStoredMapStyle()));

export function setBasemap(s) {
  const next = normalize(s);
  setStoredMapStyle(next); // persist per-device
  basemapStore.set(next);
}

// [basemap, setBasemap] — subscribes so any consumer re-renders on change.
export function useBasemap() {
  const [basemap, setLocal] = useState(basemapStore.get());
  useEffect(() => basemapStore.subscribe(setLocal), []);
  return [basemap, setBasemap];
}
