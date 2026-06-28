import { pointInGeometry } from '../map/discovery';

// Lazily loads US state boundary polygons and decides which states a set of
// markers falls in. us-atlas (Census TopoJSON) + topojson-client are only ever
// pulled in through these dynamic imports, so they land in a separate chunk
// that's fetched once, the first time the US-states badges are viewed.

let featuresPromise = null;

// Returns [{ name, geometry }] for every state/territory, memoized.
function loadStateFeatures() {
  if (!featuresPromise) {
    featuresPromise = Promise.all([
      import('us-atlas/states-10m.json'),
      import('topojson-client'),
    ]).then(([topoMod, topojson]) => {
      const topo = topoMod.default || topoMod;
      const fc = topojson.feature(topo, topo.objects.states);
      return fc.features.map((f) => ({ name: f.properties.name, geometry: f.geometry }));
    });
  }
  return featuresPromise;
}

// Resolves to a Set of state names that contain at least one marker. Markers are
// [lat, lng] pairs. Reuses discovery's bbox-prefiltered point-in-polygon; dedups
// markers to a coarse grid and exits early once every state is matched.
export async function computeVisitedStates(markers) {
  const visited = new Set();
  if (!Array.isArray(markers) || markers.length === 0) return visited;

  const features = await loadStateFeatures();
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
      if (visited.has(f.name)) continue;
      if (pointInGeometry(lat, lng, f.geometry)) { visited.add(f.name); break; }
    }
    if (visited.size === features.length) break;
  }
  return visited;
}
