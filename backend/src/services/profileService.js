const User = require('../models/User');
const {
  checkRequired, normalizeEmail, normalizeUsername, validateName, validateUsername, cleanName,
} = require('../utils/validate');
const { validateDateOfBirth } = require('../utils/validateDob');
const { COOLDOWN_DAYS, daysUntil } = require('../utils/cooldowns');
const httpError = require('../utils/httpError');
const { findUserByUsername } = require('./userLookup');
const { friendSummaryFor } = require('./friendService');
const { toProfileView } = require('./userSerializers');

// Field projections — define what each query exposes in one place.
const PROFILE_FIELDS = 'username firstName lastName dateOfBirth createdAt usernameChangedAt nameChangedAt';
const SEARCH_FIELDS = 'username firstName lastName -_id'; // client keys by username; _id stays internal
const ADMIN_LIST_FIELDS = 'email username firstName lastName dateOfBirth createdAt';

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

async function getUserByUsername(username) {
  return findUserByUsername(username, PROFILE_FIELDS);
}

async function getProfileFor(username, { viewerId = null, isAdmin = false } = {}) {
  const user = await getUserByUsername(username);
  const isOwner = !!viewerId && viewerId === user._id.toString();
  const view = toProfileView(user, { isOwner, isAdmin });

  // Friend fields are DB-backed, so they're attached here rather than in the pure
  // toProfileView serializer. friendService owns their shape (count + the viewer's
  // relationship); this layer just merges the summary in.
  const friends = await friendSummaryFor(user._id, { viewerId, isOwner });
  return { ...view, ...friends };
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
  checkUsername, setupProfile, searchUsers, getProfileFor, updateUserByUsername, listUsers,
};
