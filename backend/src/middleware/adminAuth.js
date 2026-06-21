const { readBearer, isAdminToken } = require('./jwt');

module.exports = function requireAdminAuth(req, res, next) {
  const r = readBearer(req);
  if (r.status === 'missing') return res.status(401).json({ error: 'Admin authentication required' });
  if (r.status === 'invalid') return res.status(401).json({ error: 'Invalid or expired admin token' });
  if (!isAdminToken(r.payload)) return res.status(403).json({ error: 'Forbidden' });
  req.admin = r.payload;
  next();
};
