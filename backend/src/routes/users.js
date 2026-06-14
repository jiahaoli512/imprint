const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Waitlist = require('../models/Waitlist');

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
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/users — admin list of registered accounts
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find({}, 'email createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
