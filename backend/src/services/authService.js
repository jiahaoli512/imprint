const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Waitlist = require('../models/Waitlist');
const { checkLength, checkRequired, normalizeEmail, normalizeUsername } = require('../utils/validate');
const { validatePassword } = require('../utils/validatePassword');
const httpError = require('../utils/httpError');
const { toAuthResult } = require('./userSerializers');
const { assertEmailVerified, consumeVerification } = require('./verificationService');

async function registerUser(email, password) {
  checkRequired('Email', email);
  checkLength('email', email);
  validatePassword(password);
  email = normalizeEmail(email);

  const entry = await Waitlist.findOne({ email });
  if (!entry || !entry.approved) throw httpError(403, 'Email is not approved');

  const existing = await User.findOne({ email });
  if (existing) throw httpError(409, 'An account with this email already exists');

  // Proof-of-inbox: the email must have completed code verification. This is the
  // non-bypassable enforcement point — skipping the verify UI still fails here.
  await assertEmailVerified(email);

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ email, passwordHash });
  await Promise.all([
    Waitlist.deleteOne({ email }),
    consumeVerification(email),
  ]);
}

// A bcrypt hash of a throwaway value, compared against when the email isn't
// found so login takes ~the same time whether or not the account exists (closes
// the timing oracle that would otherwise reveal which emails are registered).
const DUMMY_HASH = bcrypt.hashSync('imprint-no-such-user', 12);

// `identifier` is either the account's email or its username — an "@" is
// never valid in a username (see USERNAME_RE), so it unambiguously selects
// which field to look up by. Usernames are set during onboarding (sparse on
// User), so an account mid-onboarding can only be looked up by email; that's
// fine, it just means username login only becomes available once one is set.
async function loginUser(identifier, password) {
  if (typeof identifier !== 'string' || typeof password !== 'string')
    throw httpError(401, 'Invalid email/username or password.');

  const trimmed = identifier.trim();
  const filter = trimmed.includes('@')
    ? { email: normalizeEmail(trimmed) }
    : { username: normalizeUsername(trimmed) };

  // passwordHash is select:false, so opt it back in here (the only place that
  // needs it).
  const user = await User.findOne(filter).select('+passwordHash');
  // Always run a compare (real hash, or the dummy) so timing doesn't leak
  // account existence.
  const match = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !match) throw httpError(401, 'Invalid email/username or password.');

  return toAuthResult(user);
}

module.exports = { registerUser, loginUser };
