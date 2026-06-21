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
    // Pin the algorithm so a token can't be verified under an unexpected alg
    // (defense against algorithm-confusion / 'none').
    return { status: 'ok', payload: jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] }) };
  } catch {
    return { status: 'invalid' };
  }
}

// A token is an admin token if it carries the admin type/role; everything else
// is treated as a user token (older user tokens predate the explicit `type`).
function isAdminToken(payload) {
  return payload.type === 'admin' || payload.role === 'admin';
}

// Attaches a verified payload to the request as admin or user by type/role.
function assignIdentity(req, payload) {
  if (isAdminToken(payload)) req.admin = payload;
  else req.user = payload;
}

module.exports = { readBearer, assignIdentity, isAdminToken };
