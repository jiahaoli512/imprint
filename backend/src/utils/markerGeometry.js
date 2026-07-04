// Pure spatial geometry for map markers — no DB, no models. Separated from
// markerService (persistence) so the marker-thinning math can be reused (e.g. by
// the markers:respace migration) without pulling in the data layer, and so the
// proximity-grid internals stay private behind thinPoints / createProximityGrid.

// Minimum spacing between markers. Decoupled from the render radius: at ~100m a
// commute leaves a sparse trail of distinct markers rather than a continuous
// overlapping tube. Mirrors the 100m distanceFilter on the native tracker.
const MARKER_SPACING_M = 100;

const M_PER_DEG_LAT = 111320; // metres per degree of latitude (≈ constant)

// Haversine distance in metres between two [lat, lng] points.
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// A spatial hash grid over [lat, lng] markers, giving O(1) "is any existing
// marker within `spacing` metres?" lookups. Cells are sized to `spacing`, so a
// point can only be within range of markers in its own cell or the 8 around it
// — this turns the marker thinning from O(n²) (scan all kept markers each time)
// into O(n), and skips the haversine for all the far-away markers.
function createProximityGrid(spacing) {
  const cellLatDeg = spacing / M_PER_DEG_LAT;
  // Longitude degrees-per-metre shrink toward the poles, so size the lng cell
  // per-latitude to keep cells ≈ `spacing` metres wide.
  const cellLngDeg = (lat) => spacing / (M_PER_DEG_LAT * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  const cellOf = (lat, lng) => [Math.floor(lat / cellLatDeg), Math.floor(lng / cellLngDeg(lat))];
  const cells = new Map(); // "gx:gy" -> [[lat, lng], ...]

  return {
    // True if an already-added marker lies within `spacing` metres of [lat, lng].
    hasWithinSpacing(lat, lng) {
      const [gx, gy] = cellOf(lat, lng);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const bucket = cells.get(`${gx + dx}:${gy + dy}`);
          if (!bucket) continue;
          for (const [mLat, mLng] of bucket) {
            if (distanceMeters(lat, lng, mLat, mLng) < spacing) return true;
          }
        }
      }
      return false;
    },
    add(lat, lng) {
      const [gx, gy] = cellOf(lat, lng);
      const k = `${gx}:${gy}`;
      const bucket = cells.get(k);
      if (bucket) bucket.push([lat, lng]);
      else cells.set(k, [[lat, lng]]);
    },
  };
}

// Greedily thins a list of [lat, lng] markers so no two kept markers are closer
// than `spacing` metres — keeping the first of each cluster, in order. Shared by
// the passive ingest path and the one-off re-spacing migration.
function thinPoints(points, spacing = MARKER_SPACING_M) {
  const grid = createProximityGrid(spacing);
  const kept = [];
  for (const [lat, lng] of points) {
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    if (!grid.hasWithinSpacing(lat, lng)) {
      grid.add(lat, lng);
      kept.push([lat, lng]);
    }
  }
  return kept;
}

module.exports = { MARKER_SPACING_M, M_PER_DEG_LAT, distanceMeters, createProximityGrid, thinPoints };
