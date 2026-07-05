const User = require('../models/User');
const { verifyToken } = require('../utils/token');

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
    // token.js pins the algorithm (defense against algorithm-confusion / 'none').
    return { status: 'ok', payload: verifyToken(header.slice(7)) };
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

// A verified user token is only accepted while its `tv` still matches the
// account's tokenVersion — bumping that version (on password reset) revokes every
// previously-minted token. Admin tokens have no version (they're password-minted
// and mutually exclusive with a user session), so they pass through here. A user
// deleted since the token was issued fails the check too.
async function userTokenFresh(payload) {
  if (isAdminToken(payload) || !payload.id) return true;
  const user = await User.findById(payload.id, 'tokenVersion');
  return !!user && (user.tokenVersion || 0) === (payload.tv || 0);
}

module.exports = { readBearer, assignIdentity, isAdminToken, userTokenFresh };
