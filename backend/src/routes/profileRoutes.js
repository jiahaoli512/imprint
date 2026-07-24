const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const requireAdminAuth = require('../middleware/adminAuth');
const requireUserOrAdmin = require('../middleware/userOrAdmin');
const { lookupLimiter } = require('../middleware/rateLimit');
const { checkUsername, setupProfile, searchUsers, getProfileFor, updateUserByUsername, listUsers } = require('../services/profileService');
const { viewerContext } = require('../utils/viewer');

// Profile CRUD/search/listing. Mounted at /api/users by routes/users.js.

// Auth-gated: only signed-in users probe availability (during profile setup),
// so anonymous callers can't enumerate which usernames exist. lookupLimiter
// caps it well below the global default — see the limiter's own comment on
// why this exact-match endpoint needs a tighter, dedicated bucket.
router.get('/check-username', requireAuth, lookupLimiter, handle(async (req, res) => {
  res.json(await checkUsername(req.query.username));
}));

router.patch('/profile', requireAuth, handle(async (req, res) => {
  const { firstName, lastName, username, dateOfBirth } = req.body;
  res.json(await setupProfile(req.user.email, { firstName, lastName, username, dateOfBirth }));
}));

// Auth-gated: user search (returns usernames + real names) is a signed-in
// feature, so anonymous callers can't harvest the userbase + PII. Accepts a user
// OR admin token — admins searching users (e.g. from an admin-viewed dashboard)
// carry an admin token, not a user one. lookupLimiter — see check-username above.
router.get('/search', requireUserOrAdmin, lookupLimiter, handle(async (req, res) => {
  res.json(await searchUsers(req.query.q || ''));
}));

// Signed-in (user or admin) only: a profile exposes real names, join date, and
// friend count, so anonymous callers can't harvest PII — matching /search and
// /check-username. viewerContext still resolves owner vs. admin vs. other viewer.
router.get('/by-username/:username', requireUserOrAdmin, handle(async (req, res) => {
  res.json(await getProfileFor(req.params.username, viewerContext(req)));
}));

router.patch('/by-username/:username', requireUserOrAdmin, handle(async (req, res) => {
  const { firstName, lastName, username } = req.body;
  res.json(await updateUserByUsername(
    req.params.username,
    { firstName, lastName, username },
    viewerContext(req),
  ));
}));

router.get('/', requireAdminAuth, handle(async (req, res) => {
  res.json(await listUsers());
}));

module.exports = router;
