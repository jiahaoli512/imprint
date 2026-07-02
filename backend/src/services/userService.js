const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Waitlist = require('../models/Waitlist');
const {
  checkLength, checkPassword, checkRequired,
  normalizeEmail, normalizeUsername, validateName, validateUsername, cleanName,
  validateDateOfBirth, COOLDOWN_DAYS, daysUntil,
} = require('../utils/validate');
const httpError = require('../utils/httpError');
const {
  assertEmailVerified, consumeVerification,
  requestResetCode, verifyResetCode, assertResetVerified, consumeReset,
} = require('./verificationService');

// Field projections — define what each query exposes in one place.
const PROFILE_FIELDS = 'username firstName lastName dateOfBirth createdAt usernameChangedAt nameChangedAt';
const SEARCH_FIELDS = 'username firstName lastName -_id'; // client keys by username; _id stays internal
const ADMIN_LIST_FIELDS = 'email username firstName lastName dateOfBirth createdAt';

function signToken(user) {
  return jwt.sign(
    { type: 'user', id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function registerUser(email, password) {
  checkRequired('Email', email);
  checkRequired('Password', password);
  checkLength('email', email);
  checkLength('password', password);
  checkPassword(password);
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

  return { token: signToken(user), username: user.username || null };
}

// --- password reset (forgot-password flow) ----------------------------------
// Emails a 6-char reset code (same challenge as signup) to an existing account.
// Enumeration-safe: generic success whether or not the email has an account.
async function requestPasswordReset(email) {
  return requestResetCode(email);
}

// Verifies a reset code. On success the user is effectively logged in (proving
// inbox control), so we return the same { token, username } as loginUser — this
// is what lets the client either change the password or skip straight to the
// dashboard. The reset challenge stays verified (not consumed) so a follow-up
// resetPassword call is authorized.
async function verifyPasswordReset(email, code) {
  await verifyResetCode(email, code);
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) throw httpError(400, 'Invalid or expired code. Please request a new one.');
  return { token: signToken(user), username: user.username || null };
}

// Sets a new password for the account. Gated by assertResetVerified (a verified,
// unexpired reset challenge) on top of the route's requireAuth, then reuses the
// same password policy as signup. Consumes the challenge (single-use).
async function resetPassword(email, newPassword) {
  await assertResetVerified(email);
  checkRequired('Password', newPassword);
  checkLength('password', newPassword);
  checkPassword(newPassword);
  email = normalizeEmail(email);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ email }, { passwordHash });
  await consumeReset(email);
}

// "Skip & log in" path: the client already holds the token from verify; clear the
// verified challenge so it can't be reused.
async function finishReset(email) {
  await consumeReset(email);
}

async function checkUsername(username) {
  checkRequired('Username', username);
  const exists = await User.findOne({ username: normalizeUsername(username) });
  return { available: !exists };
}

async function setupProfile(email, { firstName, lastName, username, dateOfBirth }) {
  checkRequired('Username', username);
  checkRequired('Date of birth', dateOfBirth);
  validateUsername(username);
  validateName({ firstName, lastName });
  validateDateOfBirth(dateOfBirth);

  email = normalizeEmail(email);
  username = normalizeUsername(username);

  const taken = await User.findOne({ username, email: { $ne: email } });
  if (taken) throw httpError(409, 'That username is already taken.');

  await User.findOneAndUpdate(
    { email },
    { firstName: cleanName(firstName), lastName: cleanName(lastName), username, dateOfBirth: new Date(dateOfBirth) }
  );
  return { username };
}

async function searchUsers(q) {
  // Strip non-username chars (no regex injection possible — only [a-z0-9_]
  // remain) and cap length. Username max is 20, so 30 is generous.
  const clean = String(q || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
  if (!clean) return [];
  // Anchored prefix match: `^clean` is a left-rooted range the `username` index
  // can serve, instead of an unanchored `$regex` that forces a full collection
  // scan. usernames are stored lowercase, so no case-insensitive flag is needed.
  return User.find({ username: { $regex: `^${clean}` } }, SEARCH_FIELDS).limit(8);
}

// Normalizes the username and loads the user (optionally projected to `fields`),
// throwing a 404 if none exists. Centralizes the lookup so callers can't forget
// to normalize before querying (Mongoose only lowercases on save, not on query).
async function findUserByUsername(username, fields) {
  const user = await User.findOne({ username: normalizeUsername(username) }, fields);
  if (!user) throw httpError(404, 'User not found.');
  return user;
}

async function getUserByUsername(username) {
  return findUserByUsername(username, PROFILE_FIELDS);
}

// Shapes a User document into the public profile representation for a given
// viewer. The raw Mongoose document never crosses this boundary: the internal
// _id (and anything else on the doc) is dropped, and the owner-only fields —
// date of birth and the cooldown stamps the edit screen needs — are included
// only for the owner or an admin. Keeping the whole visibility policy here means
// callers just get "the profile this viewer may see," with no field-level rules
// leaking into the HTTP layer.
function toProfileView(user, { isOwner = false, isAdmin = false } = {}) {
  const view = {
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
  };
  if (isOwner || isAdmin) {
    view.dateOfBirth = user.dateOfBirth;
    view.usernameChangedAt = user.usernameChangedAt;
    view.nameChangedAt = user.nameChangedAt;
  }
  return view;
}

async function getProfileFor(username, { viewerId = null, isAdmin = false } = {}) {
  const user = await getUserByUsername(username);
  const isOwner = !!viewerId && viewerId === user._id.toString();
  return toProfileView(user, { isOwner, isAdmin });
}

// Edits a profile's name and/or username. Each field group is applied only when
// present in the body and only when it actually changes; a no-op submission is
// rejected so it can't silently consume a cooldown. Self-service edits are
// rate-limited (username once / 30d, name once / 7d) via the *ChangedAt stamps;
// admins bypass the cooldown and never write the stamps (so they don't affect a
// user's own limit).
async function updateUserByUsername(username, { firstName, lastName, username: newUsername }, { viewerId = null, isAdmin = false } = {}) {
  const user = await findUserByUsername(username);

  // Users may only edit their own profile; admins may edit any.
  if (!isAdmin && user._id.toString() !== viewerId) throw httpError(403, 'Forbidden');

  let changed = false;

  // Name group — only when the client sent name fields.
  if (firstName !== undefined || lastName !== undefined) {
    validateName({ firstName, lastName });
    const nextFirst = cleanName(firstName);
    const nextLast = cleanName(lastName);
    if (nextFirst === user.firstName && nextLast === user.lastName)
      throw httpError(400, 'Your new name must be different from your current name.');
    if (!isAdmin) {
      const wait = daysUntil(user.nameChangedAt, COOLDOWN_DAYS.name);
      if (wait > 0) throw httpError(429, `You can change your name again in ${wait} day${wait === 1 ? '' : 's'}.`);
    }
    user.firstName = nextFirst;
    user.lastName = nextLast;
    if (!isAdmin) user.nameChangedAt = new Date();
    changed = true;
  }

  // Username group — only when the client sent a username.
  if (newUsername !== undefined) {
    validateUsername(newUsername);
    const nextUsername = normalizeUsername(newUsername);
    if (nextUsername === user.username)
      throw httpError(400, 'Your new username must be different from your current username.');
    const taken = await User.findOne({ username: nextUsername, _id: { $ne: user._id } });
    if (taken) throw httpError(409, 'That username is already taken.');
    if (!isAdmin) {
      const wait = daysUntil(user.usernameChangedAt, COOLDOWN_DAYS.username);
      if (wait > 0) throw httpError(429, `You can change your username again in ${wait} day${wait === 1 ? '' : 's'}.`);
    }
    user.username = nextUsername;
    if (!isAdmin) user.usernameChangedAt = new Date();
    changed = true;
  }

  if (!changed) throw httpError(400, 'Make a change before saving.');

  await user.save();
  // Only the owner or an admin reaches here, so return the private view (the
  // owner's edit screen needs the refreshed cooldown stamps). Shaped through the
  // same serializer so the response never carries the raw doc / _id.
  return toProfileView(user, { isOwner: user._id.toString() === viewerId, isAdmin });
}

async function listUsers() {
  return User.find({}, ADMIN_LIST_FIELDS).sort({ createdAt: -1 });
}

module.exports = {
  registerUser, loginUser, checkUsername, setupProfile, searchUsers,
  getProfileFor, updateUserByUsername, listUsers,
  requestPasswordReset, verifyPasswordReset, resetPassword, finishReset,
};
