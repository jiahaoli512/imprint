const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const requireUserOrAdmin = require('../middleware/userOrAdmin');
const { friendRequestLimiter } = require('../middleware/rateLimit');
const { sendFriendRequest, listIncomingRequests, respondToRequest, removeFriend, listFriends } = require('../services/friendService');
const { viewerContext } = require('../utils/viewer');

// Friend requests are a user-only feature (they need a user identity), so those
// routes are requireAuth — admin tokens have no user id. The friend count and
// the viewer↔owner relationship ride along on the existing profile GET, so
// there's no read endpoint here beyond the incoming-request list for the bell.
// The one exception is /of/:username: an admin viewing a profile needs to see
// its friend list too (matching how markers/profile reads already accept
// either token via requireUserOrAdmin), so that route alone is dual-auth.

router.post('/request', requireAuth, friendRequestLimiter, handle(async (req, res) => {
  res.json(await sendFriendRequest(req.user.id, req.body.username));
}));

router.get('/requests', requireAuth, handle(async (req, res) => {
  res.json(await listIncomingRequests(req.user.id));
}));

router.post('/requests/:id/respond', requireAuth, handle(async (req, res) => {
  res.json(await respondToRequest(req.user.id, req.params.id, req.body.action));
}));

// A user's friend list (owner, an admin, or one of their friends) for the
// friend-count click-through. Static-prefixed to keep it clear of the DELETE
// /:username route.
router.get('/of/:username', requireUserOrAdmin, handle(async (req, res) => {
  const { viewerId, isAdmin } = viewerContext(req);
  res.json(await listFriends(viewerId, req.params.username, { isAdmin }));
}));

router.delete('/:username', requireAuth, handle(async (req, res) => {
  res.json(await removeFriend(req.user.id, req.params.username));
}));

module.exports = router;
