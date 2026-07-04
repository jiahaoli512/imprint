const User = require('../models/User');
const httpError = require('../utils/httpError');
const { normalizeUsername } = require('../utils/validate');

// Normalizes the username and loads the user (optionally projected to `fields`),
// throwing a 404 if none exists. Centralizes the normalize + 404 rule (Mongoose
// only lowercases on save, not on query) so callers can't forget it. Lives in its
// own module — depending only on the User model — so both userService and
// friendService can share it without a service↔service require cycle.
async function findUserByUsername(username, fields) {
  const user = await User.findOne({ username: normalizeUsername(username) }, fields);
  if (!user) throw httpError(404, 'User not found.');
  return user;
}

module.exports = { findUserByUsername };
