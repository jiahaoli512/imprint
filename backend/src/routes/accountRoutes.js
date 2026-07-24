const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const { codeRequestLimiter, exportLimiter, passwordChangeLimiter, resetVerifyLimiter } = require('../middleware/rateLimit');
const {
  requestPasswordReset, verifyPasswordReset, resetPassword, finishReset, changePassword, assertCurrentPassword,
} = require('../services/passwordResetService');
const { logoutAllDevices } = require('../services/sessionService');
const { emailAccountExport } = require('../services/exportService');
const { getOwnUsername } = require('../services/profileService');

// Password + session management: forgot-password reset, change-password
// while signed in, full sign-out, and self-service data export. Mounted at
// /api/users by routes/users.js (kept under the same prefix as auth/profile
// rather than a new /api/account — these all still act on "the signed-in
// user's own account", just a distinct enough sub-domain to live in its own
// route file per CLAUDE.md's routes-are-thin convention at the file-cohesion
// level, mirroring the authService/passwordResetService/profileService split
// this file's imports already draw from).

// Password reset (forgot-password flow). Same code challenge as signup:
// request-code emails a 6-char code to an existing account; verify-code checks it
// and returns a login token (verifying proves inbox control). reset/password and
// reset/finish require that token (requireAuth); reset/password is additionally
// gated by a verified reset challenge in the service.
router.post('/reset/request-code', codeRequestLimiter, handle(async (req, res) => {
  res.json(await requestPasswordReset(req.body.email));
}));

// resetVerifyLimiter — its own bucket, not shared with login/register/signup-
// verify — see rateLimit.js's authLimiter comment on why.
router.post('/reset/verify-code', resetVerifyLimiter, handle(async (req, res) => {
  res.json(await verifyPasswordReset(req.body.email, req.body.code));
}));

router.post('/reset/password', requireAuth, handle(async (req, res) => {
  // Returns a fresh token (the reset revokes the old one it was called with).
  res.json({ ok: true, ...await resetPassword(req.user.email, req.body.password) });
}));

router.post('/reset/finish', requireAuth, handle(async (req, res) => {
  await finishReset(req.user.email);
  res.json({ ok: true });
}));

// Resolves the caller's *current* username by id, independent of whatever
// username a client has cached. A user JWT never goes stale on a username
// change (only tokenVersion bumps revoke it — see resetPassword/changePassword/
// logoutAllDevices — and renames don't touch it), so a session left signed in
// on another device keeps working but its cached username (client.js's
// imprint_username) silently goes stale, breaking every by-username fetch
// (dashboard, profile, markers) with 404s until a fresh login re-derives it.
// The frontend calls this to resync that cache — see client.js's
// refreshUsername.
router.get('/me', requireAuth, handle(async (req, res) => {
  res.json({ username: await getOwnUsername(req.user.id) });
}));

// Settings > Account > View Email. The email is already carried (and
// signature-verified) in req.user's JWT payload — see token.js's signToken —
// and the app has no email-change feature, so it can't go stale; no DB hit
// needed, same trust reset/password and export already place in req.user.email.
router.get('/email', requireAuth, handle(async (req, res) => {
  res.json({ email: req.user.email });
}));

// Change password while already signed in, gated by re-entering the current
// password (as opposed to reset/password's email-code-verified challenge).
// Also bumps tokenVersion, so a fresh token is returned to keep this client
// signed in. passwordChangeLimiter (failures-only) guards this the same way
// authLimiter guards every other credential check, but as its own bucket —
// see the limiter's comment for why sharing authLimiter would be wrong here.
router.post('/password', requireAuth, passwordChangeLimiter, handle(async (req, res) => {
  res.json({ ok: true, ...await changePassword(req.user.id, req.body.currentPassword, req.body.newPassword) });
}));

// Deliberate full sign-out everywhere, including the caller — see
// sessionService.logoutAllDevices. No fresh token: the client is expected
// to clear its own session and redirect to login after this.
router.post('/logout-all', requireAuth, handle(async (req, res) => {
  await logoutAllDevices(req.user.id);
  res.json({ ok: true });
}));

// Self-export of raw location history + map markers (Settings > Account >
// Export Data), delivered as CSV attachments to the account's own email
// rather than returned in the response — see exportService for why. Gated
// by re-entering the current password (same check changePassword uses) —
// a full GPS trail going out on a single click with no re-auth is too
// costly a mistake (a shared/unattended device, a slipped click) to skip.
// exportLimiter guards both this check and the underlying query — see
// locationService.getUserLocations for why it's still worth limiting even
// though the query itself is capped.
router.post('/export', requireAuth, exportLimiter, handle(async (req, res) => {
  await assertCurrentPassword(req.user.id, req.body.password);
  await emailAccountExport(req.user.id, req.user.email);
  res.json({ ok: true });
}));

module.exports = router;
