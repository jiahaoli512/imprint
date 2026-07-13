const User = require('../models/User');

// Session/token-revocation concerns, separate from passwordResetService:
// this doesn't touch passwordHash at all, so it doesn't belong in "the
// password service" just because it happens to also bump tokenVersion.

// Revokes every existing session (including the caller's) by bumping
// tokenVersion. No fresh token is returned — this is a deliberate full
// sign-out, not a rotation.
async function logoutAllDevices(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}

module.exports = { logoutAllDevices };
