const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Waitlist = require('../models/Waitlist');

function ageFromDob(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// POST /api/users — register a new account
router.post('/', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const entry = await Waitlist.findOne({ email: email.toLowerCase() });
    if (!entry || !entry.approved) return res.status(403).json({ error: 'Email is not approved' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ email, passwordHash });
    await Waitlist.deleteOne({ email: email.toLowerCase() });
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    res.json({ ok: true, username: user.username || null });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/check-username?username=...
router.get('/check-username', async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username is required.' });
    const exists = await User.findOne({ username: username.trim().toLowerCase() });
    res.json({ available: !exists });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/profile
router.patch('/profile', async (req, res, next) => {
  try {
    const { email, firstName, lastName, username, dateOfBirth } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    if (!username) return res.status(400).json({ error: 'Username is required.' });
    if (!dateOfBirth) return res.status(400).json({ error: 'Date of birth is required.' });

    if (ageFromDob(dateOfBirth) < 18)
      return res.status(400).json({ error: 'You must be at least 18 years old.' });

    const taken = await User.findOne({ username: username.trim().toLowerCase(), email: { $ne: email.toLowerCase() } });
    if (taken) return res.status(409).json({ error: 'That username is already taken.' });

    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
        username: username.trim().toLowerCase(),
        dateOfBirth: new Date(dateOfBirth),
      }
    );
    res.json({ ok: true, username: username.trim().toLowerCase() });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/search?q= — username search for user lookup
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!q) return res.json([]);
    const users = await User.find(
      { username: { $regex: q, $options: 'i' } },
      'username firstName lastName'
    ).limit(8);
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/by-username/:username — public profile lookup
router.get('/by-username/:username', async (req, res, next) => {
  try {
    const user = await User.findOne(
      { username: req.params.username.toLowerCase() },
      'username firstName lastName createdAt'
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/by-username/:username — edit own profile (firstName, lastName)
router.patch('/by-username/:username', async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findOneAndUpdate(
      { username: req.params.username.toLowerCase() },
      { firstName: firstName?.trim() || '', lastName: lastName?.trim() || '' },
      { new: true, select: 'username firstName lastName createdAt' }
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/users — admin list of registered accounts
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find({}, 'email username createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
