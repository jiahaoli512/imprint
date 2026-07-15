const router = require('express').Router();
const handle = require('../middleware/handle');
const { authLimiter, codeRequestLimiter } = require('../middleware/rateLimit');
const { registerUser, loginUser } = require('../services/authService');
const { requestCode, verifyCode } = require('../services/verificationService');

// Registration + login. Mounted at /api/users by routes/users.js, so the
// existing paths (/, /login, /request-code, /verify-code) are unchanged.

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

router.post('/login', authLimiter, handle(async (req, res) => {
  // `identifier` is an email address or a username — see authService.loginUser.
  const result = await loginUser(req.body.identifier, req.body.password);
  res.json({ ok: true, ...result });
}));

module.exports = router;
