const { readBearer, assignIdentity } = require('./jwt');

// Accepts either a user JWT or an admin JWT.
// Sets req.admin (role 'admin') or req.user accordingly. Rejects if neither is valid.
module.exports = function requireUserOrAdmin(req, res, next) {
  const r = readBearer(req);
  if (r.status === 'missing') return res.status(401).json({ error: 'Missing or invalid token' });
  if (r.status === 'invalid') return res.status(401).json({ error: 'Token expired or invalid' });
  assignIdentity(req, r.payload);
  next();
};
