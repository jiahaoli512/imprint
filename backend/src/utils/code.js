const crypto = require('crypto');

// Verification-code alphabet: uppercase letters + digits with the visually
// ambiguous characters removed (no 0/O, 1/I/L) so a code is easy to read off an
// email and retype. 32 symbols → 32^6 ≈ 2^30 possibilities for a 6-char code,
// which (with the per-code attempt cap and rate limits) is infeasible to guess.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

// Cryptographically-random 6-char code. crypto.randomInt is a CSPRNG and is
// unbiased over the alphabet length (rejection-sampled internally).
function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

module.exports = { generateCode, CODE_ALPHABET, CODE_LENGTH };
