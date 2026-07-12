const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { normalizeEmail } = require('../utils/validate');
const { validatePassword } = require('../utils/validatePassword');
const httpError = require('../utils/httpError');
const { toAuthResult } = require('./userSerializers');
const { requestResetCode, verifyResetCode, assertResetVerified, consumeReset } = require('./verificationService');

// Forgot-password flow. Emails a 6-char reset code (same challenge as signup) to
// an existing account. Enumeration-safe: generic success whether or not the email
// has an account.
async function requestPasswordReset(email) {
  return requestResetCode(email);
}

// Verifies a reset code. On success the user is effectively logged in (proving
// inbox control), so we return the same { token, username } as loginUser — this
// is what lets the client either change the password or skip straight to the
// dashboard. The reset challenge stays verified (not consumed) so a follow-up
// resetPassword call is authorized.
async function verifyPasswordReset(email, code) {
  await verifyResetCode(email, code);
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) throw httpError(400, 'Invalid or expired code. Please request a new one.');
  return toAuthResult(user);
}

// Sets a new password for the account. Gated by assertResetVerified (a verified,
// unexpired reset challenge) on top of the route's requireAuth, then reuses the
// same password policy as signup. Consumes the challenge (single-use).
async function resetPassword(email, newPassword) {
  await assertResetVerified(email);
  validatePassword(newPassword);
  email = normalizeEmail(email);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  // Bump tokenVersion so every previously-issued session is revoked (a stolen
  // token stops working the moment the real user resets). Return a fresh token
  // minted at the new version so the resetting client itself stays signed in.
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { passwordHash }, $inc: { tokenVersion: 1 } },
    { new: true }
  );
  await consumeReset(email);
  return toAuthResult(user);
}

// "Skip & log in" path: the client already holds the token from verify; clear the
// verified challenge so it can't be reused.
async function finishReset(email) {
  await consumeReset(email);
}

// Changes the password for an already-authenticated user, gated by re-entering the
// current password (unlike resetPassword, which is gated by a verified email-code
// challenge). Bumps tokenVersion like resetPassword does, so the response's fresh
// token must be stored client-side or the caller gets logged out on its next request.
// Deliberately never throws 401 here: the route is requireAuth-gated, so the
// caller's Bearer token is already valid, and the frontend's request() helper
// treats any 401 received alongside a token as "session expired" — clearing
// the session and bouncing to /home. A wrong current password is a 400 (a bad
// request body against a still-valid session), not an auth failure.
async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw httpError(400, 'Not authenticated.');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw httpError(400, 'Current password is incorrect.');
  validatePassword(newPassword);
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.tokenVersion += 1;
  await user.save();
  return toAuthResult(user);
}

// Revokes every existing session (including the caller's) by bumping tokenVersion.
// No fresh token is returned — this is a deliberate full sign-out, not a rotation.
async function logoutAllDevices(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}

module.exports = {
  requestPasswordReset, verifyPasswordReset, resetPassword, finishReset,
  changePassword, logoutAllDevices,
};
