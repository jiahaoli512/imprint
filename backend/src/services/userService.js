const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Waitlist = require('../models/Waitlist');
const {
  checkLength, checkPassword, checkRequired,
  normalizeEmail, normalizeUsername, validateName, validateUsername, cleanName,
  COOLDOWN_DAYS, daysUntil,
} = require('../utils/validate');
const httpError = require('../utils/httpError');

// Field projections — define what each query exposes in one place.
const PROFILE_FIELDS = 'username firstName lastName dateOfBirth createdAt usernameChangedAt nameChangedAt';
const SEARCH_FIELDS = 'username firstName lastName';
const ADMIN_LIST_FIELDS = 'email username firstName lastName dateOfBirth createdAt';

function ageFromDob(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

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

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ email, passwordHash });
  await Waitlist.deleteOne({ email });
}

async function loginUser(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string')
    throw httpError(401, 'Invalid email or password.');

  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) throw httpError(401, 'Invalid email or password.');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw httpError(401, 'Invalid email or password.');

  return { token: signToken(user), username: user.username || null };
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

  const year = new Date(dateOfBirth).getFullYear();
  if (year < 1000 || year > 9999)
    throw httpError(400, 'Please enter a valid 4-digit birth year.');
  if (ageFromDob(dateOfBirth) < 18)
    throw httpError(400, 'You must be at least 18 years old.');

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
  const clean = q.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!clean) return [];
  return User.find({ username: { $regex: clean, $options: 'i' } }, SEARCH_FIELDS).limit(8);
}

async function getUserByUsername(username) {
  const user = await User.findOne({ username: normalizeUsername(username) }, PROFILE_FIELDS);
  if (!user) throw httpError(404, 'User not found.');
  return user;
}

// Returns a profile shaped for a given viewer: date of birth is private, so it's
// stripped unless the viewer is the owner or an admin. Keeps the privacy rule
// next to the data rather than in the HTTP layer.
async function getProfileFor(username, { viewerId = null, isAdmin = false } = {}) {
  const user = await getUserByUsername(username);
  const profile = user.toObject();
  const isOwner = viewerId && viewerId === user._id.toString();
  if (!isOwner && !isAdmin) delete profile.dateOfBirth;
  return profile;
}

// Edits a profile's name and/or username. Each field group is applied only when
// present in the body and only when it actually changes; a no-op submission is
// rejected so it can't silently consume a cooldown. Self-service edits are
// rate-limited (username once / 30d, name once / 7d) via the *ChangedAt stamps;
// admins bypass the cooldown and never write the stamps (so they don't affect a
// user's own limit).
async function updateUserByUsername(username, { firstName, lastName, username: newUsername }, { viewerId = null, isAdmin = false } = {}) {
  const user = await User.findOne({ username: normalizeUsername(username) });
  if (!user) throw httpError(404, 'User not found.');

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
  return User.findById(user._id, PROFILE_FIELDS);
}

async function listUsers() {
  return User.find({}, ADMIN_LIST_FIELDS).sort({ createdAt: -1 });
}

module.exports = {
  registerUser, loginUser, checkUsername, setupProfile, searchUsers,
  getUserByUsername, getProfileFor, updateUserByUsername, listUsers,
};
