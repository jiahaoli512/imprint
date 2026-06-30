const bcrypt = require('bcryptjs');
const EmailVerification = require('../models/EmailVerification');
const Waitlist = require('../models/Waitlist');
const User = require('../models/User');
const httpError = require('../utils/httpError');
const { normalizeEmail, checkRequired, validateVerificationCode } = require('../utils/validate');
const { generateCode } = require('../utils/code');
const { sendVerificationEmail } = require('../utils/email');

const CODE_TTL_MS = 30 * 60 * 1000;     // code (and post-verify window) lifetime: 30 min
const RESEND_COOLDOWN_MS = 60 * 1000;   // min gap between sends to one email
const MAX_SENDS = 5;                    // codes issued per challenge before lockout
const MAX_ATTEMPTS = 5;                 // wrong guesses per issued code before lockout
const BCRYPT_ROUNDS = 10;               // codes are short-lived + attempt-capped

// Uniform error for every "the code didn't work" case (missing / expired / wrong
// / too many attempts) so the endpoint can't be used as an oracle.
const INVALID_CODE = () => httpError(400, 'Invalid or expired code. Please request a new one.');

// True only when the email may register right now: an approved waitlist entry
// exists and no account has been created yet. Mirrors the gate in
// waitlistService.checkWaitlist so a code is never issued to an ineligible email.
async function eligibleForCode(email) {
  const entry = await Waitlist.findOne({ email }, 'approved');
  if (!entry || !entry.approved) return false;
  const existingUser = await User.findOne({ email }, '_id');
  return !existingUser;
}

// Issues (or re-issues) a verification code for an eligible email and emails it.
// Returns the same generic result whether or not the email is eligible, so this
// endpoint reveals nothing beyond what checkWaitlist already does. Resends are
// throttled per-email (cooldown + total-send cap) to prevent inbox flooding.
async function requestCode(email) {
  checkRequired('Email', email);
  email = normalizeEmail(email);

  if (!(await eligibleForCode(email))) return { ok: true }; // no send, no disclosure

  const existing = await EmailVerification.findOne({ email });
  const now = Date.now();
  if (existing) {
    if (existing.lastSentAt && now - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS)
      throw httpError(429, 'Please wait a moment before requesting another code.');
    if (existing.sendCount >= MAX_SENDS)
      throw httpError(429, 'Too many codes requested. Please try again later.');
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  await EmailVerification.findOneAndUpdate(
    { email },
    {
      $set: { codeHash, expiresAt: new Date(now + CODE_TTL_MS), lastSentAt: new Date(now), attempts: 0, verifiedAt: null },
      $inc: { sendCount: 1 },
    },
    { upsert: true, new: true }
  );

  await sendVerificationEmail(email, code);
  return { ok: true };
}

// Checks a submitted code. On success, marks the challenge verified and refreshes
// the window so the user has time to finish the password step. Every failure
// returns the same opaque error.
async function verifyCode(email, code) {
  checkRequired('Email', email);
  code = String(code || '').trim().toUpperCase();
  validateVerificationCode(code);
  email = normalizeEmail(email);

  const record = await EmailVerification.findOne({ email });
  if (!record || record.expiresAt.getTime() <= Date.now()) throw INVALID_CODE();

  // Atomically claim an attempt slot; if the code is already at the cap this
  // returns null, so concurrent guesses can't race past MAX_ATTEMPTS.
  const claimed = await EmailVerification.findOneAndUpdate(
    { _id: record._id, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true }
  );
  if (!claimed) throw INVALID_CODE();

  if (!(await bcrypt.compare(code, claimed.codeHash))) throw INVALID_CODE();

  await EmailVerification.updateOne(
    { _id: claimed._id },
    { $set: { verifiedAt: new Date(), expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0 } }
  );
  return { ok: true };
}

// Registration guard: the email must have a verified, unexpired challenge. Throws
// 403 otherwise. Called inside registerUser so the verify step can't be skipped
// by hitting the register endpoint directly.
async function assertEmailVerified(email) {
  const record = await EmailVerification.findOne({ email });
  if (!record || !record.verifiedAt || record.expiresAt.getTime() <= Date.now())
    throw httpError(403, 'Please verify your email before creating your account.');
}

// Clears the challenge once the account is created (single-use).
async function consumeVerification(email) {
  await EmailVerification.deleteOne({ email });
}

module.exports = { requestCode, verifyCode, assertEmailVerified, consumeVerification };
