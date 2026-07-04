const { Schema, model } = require('mongoose');

// A directed friendship edge between two users. A `pending` doc is an
// outstanding friend request (requester → recipient); once the recipient
// accepts it flips to `accepted` and represents the (undirected) friendship. A
// reject is a hard delete — removing the doc is what "resets" the sender's
// button and frees them to request again later, so no `rejected` status is kept.
// The service checks both directions before inserting, so at most one doc ever
// exists for a pair; the unique compound index guards that against races.
const friendRequestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status:     { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

// One directed edge per (requester, recipient) pair — a duplicate request can't
// be created even under a race.
friendRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });
// Fast lookups for the friend count and the incoming-request list.
friendRequestSchema.index({ recipient: 1, status: 1 });

module.exports = model('FriendRequest', friendRequestSchema);
