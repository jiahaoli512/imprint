const router = require('express').Router();
const handle = require('../middleware/handle');
const { authLimiter } = require('../middleware/rateLimit');
const { login } = require('../services/adminService');

// POST /api/admin/login
router.post('/login', authLimiter, handle(async (req, res) => {
  res.json(login(req.body.password));
}));

module.exports = router;
