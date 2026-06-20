const MapMarkers = require('../models/MapMarkers');
const User = require('../models/User');
const httpError = require('../utils/httpError');

async function getAdminMarkers() {
  const doc = await MapMarkers.findById('singleton');
  return doc ? doc.points : [];
}

async function getUserMarkers(username) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw httpError(404, 'User not found');
  const doc = await MapMarkers.findById(user._id.toString());
  return doc ? doc.points : [];
}

async function saveUserMarkers(userId, points) {
  const doc = await MapMarkers.findByIdAndUpdate(
    userId,
    { points },
    { upsert: true, new: true }
  );
  return doc.points;
}

// Admin path: save markers to a specific user's map, looked up by username.
async function saveUserMarkersByUsername(username, points) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw httpError(404, 'User not found');
  return saveUserMarkers(user._id.toString(), points);
}

module.exports = { getAdminMarkers, getUserMarkers, saveUserMarkers, saveUserMarkersByUsername };
