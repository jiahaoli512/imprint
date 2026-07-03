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

// Username format — 3–20 chars of [a-z0-9_]. Kept in sync with the frontend's
// USERNAME_RE in frontend/src/utils/validateName.js (the server can't import
// frontend utils). Enforced server-side here so the API can't be used to set a
// malformed username that the client UI would reject.
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

// Throws a 400 if the username isn't well-formed. Used by both profile write
// paths (setup + edit).
function validateUsername(username) {
  checkLength('username', username);
  if (!USERNAME_RE.test(normalizeUsername(username)))
    throw httpError(400, 'Username must be 3–20 characters: letters, numbers, underscores.');
}

// Edit cooldown windows, in days. Username changes at most once a month, names
// at most once a week. Enforced per-user via the User.*ChangedAt timestamps.
const COOLDOWN_DAYS = { username: 30, name: 7 };

// Whole days remaining before `lastChangedAt` clears a `days`-long cooldown
// (0 when eligible, or when there's no prior change). Used to gate self-service
// edits and to build the "try again in N day(s)" message.
function daysUntil(lastChangedAt, days) {
  if (!lastChangedAt) return 0;
  const elapsedMs = Date.now() - new Date(lastChangedAt).getTime();
  const remainingMs = days * 24 * 60 * 60 * 1000 - elapsedMs;
  return remainingMs <= 0 ? 0 : Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
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

// --- date of birth -----------------------------------------------------------
const MIN_AGE = 18;

// Whole years between `dob` and today.
function ageFromDob(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// True if `s` (a "YYYY-MM-DD" string) is a real calendar date — i.e. the day/
// month didn't silently roll over. `new Date("2006-02-30")` yields Mar 2, so a
// plausible-looking impossible date would otherwise pass. Rejects 2/30, 6/31, …
function isRealCalendarDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

// Throws a 400 unless `dateOfBirth` is a real calendar date (no month/day
// rollover) with a 4-digit year and an age of at least MIN_AGE. Keeps the signup
// age gate next to the other validators rather than inline in the service.
function validateDateOfBirth(dateOfBirth) {
  if (!isRealCalendarDate(dateOfBirth))
    throw httpError(400, 'Please enter a valid date of birth.');
  const year = +String(dateOfBirth).slice(0, 4);
  if (year < 1000 || year > 9999)
    throw httpError(400, 'Please enter a valid 4-digit birth year.');
  if (ageFromDob(dateOfBirth) < MIN_AGE)
    throw httpError(400, `You must be at least ${MIN_AGE} years old.`);
}

// --- email verification code -------------------------------------------------
// Mirrors the alphabet/length in utils/code.js. Kept as a literal here (rather
// than importing code.js) so validate.js stays dependency-free. Accepts the code
// after the caller has uppercased it.
const VERIFICATION_CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

// Throws a 400 unless `code` is a well-formed 6-char verification code. The
// service uppercases before calling, so input casing doesn't matter to the user.
function validateVerificationCode(code) {
  if (typeof code !== 'string' || !VERIFICATION_CODE_RE.test(code))
    throw httpError(400, 'Enter the 6-character code from your email.');
}

// --- geographic coordinate validation ---------------------------------------
// Shared by the marker (saved [lat,lng] arrays) and location (tracked point
// objects) write paths so coordinate sanity lives in one place.
const MAX_POINTS = 50000; // hard cap on a saved marker array (the 100kb body limit caps lower)

function inRange(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Throws 400 unless `pair` is a finite, in-range [lat, lng] tuple.
function validateCoordPair(pair) {
  if (!Array.isArray(pair) || pair.length < 2 || !inRange(pair[0], pair[1]))
    throw httpError(400, 'Each marker must be a valid [lat, lng] coordinate.');
}

// Validates a marker array ([[lat,lng], ...]): an array within the count cap of
// finite, in-range pairs. Returns the array for convenient chaining.
function validatePoints(points, { max = MAX_POINTS } = {}) {
  if (!Array.isArray(points)) throw httpError(400, 'points must be an array.');
  if (points.length > max) throw httpError(400, `Too many points (max ${max}).`);
  points.forEach(validateCoordPair);
  return points;
}

// True if a tracked-location object has finite, in-range coordinates. Returns a
// boolean (not a throw) so the batch ingest can drop bad points individually.
function isValidLocationPoint(p) {
  return !!p && inRange(p.lat, p.lng);
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
  checkRequired, normalizeEmail, normalizeUsername, validateName, validateUsername, cleanName,
  COOLDOWN_DAYS, daysUntil, NAME_RE, NAME_SPACES_RE, USERNAME_RE,
  validateDateOfBirth, validateVerificationCode,
  validatePoints, validateCoordPair, isValidLocationPoint, MAX_POINTS,
};
