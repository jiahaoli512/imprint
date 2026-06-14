const router = require('express').Router();
const requireAuth = require('../middleware/auth');

// In-memory store — swap for a real DB (PostGIS) later
const locationsByUser = {};

// GET /api/locations — fetch the current user's visited locations
router.get('/', requireAuth, (req, res) => {
  const locations = locationsByUser[req.user.id] || [];
  res.json({ locations, total: locations.length });
});

// POST /api/locations — log a new visited location
router.post('/', requireAuth, (req, res) => {
  const { lat, lng, name, country, region } = req.body;
  if (lat == null || lng == null) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }
  if (!locationsByUser[req.user.id]) locationsByUser[req.user.id] = [];
  const entry = {
    id: Date.now().toString(),
    lat,
    lng,
    name: name || null,
    country: country || null,
    region: region || null,
    visitedAt: new Date(),
  };
  locationsByUser[req.user.id].push(entry);
  res.status(201).json(entry);
});

// GET /api/locations/coverage — return world coverage stats for the user
router.get('/coverage', requireAuth, (req, res) => {
  const locations = locationsByUser[req.user.id] || [];
  const countries = [...new Set(locations.map((l) => l.country).filter(Boolean))];
  const regions  = [...new Set(locations.map((l) => l.region).filter(Boolean))];

  res.json({
    totalLocations: locations.length,
    countriesVisited: countries.length,
    regionsVisited: regions.length,
    // TODO: compute real area coverage % once PostGIS is wired up
    coveragePercent: null,
  });
});

// DELETE /api/locations/:id — remove a logged location
router.delete('/:id', requireAuth, (req, res) => {
  const list = locationsByUser[req.user.id] || [];
  const idx = list.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Location not found' });
  list.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

module.exports = router;
