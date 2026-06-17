const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const requireAdminAuth = require('../middleware/adminAuth');
const { registerUser, loginUser, checkUsername, setupProfile, searchUsers, getUserByUsername, updateUserByUsername, listUsers } = require('../services/userService');

router.post('/', handle(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  await registerUser(email, password);
  res.status(201).json({ ok: true });
}));

router.post('/login', handle(async (req, res) => {
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

router.get('/by-username/:username', handle(async (req, res) => {
  res.json(await getUserByUsername(req.params.username));
}));

router.patch('/by-username/:username', requireAuth, handle(async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  if (user._id.toString() !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });
  const { firstName, lastName } = req.body;
  res.json(await updateUserByUsername(req.params.username, { firstName, lastName }));
}));

router.get('/', requireAdminAuth, handle(async (req, res) => {
  res.json(await listUsers());
}));

module.exports = router;
