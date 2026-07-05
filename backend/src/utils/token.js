const jwt = require('jsonwebtoken');

// The single owner of JWT signing/verification: the secret and the algorithm are
// referenced only here, so every token (user + admin) is minted and checked one
// way. Pinning HS256 on both sign and verify defends against algorithm-confusion
// / 'none' attacks. Other modules call these helpers instead of jsonwebtoken.
const SECRET = () => process.env.JWT_SECRET;
const ALG = 'HS256';

// Mints a 7-day user JWT (type:'user'). Shared by login and the password-reset
// verify step (verifying the reset code proves inbox control, which logs the
// user in), so it lives here rather than in either service.
function signToken(user) {
  return jwt.sign(
    { type: 'user', id: user._id.toString(), email: user.email, tv: user.tokenVersion || 0 },
    SECRET(),
    { expiresIn: '7d', algorithm: ALG }
  );
}

// Mints a short-lived admin JWT (type:'admin'). Minted only after the admin
// password check in adminService.
function signAdminToken() {
  return jwt.sign({ type: 'admin', role: 'admin' }, SECRET(), { expiresIn: '8h', algorithm: ALG });
}

// Verifies + decodes a raw token, throwing on failure/expiry. Algorithm pinned.
function verifyToken(raw) {
  return jwt.verify(raw, SECRET(), { algorithms: [ALG] });
}

module.exports = { signToken, signAdminToken, verifyToken };
