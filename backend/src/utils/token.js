const jwt = require('jsonwebtoken');

// Mints a 7-day user JWT (type:'user'). Shared by login and the password-reset
// verify step (verifying the reset code proves inbox control, which logs the
// user in), so it lives here rather than in either service.
function signToken(user) {
  return jwt.sign(
    { type: 'user', id: user._id.toString(), email: user.email, tv: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { signToken };
