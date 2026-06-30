const { Schema, model } = require('mongoose');
const { LIMITS } = require('../utils/validate');

// One pending email-verification challenge per signup email. Keyed by email
// (unique) so a resend overwrites the prior code in place. The code is stored
// only as a bcrypt hash; `verifiedAt` (once set, before `expiresAt`) is what
// registration checks. A TTL index on `expiresAt` auto-purges stale/abandoned
// challenges — expiry is *also* enforced explicitly in the service, since TTL
// deletion can lag.
const emailVerificationSchema = new Schema(
  {
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: LIMITS.email },
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
