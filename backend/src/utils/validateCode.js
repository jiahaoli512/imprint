const httpError = require('./httpError');

// Email-verification code format check. Split out of validate.js as its own
// domain. Mirrors the alphabet/length in utils/code.js — kept as a literal
// here (rather than importing code.js) so this stays dependency-free. Accepts
// the code after the caller has uppercased it.
const VERIFICATION_CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

// Throws a 400 unless `code` is a well-formed 6-char verification code. The
// service uppercases before calling, so input casing doesn't matter to the user.
function validateVerificationCode(code) {
  if (typeof code !== 'string' || !VERIFICATION_CODE_RE.test(code))
    throw httpError(400, 'Enter the 6-character code from your email.');
}

module.exports = { validateVerificationCode, VERIFICATION_CODE_RE };
