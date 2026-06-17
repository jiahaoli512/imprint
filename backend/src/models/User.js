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
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
