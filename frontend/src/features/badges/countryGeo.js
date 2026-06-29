import { computeVisitedKeys } from './visitedFeatures';

// Lazily loads world country boundary polygons keyed by ISO 3166-1 numeric id
// (matches passportCountries `num`). world-atlas (Natural Earth 50m TopoJSON) +
// topojson-client are only ever pulled in through these dynamic imports, so they
// land in a separate chunk that's fetched once, the first time the Passports
// badges are viewed.

let featuresPromise = null;

// Returns [{ key, geometry }] for every country (key = ISO numeric code), memoized.
function loadCountryFeatures() {
  if (!featuresPromise) {
    featuresPromise = Promise.all([
      import('world-atlas/countries-50m.json'),
      import('topojson-client'),
    ]).then(([topoMod, topojson]) => {
      const topo = topoMod.default || topoMod;
      const fc = topojson.feature(topo, topo.objects.countries);
      return fc.features.map((f) => ({ key: String(f.id), geometry: f.geometry }));
    });
  }
  return featuresPromise;
}

// Resolves to a Set of ISO numeric codes for countries that contain a marker.
export function computeVisitedCountries(markers) {
  return computeVisitedKeys(markers, loadCountryFeatures);
}
