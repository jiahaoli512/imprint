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

module.exports = { LIMITS, checkLength };
