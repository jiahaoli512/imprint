const Location = require('../models/Location');
const httpError = require('../utils/httpError');
const { addMarkersFromPoints } = require('./markerService');
const { isValidLocationPoint } = require('../utils/validateGeo');

const MAX_BATCH = 200;

// A sane upload date: a parseable visitedAt that isn't in the future, else now.
function safeVisitedAt(raw) {
  if (!raw) return new Date();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 60_000) return new Date();
  return d;
}

const toDoc = (userId, p) => ({
  userId,
  lat: p.lat,
  lng: p.lng,
  accuracy: Number.isFinite(p.accuracy) && p.accuracy >= 0 ? p.accuracy : undefined,
  visitedAt: safeVisitedAt(p.visitedAt),
});

// Validates an uploaded batch and shapes it into Location docs. Invalid points
// are dropped; the batch size is capped to bound a single request. Throws 400
// if the batch is unusable.
function buildLocationDocs(userId, points) {
  if (!Array.isArray(points) || points.length === 0)
    throw httpError(400, 'points must be a non-empty array');
  if (points.length > MAX_BATCH)
    throw httpError(400, `Too many points in one batch (max ${MAX_BATCH}).`);

  const docs = points.filter(isValidLocationPoint).map((p) => toDoc(userId, p));
  if (docs.length === 0) throw httpError(400, 'No valid points in batch.');
  return docs;
}

// Persists a batch of points uploaded by the background tracker, then passively
// builds the user's map by dropping a deduped marker for each new place.
async function logLocations(userId, points) {
  const docs = buildLocationDocs(userId, points);
  await Location.insertMany(docs);
  const markersAdded = await addMarkersFromPoints(userId, docs);
  return { inserted: docs.length, markersAdded };
}

// Hard cap on a self-export, mirroring MapMarkers' MAX_POINTS — passive
// tracking logs a raw point roughly every 100m with no dedup (overlap
// allowed), so a long-tracked account could otherwise return an unbounded,
// event-loop-blocking response with no equivalent safeguard to marker saves.
const MAX_EXPORT_LOCATIONS = 50000;

// A user's raw location history for self-export, already shaped into the
// response rows (kept here, not in the route, since field selection/defaults
// are a service-layer concern). Oldest first; when the history exceeds the
// cap, keeps the most recent MAX_EXPORT_LOCATIONS points rather than silently
// truncating to the oldest (least useful) ones.
async function getUserLocations(userId) {
  const docs = await Location.find({ userId }, 'lat lng accuracy visitedAt -_id')
    .sort({ visitedAt: -1 })
    .limit(MAX_EXPORT_LOCATIONS)
    .lean();
  return docs.reverse().map((l) => ({
    lat: l.lat, lng: l.lng, accuracy: l.accuracy ?? '', visitedAt: l.visitedAt,
  }));
}

module.exports = { logLocations, getUserLocations };
