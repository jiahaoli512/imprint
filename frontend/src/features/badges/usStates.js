import { computeVisitedKeys } from './visitedFeatures';

// Lazily loads US state boundary polygons keyed by state name (the badge label).
// us-atlas (Census TopoJSON) + topojson-client are only ever pulled in through
// these dynamic imports, so they land in a separate chunk that's fetched once,
// the first time the US-states badges are viewed.

let featuresPromise = null;

// Returns [{ key, geometry }] for every state/territory (key = state name),
// memoized.
function loadStateFeatures() {
  if (!featuresPromise) {
    featuresPromise = Promise.all([
      import('us-atlas/states-10m.json'),
      import('topojson-client'),
    ]).then(([topoMod, topojson]) => {
      const topo = topoMod.default || topoMod;
      const fc = topojson.feature(topo, topo.objects.states);
      return fc.features.map((f) => ({ key: f.properties.name, geometry: f.geometry }));
    });
  }
  return featuresPromise;
}

// Resolves to a Set of state names that contain at least one marker.
export function computeVisitedStates(markers) {
  return computeVisitedKeys(markers, loadStateFeatures);
}
