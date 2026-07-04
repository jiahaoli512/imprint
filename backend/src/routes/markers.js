const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const requireAdminAuth = require('../middleware/adminAuth');
const requireUserOrAdmin = require('../middleware/userOrAdmin');
const { getAdminMarkers, getUserMarkers, saveUserMarkers, saveUserMarkersByUsername } = require('../services/markerService');

// Admin singleton (used by AdminDashboard)
router.get('/', requireAdminAuth, handle(async (req, res) => {
  res.json(await getAdminMarkers());
}));

// Admin: save the singleton demo map (keyed by the 'singleton' id)
router.put('/singleton', requireAdminAuth, handle(async (req, res) => {
  res.json(await saveUserMarkers('singleton', req.body.points));
}));

// Per-user markers. Readable only by the owner, an admin, or one of the owner's
// friends (enforced in the service) — markers are auto-built from background
// location history, so they're not exposed to arbitrary signed-in users.
router.get('/user/:username', requireUserOrAdmin, handle(async (req, res) => {
  res.json(await getUserMarkers(req.params.username, { viewerId: req.user?.id, isAdmin: !!req.admin }));
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
