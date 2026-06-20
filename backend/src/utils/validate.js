const httpError = require('./httpError');

// Field length limits, shared between validation and schema definitions.
const LIMITS = {
  email:     254, // RFC 5321
  password:  200, // bcrypt only uses first 72 bytes; cap to avoid wasteful hashing
  name:      100, // waitlist display name
  firstName: 50,
  lastName:  50,
  username:  20,
  feedback:  5000, // contact form message body
};

// Pragmatic email-format check: a non-empty local part, an "@", and a dotted
// domain. Deliberately lenient — full RFC 5322 validation is overkill and
// rejects valid addresses; real deliverability is proven by sending.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Throws a 400 if the value isn't a plausibly-formatted email.
function checkEmail(value) {
  if (typeof value !== 'string' || !EMAIL_RE.test(value.trim()))
    throw httpError(400, 'A valid email is required.');
}

// Canonical forms used for storage and lookups. The Mongoose schemas already
// lowercase/trim on save, but query values are not auto-normalized — these keep
// that rule in one place so a stray query can't miss a stored document.
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}
function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

// Throws a 400 if the value is missing/blank after trimming.
function checkRequired(label, value) {
  if (typeof value !== 'string' || !value.trim())
    throw httpError(400, `${label} is required.`);
}

// Shared name validation for the two profile write paths (setup + edit).
function validateName({ firstName, lastName }) {
  checkLength('firstName', firstName);
  checkLength('lastName', lastName);
  checkNoSpaces('First name', firstName);
  checkNameChars('First name', firstName);
  checkNameChars('Last name', lastName, { allowSpaces: true });
}

// Trims a name field to its stored form (empty string when absent).
function cleanName(value) {
  return (value || '').trim();
}

// Throws a 400 error if `value` is a string longer than the limit for `field`.
function checkLength(field, value) {
  if (value == null) return;
  if (typeof value !== 'string')
    throw httpError(400, `${field} must be a string.`);
  if (value.length > LIMITS[field])
    throw httpError(400, `${field} must be ${LIMITS[field]} characters or fewer.`);
}

// Throws a 400 error if the trimmed value contains any internal whitespace.
function checkNoSpaces(label, value) {
  if (value == null) return;
  if (/\s/.test(value.trim()))
    throw httpError(400, `${label} cannot contain spaces.`);
}

// Letters (any language), hyphens and apostrophes. Optionally allow spaces.
const NAME_RE = /^[\p{L}'’-]+$/u;
const NAME_SPACES_RE = /^[\p{L}'’ -]+$/u;

// Throws a 400 error if a non-empty value contains characters other than
// letters, hyphens, apostrophes (and spaces when allowSpaces is true).
function checkNameChars(label, value, { allowSpaces = false } = {}) {
  if (value == null) return;
  const v = value.trim();
  if (!v) return; // empty handled by separate required checks
  const re = allowSpaces ? NAME_SPACES_RE : NAME_RE;
  if (!re.test(v)) {
    const extra = allowSpaces ? ', spaces,' : ',';
    throw Object.assign(
      new Error(`${label} can only contain letters${extra} hyphens, and apostrophes.`),
      { status: 400 }
    );
  }
}

// Password policy — mirrors the rules enforced in the Signup UI so the API
// can't be used to bypass them.
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

module.exports = {
  LIMITS, checkLength, checkNoSpaces, checkNameChars, checkEmail, checkPassword,
  checkRequired, normalizeEmail, normalizeUsername, validateName, cleanName,
  NAME_RE, NAME_SPACES_RE,
};
