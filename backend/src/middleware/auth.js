const { readBearer, isAdminToken } = require('./jwt');

module.exports = function requireAuth(req, res, next) {
  const r = readBearer(req);
  if (r.status === 'missing') return res.status(401).json({ error: 'Missing or invalid token' });
  if (r.status === 'invalid') return res.status(401).json({ error: 'Token expired or invalid' });
  // A valid signature isn't enough: an admin token must not satisfy user auth
  // (it has no `id`), and a user token must carry an id.
  if (isAdminToken(r.payload) || !r.payload.id) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  req.user = r.payload;
  next();
};
