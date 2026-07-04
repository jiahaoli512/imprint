const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const requireAdminAuth = require('../middleware/adminAuth');
const requireUserOrAdmin = require('../middleware/userOrAdmin');
const optionalAuth = require('../middleware/optionalAuth');
const { authLimiter, codeRequestLimiter } = require('../middleware/rateLimit');
const { registerUser, loginUser } = require('../services/authService');
const { requestPasswordReset, verifyPasswordReset, resetPassword, finishReset } = require('../services/passwordResetService');
const { checkUsername, setupProfile, searchUsers, getProfileFor, updateUserByUsername, listUsers } = require('../services/profileService');
const { requestCode, verifyCode } = require('../services/verificationService');

router.post('/', authLimiter, handle(async (req, res) => {
  await registerUser(req.body.email, req.body.password);
  res.status(201).json({ ok: true });
}));

// Signup email verification (pre-auth). request-code emails a 6-char code to an
// eligible address; verify-code checks it. Both are rate-limited: request-code by
// codeRequestLimiter (counts successes — sends email), verify-code by authLimiter
// (counts failures — brute-force guard), on top of per-email limits in the service.
router.post('/request-code', codeRequestLimiter, handle(async (req, res) => {
  res.json(await requestCode(req.body.email));
}));

router.post('/verify-code', authLimiter, handle(async (req, res) => {
  res.json(await verifyCode(req.body.email, req.body.code));
}));

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

router.post('/login', authLimiter, handle(async (req, res) => {
  const result = await loginUser(req.body.email, req.body.password);
  res.json({ ok: true, ...result });
}));

// Auth-gated: only signed-in users probe availability (during profile setup),
// so anonymous callers can't enumerate which usernames exist.
router.get('/check-username', requireAuth, handle(async (req, res) => {
  res.json(await checkUsername(req.query.username));
}));

router.patch('/profile', requireAuth, handle(async (req, res) => {
  const { firstName, lastName, username, dateOfBirth } = req.body;
  res.json(await setupProfile(req.user.email, { firstName, lastName, username, dateOfBirth }));
}));

// Auth-gated: user search (returns usernames + real names) is a signed-in
// feature, so anonymous callers can't harvest the userbase + PII. Accepts a user
// OR admin token — admins searching users (e.g. from an admin-viewed dashboard)
// carry an admin token, not a user one.
router.get('/search', requireUserOrAdmin, handle(async (req, res) => {
  res.json(await searchUsers(req.query.q || ''));
}));

router.get('/by-username/:username', optionalAuth, handle(async (req, res) => {
  res.json(await getProfileFor(req.params.username, { viewerId: req.user?.id, isAdmin: !!req.admin }));
}));

router.patch('/by-username/:username', requireUserOrAdmin, handle(async (req, res) => {
  const { firstName, lastName, username } = req.body;
  res.json(await updateUserByUsername(
    req.params.username,
    { firstName, lastName, username },
    { viewerId: req.user?.id, isAdmin: !!req.admin },
  ));
}));

router.get('/', requireAdminAuth, handle(async (req, res) => {
  res.json(await listUsers());
}));

module.exports = router;
