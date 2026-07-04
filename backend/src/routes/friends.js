const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const { friendRequestLimiter } = require('../middleware/rateLimit');
const { sendFriendRequest, listIncomingRequests, respondToRequest, removeFriend, listFriends } = require('../services/friendService');

// Friend requests are a user-only feature (they need a user identity), so every
// route is requireAuth — admin tokens have no user id. The friend count and the
// viewer↔owner relationship ride along on the existing profile GET, so there's
// no read endpoint here beyond the incoming-request list for the bell.

router.post('/request', requireAuth, friendRequestLimiter, handle(async (req, res) => {
  res.json(await sendFriendRequest(req.user.id, req.body.username));
}));

router.get('/requests', requireAuth, handle(async (req, res) => {
  res.json(await listIncomingRequests(req.user.id));
}));

router.post('/requests/:id/respond', requireAuth, handle(async (req, res) => {
  res.json(await respondToRequest(req.user.id, req.params.id, req.body.action));
}));

// A user's friend list (owner or one of their friends only) for the friend-count
// click-through. Static-prefixed to keep it clear of the DELETE /:username route.
router.get('/of/:username', requireAuth, handle(async (req, res) => {
  res.json(await listFriends(req.user.id, req.params.username));
}));

router.delete('/:username', requireAuth, handle(async (req, res) => {
  res.json(await removeFriend(req.user.id, req.params.username));
}));

module.exports = router;
