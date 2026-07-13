const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const { authLimiter, codeRequestLimiter, exportLimiter, passwordChangeLimiter } = require('../middleware/rateLimit');
const {
  requestPasswordReset, verifyPasswordReset, resetPassword, finishReset,
  changePassword, logoutAllDevices,
} = require('../services/passwordResetService');
const { getUserLocations } = require('../services/locationService');
const { getOwnMarkers } = require('../services/markerService');

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

router.post('/reset/verify-code', authLimiter, handle(async (req, res) => {
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
// passwordResetService.logoutAllDevices. No fresh token: the client is
// expected to clear its own session and redirect to login after this.
router.post('/logout-all', requireAuth, handle(async (req, res) => {
  await logoutAllDevices(req.user.id);
  res.json({ ok: true });
}));

// Self-export of raw location history + map markers (Settings > Account >
// Export Data). Locations have no other read endpoint (the map renders from
// MapMarkers) — this is a self-service data download, not used for rendering.
// exportLimiter guards the underlying query — see locationService.getUserLocations
// for why it's still worth limiting even though it's capped.
router.get('/export', requireAuth, exportLimiter, handle(async (req, res) => {
  const [locations, markers] = await Promise.all([
    getUserLocations(req.user.id),
    getOwnMarkers(req.user.id),
  ]);
  res.json({ ok: true, locations, markers }); // markers: [[lat,lng], ...], possibly empty
}));

module.exports = router;
