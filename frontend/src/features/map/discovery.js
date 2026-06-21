// Discovery-percentage logic for the dashboard gauge. Pure geo helpers + a
// cached Nominatim boundary fetch — kept out of the React/map layer so it stays
// testable. The metric is "discovered grid cells": the region is split into
// cells sized by zoom level, a cell counts once any marker falls in it, and the
// percentage is the discovered cell area over the region's true area.
import { getLevel, CONTINENT } from './mapUtils';

const EARTH_RADIUS_M = 6371000;
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
const TARGET_CELLS = {
  city: 300, county: 600, state: 1200, country: 2000, continent: 2500, earth: 4000,
};
// Floor the cell side near the marker spacing so very small regions don't give
// every marker its own cell.
const MIN_CELL_M = 120;

// Our region level → Nominatim reverse `zoom` (controls which admin entity, and
// thus which boundary polygon, is returned). earth/continent have no admin
// polygon and use static areas instead.
const LEVEL_NOMINATIM_ZOOM = { country: 3, state: 5, county: 8, city: 10 };

// Static fallback areas (km²) for levels Nominatim can't return a polygon for.
const STATIC_AREA_KM2 = {
  earth: 510100000, // whole surface
  Asia: 44579000, Europe: 10180000, Africa: 30370000,
  'North America': 24709000, 'South America': 17840000,
  Oceania: 8526000, Antarctica: 14200000,
};

// Approximate continent bounding boxes [minLng, minLat, maxLng, maxLat]. There
// are no continent boundary polygons from Nominatim, so at continent level we
// filter markers to a rough box instead — far better than counting every marker
// on the planet toward one continent (which the polygon-less path used to do).
// Boxes are intentionally generous and overlap at the Eurasia seam; a box whose
// minLng > maxLng wraps the antimeridian (matches lng >= minLng OR lng <= maxLng).
const CONTINENT_BBOX = {
  'North America': [-170, 7, -50, 84],
  'South America': [-82, -56, -34, 13],
  Europe: [-25, 34, 45, 72],
  Africa: [-18, -35, 52, 38],
  Asia: [25, 0, 180, 81],
  Oceania: [110, -50, -150, 10], // wraps the antimeridian (Australia → Pacific)
  Antarctica: [-180, -90, 180, -60],
};

// Point-in-box test that supports antimeridian wrap (minLng > maxLng).
function inBBox(lat, lng, [minLng, minLat, maxLng, maxLat]) {
  if (lat < minLat || lat > maxLat) return false;
  return minLng <= maxLng ? (lng >= minLng && lng <= maxLng) : (lng >= minLng || lng <= maxLng);
}

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

// --- geometry helpers --------------------------------------------------------

// Ray-casting point-in-polygon for a single ring ([[lng,lat], ...]).
// Axis-aligned bounding box [minLng, minLat, maxLng, maxLat] of a ring. Computed
// once per geometry (memoized on the geometry object) so the per-marker test can
// reject points outside the box in O(1), before the O(vertices) ray cast.
function ringBBox(ring) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

function outsideBBox(lng, lat, bbox) {
  return lng < bbox[0] || lng > bbox[2] || lat < bbox[1] || lat > bbox[3];
}

// Bounding boxes parallel to a geometry's coordinates (per ring, per polygon),
// memoized on the geometry so we build them once rather than per marker.
function bboxesFor(geometry) {
  if (geometry.__bboxes) return geometry.__bboxes;
  const perRings = (rings) => rings.map(ringBBox);
  geometry.__bboxes = geometry.type === 'MultiPolygon'
    ? geometry.coordinates.map(perRings)
    : perRings(geometry.coordinates);
  return geometry.__bboxes;
}

// Ray-casting point-in-polygon for a single ring ([[lng,lat], ...]). `bbox` is
// the ring's precomputed box; a point outside it can't be inside the ring, so
// we skip the full vertex scan.
function pointInRing(lng, lat, ring, bbox) {
  if (bbox && outsideBBox(lng, lat, bbox)) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = (yi > lat) !== (yj > lat) &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// A GeoJSON Polygon is [outerRing, ...holes]; inside = in outer and in no hole.
// `bboxes` is the parallel per-ring box array.
function pointInPolygonRings(lng, lat, rings, bboxes) {
  if (!pointInRing(lng, lat, rings[0], bboxes && bboxes[0])) return false;
  for (let h = 1; h < rings.length; h++) {
    if (pointInRing(lng, lat, rings[h], bboxes && bboxes[h])) return false;
  }
  return true;
}

// True if [lat,lng] is inside a GeoJSON Polygon or MultiPolygon geometry.
export function pointInGeometry(lat, lng, geometry) {
  if (!geometry) return true; // no polygon (earth/continent) → count everything
  const boxes = bboxesFor(geometry);
  if (geometry.type === 'Polygon') return pointInPolygonRings(lng, lat, geometry.coordinates, boxes);
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates.some((rings, i) => pointInPolygonRings(lng, lat, rings, boxes[i]));
  return false;
}

// Geodesic area (m²) of one ring via the spherical excess / shoelace formula.
function ringAreaM2(ring) {
  let total = 0;
  const toRad = (d) => (d * Math.PI) / 180;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % n];
    total += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

// Area (m²) of a Polygon/MultiPolygon, subtracting holes.
export function polygonAreaM2(geometry) {
  if (!geometry) return 0;
  const polyArea = (rings) =>
    rings.reduce((sum, ring, i) => sum + (i === 0 ? ringAreaM2(ring) : -ringAreaM2(ring)), 0);
  if (geometry.type === 'Polygon') return polyArea(geometry.coordinates);
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates.reduce((sum, rings) => sum + polyArea(rings), 0);
  return 0;
}

// --- region boundary fetch (Nominatim) --------------------------------------

// Resolves the region's name, boundary geometry, and area for a settled point at
// a given level. Cached; earth/continent skip the network and use static areas.
export async function fetchRegionGeometry(lat, lng, level) {
  if (level === 'earth') {
    return { name: 'Earth', geometry: null, areaM2: STATIC_AREA_KM2.earth * 1e6 };
  }

  const key = `${level}:${lat.toFixed(2)}:${lng.toFixed(2)}`;
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

  let result;
  if (level === 'continent') {
    // No admin polygon for continents — resolve the continent from the country
    // code and use its static area so the percentage denominator is correct.
    const cc = data?.address?.country_code?.toUpperCase();
    const name = CONTINENT[cc] || data?.address?.country || '';
    const areaKm2 = STATIC_AREA_KM2[name] || 0;
    // Don't let an unmapped continent silently fall through to Earth's area
    // (which would show a planet-scale denominator while the UI says continent).
    if (!areaKm2) throw new Error('Unknown continent');
    // Attach the rough bbox so computeDiscovery only counts markers on this
    // continent (no polygon available — see CONTINENT_BBOX).
    result = { name, geometry: null, bbox: CONTINENT_BBOX[name] || null, areaM2: areaKm2 * 1e6 };
  } else {
    const geometry = data?.geojson && /Polygon$/.test(data.geojson.type) ? data.geojson : null;
    result = {
      name: data?.name || data?.display_name?.split(',')[0] || '',
      geometry,
      areaM2: geometry ? polygonAreaM2(geometry) : 0,
    };
  }
  return cacheGeometry(key, result);
}

// --- the metric --------------------------------------------------------------

// Computes the discovery percentage for the given markers within a region.
// `region` is the { geometry, areaM2 } from fetchRegionGeometry; `regionName`
// lets continent/earth pick a static area. Returns percent + supporting counts.
export function computeDiscovery(markers, region, level, refLat, regionName) {
  // Region area: polygon area when we have one, else the static table.
  let regionAreaM2 = region?.areaM2 || 0;
  if (!regionAreaM2) {
    const km2 = STATIC_AREA_KM2[regionName] || STATIC_AREA_KM2.earth;
    regionAreaM2 = km2 * 1e6;
  }

  // Cell side scales with the region's own area (floored near marker spacing).
  // Longitude cells shrink toward the poles so cells stay roughly square in m².
  const phi = (refLat * Math.PI) / 180;
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

  const cells = new Set();
  for (const [lat, lng] of markers) {
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    if (!inRegion(lat, lng)) continue;
    cells.add(`${Math.floor(lat / cellDegLat)}:${Math.floor(lng / cellDegLng)}`);
  }

  const discoveredAreaM2 = cells.size * cellAreaM2;
  const percent = regionAreaM2 > 0
    ? Math.min(100, Math.max(0, (discoveredAreaM2 / regionAreaM2) * 100))
    : 0;

  return {
    percent,
    discoveredCells: cells.size,
    discoveredAreaKm2: discoveredAreaM2 / 1e6,
    regionAreaKm2: regionAreaM2 / 1e6,
  };
}

export { getLevel };
