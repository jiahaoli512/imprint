const jwt = require('jsonwebtoken');

// Decodes a Bearer token if present (user or admin), but never rejects.
// Anonymous requests simply proceed with no req.user / req.admin set.
module.exports = function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      if (payload.role === 'admin') req.admin = payload;
      else req.user = payload;
    } catch {
      /* invalid token → treat as anonymous */
    }
  }
  next();
};
