const { Schema, model } = require('mongoose');
const { LIMITS } = require('../utils/validate');

const waitlistSchema = new Schema(
  {
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: LIMITS.email },
    name:     { type: String, trim: true, default: null, maxlength: LIMITS.name },
    position: { type: Number, default: 0 },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('Waitlist', waitlistSchema);
