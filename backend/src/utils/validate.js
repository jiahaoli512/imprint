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

// Password policy — mirrors the rules enforced in the Signup UI so the API
// can't be used to bypass them.
const SPECIAL_RE = /[~`!@#$%^&*()\-_+=[\]{}|\\;:"<>,.\/?]/;

function checkPassword(password) {
  if (typeof password !== 'string')
    throw Object.assign(new Error('Password is required.'), { status: 400 });
  if (password.length < 12)
    throw Object.assign(new Error('Password must be at least 12 characters.'), { status: 400 });
  if (!/[A-Z]/.test(password))
    throw Object.assign(new Error('Password must contain an uppercase letter.'), { status: 400 });
  if (!/[a-z]/.test(password))
    throw Object.assign(new Error('Password must contain a lowercase letter.'), { status: 400 });
  if (!/[0-9]/.test(password))
    throw Object.assign(new Error('Password must contain a number.'), { status: 400 });
  // Special character required, but not as the first or last character.
  if (!SPECIAL_RE.test(password.slice(1, -1)))
    throw Object.assign(new Error('Password must contain a special character (not at the start or end).'), { status: 400 });
}

module.exports = { LIMITS, checkLength, checkNoSpaces, checkNameChars, checkPassword, NAME_RE, NAME_SPACES_RE };
