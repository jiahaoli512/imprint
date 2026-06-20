const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const requireAdminAuth = require('../middleware/adminAuth');
const { getAdminMarkers, getUserMarkers, saveUserMarkers, saveUserMarkersByUsername } = require('../services/markerService');

// Admin singleton (used by AdminDashboard)
router.get('/', handle(async (req, res) => {
  res.json(await getAdminMarkers());
}));

// Per-user markers (public read)
router.get('/user/:username', handle(async (req, res) => {
  res.json(await getUserMarkers(req.params.username));
}));

// Save own markers (requires auth)
router.put('/', requireAuth, handle(async (req, res) => {
  res.json(await saveUserMarkers(req.user.id, req.body.points));
}));

// Admin: save markers to a specific user's map
router.put('/user/:username', requireAdminAuth, handle(async (req, res) => {
  res.json(await saveUserMarkersByUsername(req.params.username, req.body.points));
}));

module.exports = router;
