const MapMarkers = require('../models/MapMarkers');
const User = require('../models/User');
const httpError = require('../utils/httpError');
const { normalizeUsername } = require('../utils/validate');

const MARKER_RADIUS_M = 15.24;   // matches the circle drawn on the map (~30m wide)
// Minimum spacing between markers. Decoupled from the render radius: at ~100m a
// commute leaves a sparse trail of distinct markers rather than a continuous
// overlapping tube. Mirrors the 100m distanceFilter on the native tracker.
const MARKER_SPACING_M = 100;

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

// Greedily thins a list of [lat, lng] markers so no two kept markers are closer
// than `spacing` metres — keeping the first of each cluster, in order. Shared by
// the passive ingest path and the one-off re-spacing migration.
function thinPoints(points, spacing = MARKER_SPACING_M) {
  const kept = [];
  for (const [lat, lng] of points) {
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    if (!kept.some(([kLat, kLng]) => distanceMeters(lat, lng, kLat, kLng) < spacing)) {
      kept.push([lat, lng]);
    }
  }
  return kept;
}

async function getAdminMarkers() {
  const doc = await MapMarkers.findById('singleton');
  return doc ? doc.points : [];
}

async function getUserMarkers(username) {
  const user = await User.findOne({ username: normalizeUsername(username) });
  if (!user) throw httpError(404, 'User not found');
  const doc = await MapMarkers.findById(user._id.toString());
  return doc ? doc.points : [];
}

async function saveUserMarkers(userId, points) {
  if (!Array.isArray(points)) throw httpError(400, 'points must be an array');
  const doc = await MapMarkers.findByIdAndUpdate(
    userId,
    { points },
    { upsert: true, new: true }
  );
  return doc.points;
}

// Admin path: save markers to a specific user's map, looked up by username.
async function saveUserMarkersByUsername(username, points) {
  if (!Array.isArray(points)) throw httpError(400, 'points must be an array');
  const user = await User.findOne({ username: normalizeUsername(username) });
  if (!user) throw httpError(404, 'User not found');
  return saveUserMarkers(user._id.toString(), points);
}

// Adds tracked location points to a user's map as markers, skipping any that
// overlap an existing marker. Used to build the map passively from background
// location uploads. Returns the number of markers added.
async function addMarkersFromPoints(userId, points) {
  const doc = await MapMarkers.findById(userId);
  const markers = doc ? [...doc.points] : [];
  let added = 0;

  for (const p of points) {
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number') continue;
    const tooClose = markers.some(([mLat, mLng]) => distanceMeters(p.lat, p.lng, mLat, mLng) < MARKER_SPACING_M);
    if (!tooClose) {
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
