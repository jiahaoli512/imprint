const jwt = require('jsonwebtoken');

// Single place that reads + verifies a Bearer token, so the four auth
// middlewares don't each re-implement this security-sensitive parsing.
// Returns a discriminated result so callers keep their own status/messages:
//   { status: 'missing' }            — no/!Bearer Authorization header
//   { status: 'invalid' }            — present but failed verification/expired
//   { status: 'ok', payload }        — verified JWT payload
function readBearer(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return { status: 'missing' };
  try {
    return { status: 'ok', payload: jwt.verify(header.slice(7), process.env.JWT_SECRET) };
  } catch {
    return { status: 'invalid' };
  }
}

// Attaches a verified payload to the request as admin or user by role.
function assignIdentity(req, payload) {
  if (payload.role === 'admin') req.admin = payload;
  else req.user = payload;
}

module.exports = { readBearer, assignIdentity };
