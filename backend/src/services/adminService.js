const crypto = require('crypto');
const httpError = require('../utils/httpError');
const { signAdminToken } = require('../utils/token');

// Constant-time string equality (avoids leaking the password via comparison
// timing). Hashing first gives both sides equal length so timingSafeEqual is
// safe to call and the length itself isn't revealed.
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Validates the admin password (server-side), then delegates minting to the token
// seam. The service owns the auth *decision*; token.js owns how JWTs are signed.
function login(password) {
  if (!password || !safeEqual(password, process.env.ADMIN_PASSWORD))
    throw httpError(401, 'Incorrect password.');
  return { token: signAdminToken() };
}

module.exports = { login };
