const MapMarkers = require('../models/MapMarkers');
const User = require('../models/User');

async function getAdminMarkers() {
  const doc = await MapMarkers.findById('singleton');
  return doc ? doc.points : [];
}

async function getUserMarkers(username) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
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

module.exports = { getAdminMarkers, getUserMarkers, saveUserMarkers };
