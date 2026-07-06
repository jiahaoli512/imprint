import { pointInGeometry } from '../map/geometry';

// Overall [minLng, minLat, maxLng, maxLat] bbox of a feature's geometry, memoized
// on the feature. A single-rectangle reject: cheaper than pointInGeometry's
// per-polygon-part bbox scan for far-away markers (a multi-island country can
// have dozens of parts). Features come from a memoized loader, so this is
// computed once and reused across recomputes.
function featureBBox(f) {
  if (f.__bbox) return f.__bbox;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  const scan = (rings) => {
    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  };
  const g = f.geometry;
  if (g.type === 'Polygon') scan(g.coordinates);
  else if (g.type === 'MultiPolygon') g.coordinates.forEach(scan);
  f.__bbox = [minLng, minLat, maxLng, maxLat];
  return f.__bbox;
}

// Shared "which regions contain a marker?" resolver, used by every passport
// category (US states, countries, …). Given a marker list and a set of features
// shaped `[{ key, geometry }]`, returns a Set of the keys that contain at least
// one marker. Markers are [lat, lng] pairs. Reuses discovery's bbox-prefiltered
// point-in-polygon; dedups markers to a coarse grid and exits early once every
// feature is matched. Callers supply the boundary data via a `loadFeatures`
// thunk so the (heavy, lazy) geo data is only imported when actually needed.
export async function computeVisitedKeys(markers, loadFeatures) {
  const visited = new Set();
  if (!Array.isArray(markers) || markers.length === 0) return visited;

  const features = await loadFeatures();
  const seen = new Set();
  for (const m of markers) {
    const lat = m[0];
    const lng = m[1];
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    // Collapse near-duplicate markers (~5km grid) so clustered points test once.
    const key = `${Math.round(lat / 0.05)}:${Math.round(lng / 0.05)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    for (const f of features) {
      if (visited.has(f.key)) continue;
      // Cheap whole-feature bbox reject before the per-part polygon test.
      const [minLng, minLat, maxLng, maxLat] = featureBBox(f);
      if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue;
      if (pointInGeometry(lat, lng, f.geometry)) { visited.add(f.key); break; }
    }
    if (visited.size === features.length) break;
  }
  return visited;
}
