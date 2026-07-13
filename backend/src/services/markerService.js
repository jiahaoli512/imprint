const MapMarkers = require('../models/MapMarkers');
const { validatePoints } = require('../utils/validateGeo');
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

// The ownerId-keyed core: a user's map, readable only by the owner, an admin,
// or one of the owner's friends (assertCanViewOwnerData already passes a
// viewer viewing their own data for free). Markers are auto-built from
// background location history, so a stranger can't pull an arbitrary user's
// whereabouts (or their badge-derived data). Both username-keyed reads
// (getUserMarkers) and the userId-keyed self-export (getOwnMarkers) funnel
// through this one gate + fetch, rather than each re-implementing it.
async function getMarkersFor(ownerId, { viewerId = null, isAdmin = false } = {}) {
  await assertCanViewOwnerData(viewerId, ownerId, { isAdmin, message: 'Only friends can view this map.' });
  const doc = await MapMarkers.findById(ownerId);
  return doc ? doc.points : [];
}

// Public read path, keyed by username (what routes/markers.js has on hand).
async function getUserMarkers(username, { viewerId = null, isAdmin = false } = {}) {
  const ownerId = await userIdForUsername(username);
  return getMarkersFor(ownerId, { viewerId, isAdmin });
}

// Self-export lookup (Settings > Account > Export Data): the caller viewing
// their own map, keyed directly by userId — viewerId === ownerId passes
// assertCanViewOwnerData's self-view check trivially, so this needs no
// separate gate-skipping logic of its own.
async function getOwnMarkers(userId) {
  return getMarkersFor(userId, { viewerId: userId });
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
  getAdminMarkers, getUserMarkers, getOwnMarkers, saveUserMarkers, saveUserMarkersByUsername, addMarkersFromPoints,
};
