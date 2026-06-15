const router = require('express').Router();
const MapMarkers = require('../models/MapMarkers');

router.get('/', async (req, res, next) => {
  try {
    const doc = await MapMarkers.findById('singleton');
    res.json(doc ? doc.points : []);
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const { points } = req.body;
    if (!Array.isArray(points)) return res.status(400).json({ error: 'points must be an array' });
    const doc = await MapMarkers.findByIdAndUpdate(
      'singleton',
      { points },
      { upsert: true, new: true }
    );
    res.json(doc.points);
  } catch (err) { next(err); }
});

module.exports = router;
