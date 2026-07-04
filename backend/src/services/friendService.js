const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const httpError = require('../utils/httpError');
const { normalizeUsername } = require('../utils/validate');
const { sendFriendRequestEmail, sendFriendAcceptedEmail } = require('../utils/email');

// A user's display name from first/last (empty string when neither is set).
function fullName(user) {
  return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
}

// Loads a user by username (normalized — Mongoose only lowercases on save, not
// on query), throwing a 404 if none. Kept local rather than importing
// userService's helper so friendService depends only on the User model (no
// service↔service cycle, since userService imports this file).
async function findUserByUsername(username, fields) {
  const user = await User.findOne({ username: normalizeUsername(username) }, fields);
  if (!user) throw httpError(404, 'User not found.');
  return user;
}

// The single doc (if any) between two users, in either direction.
function edgeBetween(a, b) {
  return FriendRequest.findOne({
    $or: [
      { requester: a, recipient: b },
      { requester: b, recipient: a },
    ],
  });
}

// Creates a pending request from `requesterId` to the user named
// `recipientUsername`. Rejects self-adds and any pre-existing relationship
// (pending in either direction, or already friends).
async function sendFriendRequest(requesterId, recipientUsername) {
  const recipient = await findUserByUsername(recipientUsername, 'email firstName lastName');
  if (recipient._id.toString() === requesterId)
    throw httpError(400, "You can't add yourself as a friend.");

  const existing = await edgeBetween(requesterId, recipient._id);
  if (existing) {
    if (existing.status === 'accepted') throw httpError(409, "You're already friends.");
    throw httpError(409, 'A friend request is already pending.');
  }

  try {
    await FriendRequest.create({ requester: requesterId, recipient: recipient._id });
  } catch (err) {
    // Lost a race against a concurrent identical insert — treat as already pending.
    if (err.code === 11000) throw httpError(409, 'A friend request is already pending.');
    throw err;
  }

  // Notify the recipient by email. Fire-and-forget: a mail hiccup shouldn't fail
  // the request (matches the accepted-email pattern).
  if (recipient.email) {
    const requester = await User.findById(requesterId, 'firstName lastName username');
    const requesterName = fullName(requester) || requester?.username || 'Someone';
    sendFriendRequestEmail(recipient.email, requesterName)
      .catch((err) => console.error('[email] Failed to send friend-request email:', err.message));
  }
  return { status: 'outgoing' };
}

// Pending requests awaiting this user's decision, shaped for the bell dropdown.
// Only usernames/names cross the boundary — never the requester's _id/email.
async function listIncomingRequests(userId) {
  const reqs = await FriendRequest.find({ recipient: userId, status: 'pending' })
    .sort({ createdAt: -1 })
    .populate('requester', 'username firstName lastName');
  return reqs
    .filter((r) => r.requester) // guard against a requester deleted since
    .map((r) => ({
      id: r._id.toString(),
      username: r.requester.username,
      name: fullName(r.requester),
    }));
}

// Accept or reject a pending request. Only the recipient may respond. Accept
// flips the doc to `accepted` and emails the original requester; reject deletes
// the doc (which resets the sender's button and lets them re-request later).
async function respondToRequest(userId, requestId, action) {
  if (action !== 'accept' && action !== 'reject')
    throw httpError(400, 'Invalid action.');

  const request = await FriendRequest.findById(requestId).populate('requester', 'email firstName lastName');
  if (!request || request.status !== 'pending') throw httpError(404, 'Friend request not found.');
  if (request.recipient.toString() !== userId) throw httpError(403, 'Forbidden');

  if (action === 'reject') {
    await request.deleteOne();
    return { status: 'rejected' };
  }

  request.status = 'accepted';
  request.acceptedAt = new Date();
  await request.save();

  // Notify the requester that they're now friends. Fire-and-forget: a mail
  // hiccup shouldn't fail the accept (matches the send pattern elsewhere).
  const requester = request.requester;
  if (requester?.email) {
    const accepter = await User.findById(userId, 'firstName lastName username');
    sendFriendAcceptedEmail(requester.email, fullName(requester) || 'there', fullName(accepter) || accepter?.username || 'someone')
      .catch((err) => console.error('[email] Failed to send friend-accepted email:', err.message));
  }
  return { status: 'accepted' };
}

// Removes an accepted friendship between the caller and `friendUsername` (either
// direction — the single edge is deleted, so the removal is mutual). No-op-safe:
// throws 404 if they aren't actually friends.
async function removeFriend(userId, friendUsername) {
  const other = await findUserByUsername(friendUsername, '_id');
  const edge = await edgeBetween(userId, other._id);
  if (!edge || edge.status !== 'accepted') throw httpError(404, "You aren't friends with this user.");
  await edge.deleteOne();
  return { status: 'none' };
}

// Lists a user's friends (accepted edges), for the friend-count click-through.
// Visibility: only the owner themselves or one of the owner's friends may see
// the list — anyone else gets a 403 (so a stranger can't harvest the graph).
async function listFriends(viewerId, ownerUsername) {
  const owner = await findUserByUsername(ownerUsername, '_id');
  const ownerId = owner._id;
  const isOwner = ownerId.toString() === viewerId;

  if (!isOwner) {
    const edge = await edgeBetween(viewerId, ownerId);
    if (!edge || edge.status !== 'accepted') throw httpError(403, 'Only friends can view this list.');
  }

  const edges = await FriendRequest.find({
    status: 'accepted',
    $or: [{ requester: ownerId }, { recipient: ownerId }],
  })
    .populate('requester', 'username firstName lastName')
    .populate('recipient', 'username firstName lastName');

  return edges
    .map((e) => (e.requester?._id?.toString() === ownerId.toString() ? e.recipient : e.requester))
    .filter(Boolean)
    .map((u) => ({ username: u.username, name: fullName(u) }))
    .sort((a, b) => a.username.localeCompare(b.username));
}

// Count of accepted friendships a user is part of (either side of the edge).
function getFriendCount(userId) {
  return FriendRequest.countDocuments({
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  });
}

// The viewer's relationship to a profile owner, for the profile's friend button:
//   'self' | 'none' | 'outgoing' | 'incoming' | 'friends'
// When 'incoming', also returns the pending request id so the profile's inline
// Accept can act on it directly.
async function getRelationship(viewerId, ownerId) {
  const owner = ownerId.toString();
  if (viewerId === owner) return { status: 'self' };

  const edge = await edgeBetween(viewerId, ownerId);
  if (!edge) return { status: 'none' };
  if (edge.status === 'accepted') return { status: 'friends' };
  // Pending: outgoing if the viewer sent it, incoming if they received it.
  if (edge.requester.toString() === viewerId) return { status: 'outgoing' };
  return { status: 'incoming', requestId: edge._id.toString() };
}

module.exports = {
  sendFriendRequest, listIncomingRequests, respondToRequest,
  removeFriend, listFriends, getFriendCount, getRelationship,
};
