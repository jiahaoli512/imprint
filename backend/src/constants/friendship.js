// The friendship vocabulary shared across the friend feature, so the status
// strings that cross the API boundary are defined once instead of typed as magic
// strings in each service. (The frontend keeps a mirror in
// src/features/users/friendship.js — packages can't share a module.)

// A viewer's relationship to a profile owner, returned by getRelationship and
// consumed by the client's friend button.
const RELATIONSHIP = {
  SELF: 'self',
  NONE: 'none',
  OUTGOING: 'outgoing',
  INCOMING: 'incoming',
  FRIENDS: 'friends',
};

// A recipient's response to a pending request (respondToRequest).
const RESPONSE = { ACCEPT: 'accept', REJECT: 'reject' };

// FriendRequest edge lifecycle — matches the model's status enum.
const EDGE = { PENDING: 'pending', ACCEPTED: 'accepted' };

module.exports = { RELATIONSHIP, RESPONSE, EDGE };
