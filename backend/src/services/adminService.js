const jwt = require('jsonwebtoken');
const httpError = require('../utils/httpError');

// Validates the admin password (server-side) and mints a short-lived admin JWT.
// Keeps "how admin tokens are minted" in the service layer, alongside the user
// auth logic, rather than inline in the route.
function login(password) {
  if (!password || password !== process.env.ADMIN_PASSWORD)
    throw httpError(401, 'Incorrect password.');
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  return { token };
}

module.exports = { login };
