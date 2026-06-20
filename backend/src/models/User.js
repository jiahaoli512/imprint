const { Schema, model } = require('mongoose');
const { LIMITS } = require('../utils/validate');

const userSchema = new Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: LIMITS.email },
    passwordHash: { type: String, required: true },
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
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
