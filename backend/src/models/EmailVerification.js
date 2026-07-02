const { Schema, model } = require('mongoose');
const { LIMITS } = require('../utils/validate');

// One pending email-code challenge per email. Keyed by email (unique) so a
// resend overwrites the prior code in place. `purpose` distinguishes signup
// verification from password reset — a given email is only ever eligible for one
// at a time (signup needs no user; reset needs an existing user), so a single
// record per email never collides across purposes. The code is stored only as a
// bcrypt hash; `verifiedAt` (once set, before `expiresAt`) is what the consumer
// (registration / password reset) checks. A TTL index on `expiresAt` auto-purges
// stale/abandoned challenges — expiry is *also* enforced explicitly in the
// service, since TTL deletion can lag.
const emailVerificationSchema = new Schema(
  {
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: LIMITS.email },
    purpose:    { type: String, enum: ['signup', 'reset'], default: 'signup' },
    codeHash:   { type: String, required: true },
    expiresAt:  { type: Date, required: true },
    attempts:   { type: Number, default: 0 }, // wrong guesses against the current code
    sendCount:  { type: Number, default: 0 }, // codes issued in this challenge (resend cap)
    lastSentAt: { type: Date },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-cleanup once expired (expireAfterSeconds:0 → delete when now >= expiresAt).
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model('EmailVerification', emailVerificationSchema);
