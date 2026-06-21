const { readBearer } = require('./jwt');

module.exports = function requireAuth(req, res, next) {
  const r = readBearer(req);
  if (r.status === 'missing') return res.status(401).json({ error: 'Missing or invalid token' });
  if (r.status === 'invalid') return res.status(401).json({ error: 'Token expired or invalid' });
  req.user = r.payload;
  next();
};
