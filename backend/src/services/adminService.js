const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const httpError = require('../utils/httpError');

// Constant-time string equality (avoids leaking the password via comparison
// timing). Hashing first gives both sides equal length so timingSafeEqual is
// safe to call and the length itself isn't revealed.
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Validates the admin password (server-side) and mints a short-lived admin JWT.
// Keeps "how admin tokens are minted" in the service layer, alongside the user
// auth logic, rather than inline in the route.
function login(password) {
  if (!password || !safeEqual(password, process.env.ADMIN_PASSWORD))
    throw httpError(401, 'Incorrect password.');
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  return { token };
}

module.exports = { login };
