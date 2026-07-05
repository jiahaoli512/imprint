const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Waitlist = require('../models/Waitlist');
const { checkLength, checkRequired, validatePassword, normalizeEmail } = require('../utils/validate');
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

async function loginUser(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string')
    throw httpError(401, 'Invalid email or password.');

  // passwordHash is select:false, so opt it back in here (the only place that
  // needs it).
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+passwordHash');
  // Always run a compare (real hash, or the dummy) so timing doesn't leak
  // account existence.
  const match = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !match) throw httpError(401, 'Invalid email or password.');

  return toAuthResult(user);
}

module.exports = { registerUser, loginUser };
