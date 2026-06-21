const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const requireAdminAuth = require('../middleware/adminAuth');
const requireUserOrAdmin = require('../middleware/userOrAdmin');
const optionalAuth = require('../middleware/optionalAuth');
const { authLimiter } = require('../middleware/rateLimit');
const { registerUser, loginUser, checkUsername, setupProfile, searchUsers, getProfileFor, updateUserByUsername, listUsers } = require('../services/userService');

router.post('/', authLimiter, handle(async (req, res) => {
  await registerUser(req.body.email, req.body.password);
  res.status(201).json({ ok: true });
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
// feature, so anonymous callers can't harvest the userbase + PII.
router.get('/search', requireAuth, handle(async (req, res) => {
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
