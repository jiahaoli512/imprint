const router = require('express').Router();
const handle = require('../middleware/handle');
const { adminLoginLimiter } = require('../middleware/rateLimit');
const { login } = require('../services/adminService');

// POST /api/admin/login — its own bucket, not shared with user login/register/
// verify-code endpoints, per rateLimit.js's authLimiter comment.
router.post('/login', adminLoginLimiter, handle(async (req, res) => {
  res.json(login(req.body.password));
}));

module.exports = router;
