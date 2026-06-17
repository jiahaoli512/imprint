const router = require('express').Router();
const jwt = require('jsonwebtoken');
const handle = require('../middleware/handle');
const { authLimiter } = require('../middleware/rateLimit');

// POST /api/admin/login
router.post('/login', authLimiter, handle(async (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
}));

module.exports = router;
