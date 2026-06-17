// Field length limits, shared between validation and schema definitions.
const LIMITS = {
  email:     254, // RFC 5321
  password:  200, // bcrypt only uses first 72 bytes; cap to avoid wasteful hashing
  name:      100, // waitlist display name
  firstName: 50,
  lastName:  50,
  username:  20,
};

// Throws a 400 error if `value` is a string longer than the limit for `field`.
function checkLength(field, value) {
  if (value == null) return;
  if (typeof value !== 'string')
    throw Object.assign(new Error(`${field} must be a string.`), { status: 400 });
  if (value.length > LIMITS[field])
    throw Object.assign(new Error(`${field} must be ${LIMITS[field]} characters or fewer.`), { status: 400 });
}

// Throws a 400 error if the trimmed value contains any internal whitespace.
function checkNoSpaces(label, value) {
  if (value == null) return;
  if (/\s/.test(value.trim()))
    throw Object.assign(new Error(`${label} cannot contain spaces.`), { status: 400 });
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

module.exports = { LIMITS, checkLength, checkNoSpaces, checkNameChars, NAME_RE, NAME_SPACES_RE };
