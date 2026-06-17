const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const requireAdminAuth = require('../middleware/adminAuth');
const requireUserOrAdmin = require('../middleware/userOrAdmin');
const optionalAuth = require('../middleware/optionalAuth');
const { authLimiter } = require('../middleware/rateLimit');
const { registerUser, loginUser, checkUsername, setupProfile, searchUsers, getUserByUsername, updateUserByUsername, listUsers } = require('../services/userService');

router.post('/', authLimiter, handle(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  await registerUser(email, password);
  res.status(201).json({ ok: true });
}));

router.post('/login', authLimiter, handle(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const result = await loginUser(email, password);
  res.json({ ok: true, ...result });
}));

router.get('/check-username', handle(async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Username is required.' });
  res.json(await checkUsername(username));
}));

router.patch('/profile', requireAuth, handle(async (req, res) => {
  const { firstName, lastName, username, dateOfBirth } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required.' });
  if (!dateOfBirth) return res.status(400).json({ error: 'Date of birth is required.' });
  res.json(await setupProfile(req.user.email, { firstName, lastName, username, dateOfBirth }));
}));

router.get('/search', handle(async (req, res) => {
  res.json(await searchUsers(req.query.q || ''));
}));

router.get('/by-username/:username', optionalAuth, handle(async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  const obj = user.toObject();
  // Date of birth is private — only the owner or an admin may see it.
  const isOwner = req.user && req.user.id === user._id.toString();
  if (!isOwner && !req.admin) delete obj.dateOfBirth;
  res.json(obj);
}));

router.patch('/by-username/:username', requireUserOrAdmin, handle(async (req, res) => {
  // Admins may edit any profile; users may only edit their own.
  if (!req.admin) {
    const user = await getUserByUsername(req.params.username);
    if (user._id.toString() !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });
  }
  const { firstName, lastName } = req.body;
  res.json(await updateUserByUsername(req.params.username, { firstName, lastName }));
}));

router.get('/', requireAdminAuth, handle(async (req, res) => {
  res.json(await listUsers());
}));

module.exports = router;
