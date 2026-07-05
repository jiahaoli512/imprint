const MapMarkers = require('../models/MapMarkers');
const { validatePoints } = require('../utils/validate');
const { createProximityGrid, MARKER_SPACING_M } = require('../utils/markerGeometry');
const { findUserByUsername } = require('./userLookup');
const { assertCanViewOwnerData } = require('./friendService');

// Resolves a username to its user id (the MapMarkers key), 404ing if there's no
// such user. Returns the id as a string.
async function userIdForUsername(username) {
  const user = await findUserByUsername(username, '_id');
  return user._id.toString();
}

async function getAdminMarkers() {
  const doc = await MapMarkers.findById('singleton');
  return doc ? doc.points : [];
}

// A user's map, readable only by the owner, an admin, or one of the owner's
// friends. Markers are auto-built from background location history, so a stranger
// can't pull an arbitrary user's whereabouts (or their badge-derived data).
async function getUserMarkers(username, { viewerId = null, isAdmin = false } = {}) {
  const ownerId = await userIdForUsername(username);
  await assertCanViewOwnerData(viewerId, ownerId, { isAdmin, message: 'Only friends can view this map.' });
  const doc = await MapMarkers.findById(ownerId);
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
};
