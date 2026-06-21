const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const { logLocations } = require('../services/locationService');

// Private — a user uploads only their own points. (No read endpoint: the map is
// rendered from MapMarkers, not raw Location history.)
router.post('/', requireAuth, handle(async (req, res) => {
  const result = await logLocations(req.user.id, req.body.points);
  res.status(201).json(result);
}));

module.exports = router;
