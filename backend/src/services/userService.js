const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Waitlist = require('../models/Waitlist');

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
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function registerUser(email, password) {
  const entry = await Waitlist.findOne({ email: email.toLowerCase() });
  if (!entry || !entry.approved) throw Object.assign(new Error('Email is not approved'), { status: 403 });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw Object.assign(new Error('An account with this email already exists'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ email, passwordHash });
  await Waitlist.deleteOne({ email: email.toLowerCase() });
}

async function loginUser(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });

  return { token: signToken(user), username: user.username || null };
}

async function checkUsername(username) {
  const exists = await User.findOne({ username: username.trim().toLowerCase() });
  return { available: !exists };
}

async function setupProfile(email, { firstName, lastName, username, dateOfBirth }) {
  const year = new Date(dateOfBirth).getFullYear();
  if (year < 1000 || year > 9999)
    throw Object.assign(new Error('Please enter a valid 4-digit birth year.'), { status: 400 });
  if (ageFromDob(dateOfBirth) < 18)
    throw Object.assign(new Error('You must be at least 18 years old.'), { status: 400 });

  const taken = await User.findOne({ username: username.trim().toLowerCase(), email: { $ne: email.toLowerCase() } });
  if (taken) throw Object.assign(new Error('That username is already taken.'), { status: 409 });

  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      username: username.trim().toLowerCase(),
      dateOfBirth: new Date(dateOfBirth),
    }
  );
  return { username: username.trim().toLowerCase() };
}

async function searchUsers(q) {
  const clean = q.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!clean) return [];
  return User.find({ username: { $regex: clean, $options: 'i' } }, 'username firstName lastName').limit(8);
}

async function getUserByUsername(username) {
  const user = await User.findOne({ username: username.toLowerCase() }, 'username firstName lastName createdAt');
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });
  return user;
}

async function updateUserByUsername(username, { firstName, lastName }) {
  const user = await User.findOneAndUpdate(
    { username: username.toLowerCase() },
    { firstName: firstName?.trim() || '', lastName: lastName?.trim() || '' },
    { new: true, select: 'username firstName lastName createdAt' }
  );
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });
  return user;
}

async function listUsers() {
  return User.find({}, 'email username firstName lastName dateOfBirth createdAt').sort({ createdAt: -1 });
}

module.exports = { registerUser, loginUser, checkUsername, setupProfile, searchUsers, getUserByUsername, updateUserByUsername, listUsers };
