const Location = require('../models/Location');
const httpError = require('../utils/httpError');
const { addMarkersFromPoints } = require('./markerService');

const MAX_BATCH = 200;

// Persists a batch of points uploaded by the background tracker. Invalid points
// are dropped; the batch size is capped to bound a single request.
async function logLocations(userId, points) {
  if (!Array.isArray(points) || points.length === 0)
    throw httpError(400, 'points must be a non-empty array');
  if (points.length > MAX_BATCH)
    throw httpError(400, `Too many points in one batch (max ${MAX_BATCH}).`);

  const docs = points
    .filter((p) => p && typeof p.lat === 'number' && typeof p.lng === 'number')
    .map((p) => ({
      userId,
      lat: p.lat,
      lng: p.lng,
      accuracy: typeof p.accuracy === 'number' ? p.accuracy : undefined,
      visitedAt: p.visitedAt ? new Date(p.visitedAt) : new Date(),
    }));

  if (docs.length === 0) throw httpError(400, 'No valid points in batch.');
  await Location.insertMany(docs);

  // Build the user's map passively: drop a marker for each new place (deduped).
  const markersAdded = await addMarkersFromPoints(userId, docs);

  return { inserted: docs.length, markersAdded };
}

async function getUserLocations(userId, limit = 500) {
  return Location.find({ userId }, 'lat lng accuracy visitedAt')
    .sort({ visitedAt: -1 })
    .limit(limit);
}

async function getCoverage(userId) {
  const [total, countries, regions] = await Promise.all([
    Location.countDocuments({ userId }),
    Location.distinct('country', { userId, country: { $ne: null } }),
    Location.distinct('region', { userId, region: { $ne: null } }),
  ]);
  return { total, countriesVisited: countries.length, regionsVisited: regions.length };
}

module.exports = { logLocations, getUserLocations, getCoverage };
