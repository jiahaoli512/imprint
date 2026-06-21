const { Schema, model } = require('mongoose');

// A single recorded location point for a user, captured by the background tracker.
const locationSchema = new Schema(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lat:       { type: Number, required: true },
    lng:       { type: Number, required: true },
    accuracy:  { type: Number },
    visitedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = model('Location', locationSchema);
