const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAuth = require('../middleware/auth');
const { logLocations, getUserLocations, getCoverage } = require('../services/locationService');

// All location routes are private — a user may only read/write their own points.

router.post('/', requireAuth, handle(async (req, res) => {
  const result = await logLocations(req.user.id, req.body.points);
  res.status(201).json(result);
}));

router.get('/coverage', requireAuth, handle(async (req, res) => {
  res.json(await getCoverage(req.user.id));
}));

router.get('/', requireAuth, handle(async (req, res) => {
  res.json(await getUserLocations(req.user.id));
}));

module.exports = router;
