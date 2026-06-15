const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName:    { type: String, trim: true, default: '' },
    lastName:     { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
