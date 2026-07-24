const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const httpError = require('../utils/httpError');
const { findUserByUsername } = require('./userLookup');
const { toPublicUser } = require('./userSerializers');
const { notifyFriendRequest, notifyFriendAccepted } = require('./friendNotifications');
const { RELATIONSHIP, RESPONSE, EDGE } = require('../constants/friendship');

// Projection for a user rendered publicly (never exposes _id/email); toPublicUser
// (userSerializers) turns such a doc into the shape the client receives.
const PUBLIC_USER_FIELDS = 'username firstName lastName';

// The single doc (if any) between two users, in either direction.
function edgeBetween(a, b) {
  return FriendRequest.findOne({
    $or: [
      { requester: a, recipient: b },
      { requester: b, recipient: a },
    ],
  });
}

// Whether an edge (possibly null) represents an established friendship.
const isAccepted = (edge) => !!edge && edge.status === EDGE.ACCEPTED;

// Whether two users (by id) are currently friends. Exposed for other services
// that gate access on friendship (e.g. marker visibility).
async function areFriends(aId, bId) {
  return isAccepted(await edgeBetween(aId, bId));
}

// The friends-only visibility rule, owned here so callers don't re-implement it
// (or reach into friendship internals): a viewer may see an owner's gated data
// only if they're the owner, an admin, or an accepted friend — else 403. Used for
// both a user's markers and their friend list.
async function assertCanViewOwnerData(viewerId, ownerId, { isAdmin = false, message = 'Not authorized.' } = {}) {
  if (isAdmin) return;
  const owner = ownerId.toString();
  if (viewerId && (viewerId === owner || await areFriends(viewerId, owner))) return;
  throw httpError(403, message);
}

// Query matching every accepted friendship a user is part of (either side).
const acceptedFriendshipsOf = (userId) => ({
  status: EDGE.ACCEPTED,
  $or: [{ requester: userId }, { recipient: userId }],
});

// Creates a pending request from `requesterId` to the user named
// `recipientUsername`. Rejects self-adds and any pre-existing relationship
// (pending in either direction, or already friends).
async function sendFriendRequest(requesterId, recipientUsername) {
  const recipient = await findUserByUsername(recipientUsername, 'email');
  if (recipient._id.toString() === requesterId)
    throw httpError(400, "You can't add yourself as a friend.");

  const existing = await edgeBetween(requesterId, recipient._id);
  if (existing) {
    if (isAccepted(existing)) throw httpError(409, "You're already friends.");
    throw httpError(409, 'A friend request is already pending.');
  }

  try {
    await FriendRequest.create({ requester: requesterId, recipient: recipient._id });
  } catch (err) {
    // Lost a race against a concurrent identical insert — treat as already pending.
    if (err.code === 11000) throw httpError(409, 'A friend request is already pending.');
    throw err;
  }

  const requester = await User.findById(requesterId, 'firstName username');
  notifyFriendRequest(recipient, requester);
  return { status: RELATIONSHIP.OUTGOING };
}

// Pending requests awaiting this user's decision, shaped for the bell dropdown.
// Only usernames/names cross the boundary — never the requester's _id/email.
async function listIncomingRequests(userId) {
  const reqs = await FriendRequest.find({ recipient: userId, status: EDGE.PENDING })
    .sort({ createdAt: -1 })
    .populate('requester', PUBLIC_USER_FIELDS);
  return reqs
    .filter((r) => r.requester) // guard against a requester deleted since
    .map((r) => ({ id: r._id.toString(), ...toPublicUser(r.requester), at: r.createdAt }));
}

// An activity source (consumed by activityService): "@x accepted your friend
// request", derived from accepted requests the user *sent*. Emits typed items
// so the aggregator can merge it with other sources (e.g. badge unlocks).
async function friendAcceptedActivity(userId) {
  const accepted = await FriendRequest.find({ requester: userId, status: EDGE.ACCEPTED })
    .sort({ acceptedAt: -1 })
    .limit(30)
    .populate('recipient', PUBLIC_USER_FIELDS);
  return accepted
    .filter((r) => r.recipient) // guard against a recipient deleted since
    .map((r) => ({ type: 'friend_accepted', ...toPublicUser(r.recipient), at: r.acceptedAt || r.updatedAt }));
}

// Accept or reject a pending request. Only the recipient may respond. Accept
// flips the doc to `accepted` and emails the original requester; reject deletes
// the doc (which resets the sender's button and lets them re-request later).
async function respondToRequest(userId, requestId, action) {
  if (action !== RESPONSE.ACCEPT && action !== RESPONSE.REJECT)
    throw httpError(400, 'Invalid action.');

  const request = await FriendRequest.findById(requestId).populate('requester', 'email firstName username');
  if (!request || request.status !== EDGE.PENDING) throw httpError(404, 'Friend request not found.');
  if (request.recipient.toString() !== userId) throw httpError(403, 'Forbidden');

  if (action === RESPONSE.REJECT) {
    await request.deleteOne();
    return { status: RELATIONSHIP.NONE };
  }

  request.status = EDGE.ACCEPTED;
  request.acceptedAt = new Date();
  await request.save();

  // Notify the requester that they're now friends.
  const accepter = await User.findById(userId, 'firstName username');
  notifyFriendAccepted(request.requester, accepter);
  return { status: RELATIONSHIP.FRIENDS };
}

// Removes an accepted friendship between the caller and `friendUsername` (either
// direction — the single edge is deleted, so the removal is mutual). No-op-safe:
// throws 404 if they aren't actually friends.
async function removeFriend(userId, friendUsername) {
  const other = await findUserByUsername(friendUsername, '_id');
  const edge = await edgeBetween(userId, other._id);
  if (!isAccepted(edge)) throw httpError(404, "You aren't friends with this user.");
  await edge.deleteOne();
  return { status: RELATIONSHIP.NONE };
}

// Lists a user's friends (accepted edges), for the friend-count click-through.
// Visibility: only the owner themselves, an admin, or one of the owner's
// friends may see the list — anyone else gets a 403 (so a stranger can't
// harvest the graph).
async function listFriends(viewerId, ownerUsername, { isAdmin = false } = {}) {
  const owner = await findUserByUsername(ownerUsername, '_id');
  const ownerId = owner._id;

  await assertCanViewOwnerData(viewerId, ownerId, { isAdmin, message: 'Only friends can view this list.' });

  const edges = await FriendRequest.find(acceptedFriendshipsOf(ownerId))
    .populate('requester', PUBLIC_USER_FIELDS)
    .populate('recipient', PUBLIC_USER_FIELDS);

  return edges
    .map((e) => (e.requester?._id?.toString() === ownerId.toString() ? e.recipient : e.requester))
    .filter(Boolean)
    .map(toPublicUser)
    .sort((a, b) => a.username.localeCompare(b.username));
}

// Count of accepted friendships a user is part of (either side of the edge)
// whose counterpart account still exists. A plain countDocuments would also
// count an edge whose other side was deleted outside the app (e.g. directly
// in the database, which doesn't cascade-delete FriendRequest docs) — every
// other friend-facing query already guards against this (listIncomingRequests
// filters on `.requester`, friendAcceptedActivity on `.recipient`, listFriends
// with `.filter(Boolean)`); this was the one spot that didn't, so the count
// and the list could disagree.
async function getFriendCount(userId) {
  const edges = await FriendRequest.find(acceptedFriendshipsOf(userId), 'requester recipient')
    .populate('requester', '_id')
    .populate('recipient', '_id');
  return edges.filter((e) => e.requester && e.recipient).length;
}

// The viewer's relationship to a profile owner, for the profile's friend button:
//   'self' | 'none' | 'outgoing' | 'incoming' | 'friends'
// When 'incoming', also returns the pending request id so the profile's inline
// Accept can act on it directly. Internal — profiles consume friendSummaryFor.
async function getRelationship(viewerId, ownerId) {
  const owner = ownerId.toString();
  if (viewerId === owner) return { status: RELATIONSHIP.SELF };

  const edge = await edgeBetween(viewerId, ownerId);
  if (!edge) return { status: RELATIONSHIP.NONE };
  if (isAccepted(edge)) return { status: RELATIONSHIP.FRIENDS };
  // Pending: outgoing if the viewer sent it, incoming if they received it.
  if (edge.requester.toString() === viewerId) return { status: RELATIONSHIP.OUTGOING };
  return { status: RELATIONSHIP.INCOMING, requestId: edge._id.toString() };
}

// The friend fields a profile view is decorated with: the public friend count,
// plus (for a signed-in non-owner viewer) their relationship to the owner.
// Owning the shape here means profileService doesn't need to know what "friend
// data on a profile" is — it just spreads the result. The two independent queries
// run in parallel.
async function friendSummaryFor(ownerId, { viewerId = null, isOwner = false } = {}) {
  const wantsRelationship = !!viewerId && !isOwner;
  const [friendCount, viewerRelationship] = await Promise.all([
    getFriendCount(ownerId),
    wantsRelationship ? getRelationship(viewerId, ownerId) : Promise.resolve(null),
  ]);
  return viewerRelationship ? { friendCount, viewerRelationship } : { friendCount };
}

module.exports = {
  sendFriendRequest, listIncomingRequests, friendAcceptedActivity, respondToRequest,
  removeFriend, listFriends, friendSummaryFor, areFriends, assertCanViewOwnerData,
};
