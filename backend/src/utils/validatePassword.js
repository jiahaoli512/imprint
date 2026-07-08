const httpError = require('./httpError');
const { checkRequired, checkLength } = require('./validate');

// Password policy. Split out of validate.js as its own domain — mirrors the
// rules enforced in the Signup UI so the API can't be used to bypass them.
const SPECIAL_RE = /[~`!@#$%^&*()\-_+=[\]{}|\\;:"<>,.\/?]/;

function checkPassword(password) {
  if (typeof password !== 'string')
    throw httpError(400, 'Password is required.');
  if (password.length < 12)
    throw httpError(400, 'Password must be at least 12 characters.');
  if (!/[A-Z]/.test(password))
    throw httpError(400, 'Password must contain an uppercase letter.');
  if (!/[a-z]/.test(password))
    throw httpError(400, 'Password must contain a lowercase letter.');
  if (!/[0-9]/.test(password))
    throw httpError(400, 'Password must contain a number.');
  // Special character required, but not as the first or last character.
  if (!SPECIAL_RE.test(password.slice(1, -1)))
    throw httpError(400, 'Password must contain a special character (not at the start or end).');
}

// Full validation of a password input: presence, the max-length cap (LIMITS,
// which checkPassword doesn't enforce), then the strength policy. One entry point
// so signup and password reset validate identically.
function validatePassword(password) {
  checkRequired('Password', password);
  checkLength('password', password);
  checkPassword(password);
}

module.exports = { validatePassword, checkPassword, SPECIAL_RE };
