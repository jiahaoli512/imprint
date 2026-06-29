const MapMarkers = require('../models/MapMarkers');
const User = require('../models/User');
const httpError = require('../utils/httpError');
const { normalizeUsername, validatePoints } = require('../utils/validate');

const MARKER_RADIUS_M = 15.24;   // matches the circle drawn on the map (~30m wide)
// Minimum spacing between markers. Decoupled from the render radius: at ~100m a
// commute leaves a sparse trail of distinct markers rather than a continuous
// overlapping tube. Mirrors the 100m distanceFilter on the native tracker.
const MARKER_SPACING_M = 100;

const M_PER_DEG_LAT = 111320; // metres per degree of latitude (≈ constant)

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

// Resolves a username to its user id (the MapMarkers key), normalizing first and
// 404ing if there's no such user. Centralizes the lookup the username-keyed
// marker calls share. Returns the id as a string.
async function userIdForUsername(username) {
  const user = await User.findOne({ username: normalizeUsername(username) }, '_id');
  if (!user) throw httpError(404, 'User not found');
  return user._id.toString();
}

async function getAdminMarkers() {
  const doc = await MapMarkers.findById('singleton');
  return doc ? doc.points : [];
}

async function getUserMarkers(username) {
  const doc = await MapMarkers.findById(await userIdForUsername(username));
  return doc ? doc.points : [];
}

async function saveUserMarkers(userId, points) {
  validatePoints(points);
  const doc = await MapMarkers.findByIdAndUpdate(
    userId,
    { points },
    { upsert: true, new: true }
  );
  return doc.points;
}

// Admin path: save markers to a specific user's map, looked up by username.
async function saveUserMarkersByUsername(username, points) {
  return saveUserMarkers(await userIdForUsername(username), points);
}

// Adds tracked location points to a user's map as markers, skipping any that
// overlap an existing marker. Used to build the map passively from background
// location uploads. Returns the number of markers added.
async function addMarkersFromPoints(userId, points) {
  const doc = await MapMarkers.findById(userId);
  const markers = doc ? [...doc.points] : [];

  // Seed the grid with the existing markers, then test each incoming point
  // against it (O(1) per point instead of scanning the whole marker array).
  const grid = createProximityGrid(MARKER_SPACING_M);
  for (const [mLat, mLng] of markers) grid.add(mLat, mLng);

  let added = 0;
  for (const p of points) {
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number') continue;
    if (!grid.hasWithinSpacing(p.lat, p.lng)) {
      grid.add(p.lat, p.lng);
      markers.push([p.lat, p.lng]);
      added += 1;
    }
  }

  if (added > 0) {
    await MapMarkers.findByIdAndUpdate(userId, { points: markers }, { upsert: true });
  }
  return added;
}

module.exports = {
  getAdminMarkers, getUserMarkers, saveUserMarkers, saveUserMarkersByUsername, addMarkersFromPoints,
  thinPoints, MARKER_SPACING_M,
};
