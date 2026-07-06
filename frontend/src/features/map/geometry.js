// Pure computational geometry over GeoJSON Polygon/MultiPolygon geometries:
// point-in-polygon (ray casting, bbox-accelerated) and geodesic area. No network,
// no React — shared by the discovery gauge and the badges' visited-region checks,
// so neither depends on the other's feature code.

const EARTH_RADIUS_M = 6371000;

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
