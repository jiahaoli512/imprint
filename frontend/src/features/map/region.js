import { CONTINENT } from './geo';
import { fetchNominatim } from './nominatim';

// Zoom → place-naming concern: maps a zoom level to a place granularity, picks
// the right name field from a reverse-geocode result, and calls Nominatim. Split
// out of the old mapUtils grab-bag (network + naming, distinct from pure geo).

export function getLevel(zoom) {
  // <=3 covers the hemispheric, multi-continent view → treat as Earth.
  // 'continent' kicks in only once you're zoomed to roughly a single continent.
  if (zoom <= 3)  return 'earth';
  if (zoom <= 4)  return 'continent';
  if (zoom <= 6)  return 'country';
  if (zoom <= 9)  return 'state';
  if (zoom <= 12) return 'county';
  return 'city';
}

export function pickName(addr, level) {
  if (level === 'earth')     return 'Earth';
  if (level === 'continent') return CONTINENT[addr.country_code?.toUpperCase()] || addr.country || '';
  if (level === 'country')   return addr.country || '';
  if (level === 'state')     return addr.state || addr.country || '';
  if (level === 'county')    return addr.county || addr.municipality || addr.state || '';
  return addr.city || addr.town || addr.village || addr.hamlet || addr.county || '';
}

// Used by RegionDetector on every pan/zoom to drive the toolbar's live place
// label — so a failure here must resolve to null, not throw, or the caller's
// `await` would hang the label update / surface an unhandled rejection (unlike
// discovery.js's fetchRegionGeometry, which deliberately DOES throw so its
// caller can show an explicit error state).
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&addressdetails=1`;
  try {
    const data = await fetchNominatim(url);
    if (data.error) return null;
    return data.address || null;
  } catch {
    return null; // timed out, rate-limited, or otherwise failed — leave unnamed
  }
}
