const { Schema, model } = require('mongoose');

const waitlistSchema = new Schema(
  {
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:     { type: String, trim: true, default: null },
    position: { type: Number, default: 0 },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('Waitlist', waitlistSchema);
