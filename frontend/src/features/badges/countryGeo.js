import { pointInGeometry } from '../map/discovery';

// Lazily loads world country boundary polygons and decides which countries a set
// of markers falls in. world-atlas (Natural Earth 50m TopoJSON) + topojson-client
// are only ever pulled in through these dynamic imports, so they land in a separate
// chunk that's fetched once, the first time the Passports badges are viewed.

let featuresPromise = null;

// Returns [{ num, geometry }] for every country, keyed by the feature's ISO 3166-1
// numeric id (matches passportCountries `num`). Memoized.
function loadCountryFeatures() {
  if (!featuresPromise) {
    featuresPromise = Promise.all([
      import('world-atlas/countries-50m.json'),
      import('topojson-client'),
    ]).then(([topoMod, topojson]) => {
      const topo = topoMod.default || topoMod;
      const fc = topojson.feature(topo, topo.objects.countries);
      return fc.features.map((f) => ({ num: String(f.id), geometry: f.geometry }));
    });
  }
  return featuresPromise;
}

// Resolves to a Set of ISO numeric codes for countries that contain at least one
// marker. Markers are [lat, lng] pairs. Reuses discovery's bbox-prefiltered
// point-in-polygon; dedups markers to a coarse grid and exits early once every
// country is matched.
export async function computeVisitedCountries(markers) {
  const visited = new Set();
  if (!Array.isArray(markers) || markers.length === 0) return visited;

  const features = await loadCountryFeatures();
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
      if (visited.has(f.num)) continue;
      if (pointInGeometry(lat, lng, f.geometry)) { visited.add(f.num); break; }
    }
    if (visited.size === features.length) break;
  }
  return visited;
}
