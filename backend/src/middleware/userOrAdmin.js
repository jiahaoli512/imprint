const jwt = require('jsonwebtoken');

// Accepts either a user JWT or an admin JWT.
// Sets req.admin (role 'admin') or req.user accordingly. Rejects if neither is valid.
module.exports = function requireUserOrAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    if (payload.role === 'admin') req.admin = payload;
    else req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
};
