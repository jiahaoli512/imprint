const { firstName } = require('../utils/names');
const { sendFriendRequestEmail, sendFriendAcceptedEmail } = require('../utils/email');

// The "how do we notify someone about a friend event" concern, kept out of
// friendService so friendship-state logic doesn't depend on the delivery
// mechanism (email today; in-app activity / push could plug in here later).
// Fire-and-forget: a mail hiccup must never fail the friend action that
// triggered it, so failures are logged, not thrown.
function inBackground(label, promise) {
  promise.catch((err) => console.error(`[notify] ${label} failed:`, err.message));
}

// Tell `recipient` that `requester` wants to add them as a friend.
function notifyFriendRequest(recipient, requester) {
  if (!recipient?.email) return;
  inBackground('friend-request email', sendFriendRequestEmail(recipient.email, firstName(requester) || 'Someone'));
}

// Tell the original `requester` that `accepter` accepted their request.
function notifyFriendAccepted(requester, accepter) {
  if (!requester?.email) return;
  inBackground(
    'friend-accepted email',
    sendFriendAcceptedEmail(requester.email, firstName(requester) || 'there', firstName(accepter) || 'someone'),
  );
}

module.exports = { notifyFriendRequest, notifyFriendAccepted };
