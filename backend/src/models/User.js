const { Schema, model } = require('mongoose');
const { LIMITS } = require('../utils/validate');

const userSchema = new Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: LIMITS.email },
    // select:false so the hash is excluded from queries by default — a query
    // that forgets an explicit projection can't accidentally leak it. The only
    // reader (loginUser) opts back in with .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
    firstName:    { type: String, trim: true, default: '', maxlength: LIMITS.firstName },
    lastName:     { type: String, trim: true, default: '', maxlength: LIMITS.lastName },
    username:     { type: String, trim: true, lowercase: true, unique: true, sparse: true, maxlength: LIMITS.username },
    dateOfBirth:  { type: Date },
    // Last self-service (non-admin) change of each field — drives the edit
    // cooldowns (username: 30d, name: 7d). Unset until the first such change, so
    // a user's first post-setup edit of each is free. Admin edits never touch
    // these, so they don't start or reset a user's cooldown.
    usernameChangedAt: { type: Date },
    nameChangedAt:     { type: Date },
    // Bumped whenever existing sessions must be revoked (e.g. a password reset).
    // User JWTs carry the version they were minted at; the auth middleware rejects
    // a token whose version no longer matches, so old tokens stop working.
    tokenVersion:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
