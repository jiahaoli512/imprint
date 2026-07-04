const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const { getActivity } = require('../services/activityService');

// The signed-in user's activity feed (friend accepts today; extensible to badge
// unlocks etc. via activityService's source registry). User-only.
router.get('/', requireAuth, handle(async (req, res) => {
  res.json(await getActivity(req.user.id));
}));

module.exports = router;
