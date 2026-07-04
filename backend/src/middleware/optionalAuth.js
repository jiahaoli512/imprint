const { readBearer, assignIdentity, userTokenFresh } = require('./jwt');

// Decodes a Bearer token if present (user or admin), but never rejects.
// Anonymous requests simply proceed with no req.user / req.admin set. A revoked
// user token (stale tokenVersion) is treated as anonymous rather than rejected.
module.exports = async function optionalAuth(req, res, next) {
  const r = readBearer(req);
  if (r.status === 'ok' && await userTokenFresh(r.payload)) assignIdentity(req, r.payload);
  next();
};
