const httpError = require('./httpError');

// Geographic coordinate validation. Split out of validate.js as its own domain
// — spatial data, not string/identity fields. Shared by the marker (saved
// [lat,lng] arrays) and location (tracked point objects) write paths so
// coordinate sanity lives in one place.
const MAX_POINTS = 50000; // hard cap on a saved marker array (the 100kb body limit caps lower)

function inRange(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Throws 400 unless `pair` is a finite, in-range [lat, lng] tuple.
function validateCoordPair(pair) {
  if (!Array.isArray(pair) || pair.length < 2 || !inRange(pair[0], pair[1]))
    throw httpError(400, 'Each marker must be a valid [lat, lng] coordinate.');
}

// Validates a marker array ([[lat,lng], ...]): an array within the count cap of
// finite, in-range pairs. Returns the array for convenient chaining.
function validatePoints(points, { max = MAX_POINTS } = {}) {
  if (!Array.isArray(points)) throw httpError(400, 'points must be an array.');
  if (points.length > max) throw httpError(400, `Too many points (max ${max}).`);
  points.forEach(validateCoordPair);
  return points;
}

// True if a tracked-location object has finite, in-range coordinates. Returns a
// boolean (not a throw) so the batch ingest can drop bad points individually.
function isValidLocationPoint(p) {
  return !!p && inRange(p.lat, p.lng);
}

module.exports = { validatePoints, validateCoordPair, isValidLocationPoint, MAX_POINTS, inRange };
