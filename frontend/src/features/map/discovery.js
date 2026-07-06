// Discovery-percentage logic for the dashboard gauge. Pure geo helpers + a
// cached Nominatim boundary fetch — kept out of the React/map layer so it stays
// testable. The metric is "discovered grid cells": the region is split into
// cells sized by zoom level, a cell counts once any marker falls in it, and the
// percentage is the discovered cell area over the region's true area.
import { continentContaining, oceanAt, CONTINENT_BBOX, inBBox } from './geo';
import { pointInGeometry, polygonAreaM2 } from './geometry';

const M_PER_DEG = 111320; // metres per degree of latitude (≈ constant)

// Each region is divided into ~TARGET_CELLS[level] grid cells sized from the
// region's OWN area, so the metric is scale-invariant: a marker can never claim
// half a small city (a fixed-degree cell did — e.g. one tile = 50% of tiny
// Temple City). The percentage is effectively "fraction of the region's cells
// you've touched", so small towns are genuinely discoverable (a resident can
// reach 60%+) while a megacity stays low for the same behaviour. Targets rise
// with level so coarse regions keep geographically sensible cell sizes (a flat
// target would make a country-cell ~180 km wide) and the percentage degrades
// monotonically as you zoom out. Tuned so an active city local reads ~15% and a
// pure commuter ~3%.
//
// The macro levels (state→earth) climb steeply: one cell is worth (100/target)%
// regardless of region size, so a shallow progression let a single GPS ping
// claim a huge slice of a continent/planet (4000 earth cells = 357 km/cell, so
// ~5 scattered points read 0.1%). At earth=50000 a cell is ~101 km and ~10
// far-flung points read <0.1%, which is the intended "barely anything" planet
// score. city/county stay low so they remain scale-invariant for nearly all
// real regions (the MIN_CELL_M floor below only bites under ~4.3 km² / 11.5 km²).
const TARGET_CELLS = {
  city: 300, county: 800, state: 2500, country: 8000, continent: 20000, earth: 50000,
};
// Floor the cell side near the marker spacing so very small regions don't give
// every marker its own cell.
const MIN_CELL_M = 120;

// Our region level → Nominatim reverse `zoom` (controls which admin entity, and
// thus which boundary polygon, is returned). earth/continent never reach the
// fetch — they resolve to static areas before it.
const LEVEL_NOMINATIM_ZOOM = { country: 3, state: 5, county: 8, city: 10 };

// Static fallback areas (km²) for levels Nominatim can't return a polygon for.
const STATIC_AREA_KM2 = {
  earth: 510100000, // whole surface
  Asia: 44579000, Europe: 10180000, Africa: 30370000,
  'North America': 24709000, 'South America': 17840000,
  Oceania: 8526000, Antarctica: 14200000,
};

// Continent/ocean naming helpers (continentContaining, oceanAt, CONTINENT_BBOX,
// inBBox) live in geo.js so the toolbar label and this module resolve water the
// same way. See the imports above.

// Bounded cache so panning within one region doesn't refetch its boundary. Keyed
// by level + rounded lat/lng (approximate — can reuse a neighbour near a border,
// an acceptable trade for far fewer Nominatim calls). Capped so a long session
// can't grow it without limit.
const geometryCache = new Map();
const GEOMETRY_CACHE_MAX = 200;
const NOMINATIM_TIMEOUT_MS = 8000;

function cacheGeometry(key, value) {
  geometryCache.set(key, value);
  if (geometryCache.size > GEOMETRY_CACHE_MAX) {
    geometryCache.delete(geometryCache.keys().next().value); // evict oldest (insertion order)
  }
  return value;
}

// --- region boundary fetch (Nominatim) --------------------------------------

// Resolves the region's name, boundary geometry, and area for a settled point at
// a given level. Cached; earth/continent skip the network and use static areas.
export async function fetchRegionGeometry(lat, lng, level) {
  if (level === 'earth') {
    return { name: 'Earth', geometry: null, areaM2: STATIC_AREA_KM2.earth * 1e6 };
  }

  // Open water: a centre outside every continent box is over open ocean. The
  // continent boxes are coast-inclusive, so coastal/inland views still resolve
  // to land — only genuinely oceanic centres land here. Naming it from the
  // coordinate avoids reverse-geocoding (which returns no country at sea and
  // errored the panel). `ocean: true` tells computeDiscovery there's nothing to
  // discover, and `level: 'ocean'` drives the panel's "Ocean" label.
  const continent = continentContaining(lat, lng);
  if (!continent) {
    return { name: oceanAt(lat, lng), level: 'ocean', ocean: true, geometry: null, areaM2: 0 };
  }

  // Continents have no admin polygon — resolve from the (containing) box. The
  // box also bounds marker membership in computeDiscovery.
  if (level === 'continent') {
    return { name: continent, geometry: null, bbox: CONTINENT_BBOX[continent], areaM2: STATIC_AREA_KM2[continent] * 1e6 };
  }

  // City boundaries are small, so a ~1.1km (2-decimal) cell straddles them and
  // would reuse a neighbouring city's polygon across a border. Key city level to
  // ~110m (3 decimals) so crossing into the next city refetches the right region;
  // coarser levels keep the cheaper 2-decimal cell.
  const prec = level === 'city' ? 3 : 2;
  const key = `${level}:${lat.toFixed(prec)}:${lng.toFixed(prec)}`;
  if (geometryCache.has(key)) return geometryCache.get(key);

  const zoom = LEVEL_NOMINATIM_ZOOM[level];
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}` +
    `&zoom=${zoom}&polygon_geojson=1&polygon_threshold=0.01&addressdetails=1&accept-language=en`;

  // Bound the request and treat a non-2xx (e.g. 429 rate limit) or non-JSON body
  // as a failure rather than letting res.json() throw an opaque error. We throw
  // so useDiscovery can show its error state; failures aren't cached.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);
  let data;
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    data = await res.json();
  } finally {
    clearTimeout(timer);
  }

  const geometry = data?.geojson && /Polygon$/.test(data.geojson.type) ? data.geojson : null;
  const name = data?.name || data?.display_name?.split(',')[0] || '';

  // Coastal water: inside a continent box (so not open ocean above) but no land
  // under the centre, so Nominatim names nothing. Fall back to the nearest
  // continent — its name, area and 'continent' level — so the panel shows the
  // continent's coverage instead of a dash, matching the toolbar label.
  if (!name && !geometry) {
    const result = { name: continent, level: 'continent', geometry: null, bbox: CONTINENT_BBOX[continent], areaM2: STATIC_AREA_KM2[continent] * 1e6 };
    return cacheGeometry(key, result);
  }

  const result = {
    name,
    geometry,
    areaM2: geometry ? polygonAreaM2(geometry) : 0,
  };
  return cacheGeometry(key, result);
}

// --- the metric --------------------------------------------------------------

// A latitude tied to the REGION (not the live map view) for the cell-width
// cosine, so the grid — and therefore the percentage — is identical no matter
// where you pan/zoom within the same region. Uses the polygon's latitude-extent
// centre (memoized), the bbox centre for continents, or 0 for earth. Previously
// this was the map centre, so panning resized cells and the % drifted slightly.
function regionRefLat(region) {
  if (region?.geometry) {
    if (region.__refLat != null) return region.__refLat;
    let minY = Infinity, maxY = -Infinity;
    const scan = (rings) => {
      for (const ring of rings) for (const [, y] of ring) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    };
    if (region.geometry.type === 'MultiPolygon') region.geometry.coordinates.forEach(scan);
    else scan(region.geometry.coordinates);
    region.__refLat = (minY + maxY) / 2;
    return region.__refLat;
  }
  if (region?.bbox) return (region.bbox[1] + region.bbox[3]) / 2;
  return 0;
}

// Computes the discovery percentage for the given markers within a region.
// `region` is the { geometry, areaM2 } from fetchRegionGeometry; `regionName`
// lets continent/earth pick a static area. Returns percent + supporting counts.
export function computeDiscovery(markers, region, level, regionName) {
  // Open ocean: nothing to discover (this is a land app, and there's no reliable
  // ocean polygon to filter markers against). Report 0% so the panel still shows
  // the ocean name and gauge rather than erroring.
  if (region?.ocean) {
    return { percent: 0, discoveredCells: 0, discoveredAreaKm2: 0, regionAreaKm2: 0 };
  }

  // Region area: polygon area when we have one, else the static table.
  let regionAreaM2 = region?.areaM2 || 0;
  if (!regionAreaM2) {
    const km2 = STATIC_AREA_KM2[regionName] || STATIC_AREA_KM2.earth;
    regionAreaM2 = km2 * 1e6;
  }

  // Cell side scales with the region's own area (floored near marker spacing).
  // Longitude cells shrink toward the poles so cells stay roughly square in m².
  // The reference latitude comes from the region itself (stable), not the map
  // view, so the grid doesn't shift as you pan/zoom within one region.
  const phi = (regionRefLat(region) * Math.PI) / 180;
  const target = TARGET_CELLS[level] ?? TARGET_CELLS.country;
  const side = Math.max(Math.sqrt(regionAreaM2 / target), MIN_CELL_M);
  const cellDegLat = side / M_PER_DEG;
  const cellDegLng = side / (M_PER_DEG * Math.max(Math.cos(phi), 0.01));
  const cellAreaM2 = side * side;

  // Region membership: exact polygon when we have one (city…country), a rough
  // bounding box at continent level, and no filter for earth (everything counts).
  const inRegion = (lat, lng) => {
    if (region?.geometry) return pointInGeometry(lat, lng, region.geometry);
    if (region?.bbox) return inBBox(lat, lng, region.bbox);
    return true;
  };

  // Bucket markers into grid cells first (cheap floor + Map), then run the
  // expensive point-in-region polygon test once per *unique cell* instead of
  // once per marker. `markers` is the full un-thinned set (can be thousands),
  // while unique cells are bounded (~TARGET_CELLS), so this cuts the polygon
  // ray-casts from O(markers) to O(unique cells). Cells are near marker-spacing
  // small, so a cell's first marker is a faithful representative for membership.
  const cellRep = new Map(); // cellKey -> representative [lat, lng]
  for (const [lat, lng] of markers) {
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    const key = `${Math.floor(lat / cellDegLat)}:${Math.floor(lng / cellDegLng)}`;
    if (!cellRep.has(key)) cellRep.set(key, [lat, lng]);
  }
  let discoveredCells = 0;
  for (const [lat, lng] of cellRep.values()) {
    if (inRegion(lat, lng)) discoveredCells++;
  }

  const discoveredAreaM2 = discoveredCells * cellAreaM2;
  const percent = regionAreaM2 > 0
    ? Math.min(100, Math.max(0, (discoveredAreaM2 / regionAreaM2) * 100))
    : 0;

  return {
    percent,
    discoveredCells,
    discoveredAreaKm2: discoveredAreaM2 / 1e6,
    regionAreaKm2: regionAreaM2 / 1e6,
  };
}
