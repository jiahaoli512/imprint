// Discovery-percentage logic for the dashboard gauge. Pure geo helpers + a
// cached Nominatim boundary fetch — kept out of the React/map layer so it stays
// testable. The metric is "discovered grid cells": the region is split into
// cells sized by zoom level, a cell counts once any marker falls in it, and the
// percentage is the discovered cell area over the region's true area.
import { getLevel, CONTINENT } from './mapUtils';

const EARTH_RADIUS_M = 6371000;
const M_PER_DEG = 111320; // metres per degree of latitude (≈ constant)

// Grid cell size (degrees) per level — the discovery "resolution". Smaller cells
// at finer levels so a city reads differently from a country. Main tuning knob.
// Each region is divided into ~TARGET_CELLS grid cells sized from the region's
// OWN area, so the metric is scale-invariant: a marker can never claim half a
// small city (a fixed-degree cell did — e.g. one tile = 50% of tiny Temple City).
// The percentage is effectively "fraction of the region's cells you've touched",
// so small towns are genuinely discoverable (a resident can reach 60%+) while a
// megacity stays low for the same behaviour. Tuned so an active city local reads
// ~15-18% and a pure commuter ~3%.
const TARGET_CELLS = 300;
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

// Module-level cache so panning within one region doesn't refetch its boundary.
const geometryCache = new Map();

// --- geometry helpers --------------------------------------------------------

// Ray-casting point-in-polygon for a single ring ([[lng,lat], ...]).
function pointInRing(lng, lat, ring) {
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
function pointInPolygonRings(lng, lat, rings) {
  if (!pointInRing(lng, lat, rings[0])) return false;
  for (let h = 1; h < rings.length; h++) {
    if (pointInRing(lng, lat, rings[h])) return false;
  }
  return true;
}

// True if [lat,lng] is inside a GeoJSON Polygon or MultiPolygon geometry.
export function pointInGeometry(lat, lng, geometry) {
  if (!geometry) return true; // no polygon (earth/continent) → count everything
  if (geometry.type === 'Polygon') return pointInPolygonRings(lng, lat, geometry.coordinates);
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates.some((rings) => pointInPolygonRings(lng, lat, rings));
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
  const res = await fetch(url);
  const data = await res.json();

  let result;
  if (level === 'continent') {
    // No admin polygon for continents — resolve the continent from the country
    // code and use its static area so the percentage denominator is correct.
    const cc = data?.address?.country_code?.toUpperCase();
    const name = CONTINENT[cc] || data?.address?.country || '';
    result = { name, geometry: null, areaM2: (STATIC_AREA_KM2[name] || 0) * 1e6 };
  } else {
    const geometry = data?.geojson && /Polygon$/.test(data.geojson.type) ? data.geojson : null;
    result = {
      name: data?.name || data?.display_name?.split(',')[0] || '',
      geometry,
      areaM2: geometry ? polygonAreaM2(geometry) : 0,
    };
  }
  geometryCache.set(key, result);
  return result;
}

// --- the metric --------------------------------------------------------------

// Computes the discovery percentage for the given markers within a region.
// `region` is the { geometry, areaM2 } from fetchRegionGeometry; `regionName`
// lets continent/earth pick a static area. Returns percent + supporting counts.
export function computeDiscovery(markers, region, refLat, regionName) {
  // Region area: polygon area when we have one, else the static table.
  let regionAreaM2 = region?.areaM2 || 0;
  if (!regionAreaM2) {
    const km2 = STATIC_AREA_KM2[regionName] || STATIC_AREA_KM2.earth;
    regionAreaM2 = km2 * 1e6;
  }

  // Cell side scales with the region's own area (floored near marker spacing).
  // Longitude cells shrink toward the poles so cells stay roughly square in m².
  const phi = (refLat * Math.PI) / 180;
  const side = Math.max(Math.sqrt(regionAreaM2 / TARGET_CELLS), MIN_CELL_M);
  const cellDegLat = side / M_PER_DEG;
  const cellDegLng = side / (M_PER_DEG * Math.max(Math.cos(phi), 0.01));
  const cellAreaM2 = side * side;

  const cells = new Set();
  for (const [lat, lng] of markers) {
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    if (region?.geometry && !pointInGeometry(lat, lng, region.geometry)) continue;
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
