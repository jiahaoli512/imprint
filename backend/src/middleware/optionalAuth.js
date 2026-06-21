const { readBearer, assignIdentity } = require('./jwt');

// Decodes a Bearer token if present (user or admin), but never rejects.
// Anonymous requests simply proceed with no req.user / req.admin set.
module.exports = function optionalAuth(req, res, next) {
  const r = readBearer(req);
  if (r.status === 'ok') assignIdentity(req, r.payload);
  next();
};
