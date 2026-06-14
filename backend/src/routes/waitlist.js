const router = require('express').Router();
const Waitlist = require('../models/Waitlist');
const { sendApprovalEmail } = require('../utils/email');

async function normalizePositions() {
  const all = await Waitlist.find({}).sort({ position: 1, createdAt: 1 });
  await Promise.all(all.map((e, i) => Waitlist.updateOne({ _id: e._id }, { position: i })));
}

// POST /api/waitlist
router.post('/', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const existing = await Waitlist.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'User already on the waitlist!' });

    const count = await Waitlist.countDocuments();
    await Waitlist.create({ email, name: name || null, position: count });
    res.status(201).json({ message: "You're on the list!", position: count + 1 });
  } catch (err) {
    next(err);
  }
});

// GET /api/waitlist
router.get('/', async (req, res, next) => {
  try {
    const entries = await Waitlist.find({}, 'email name createdAt position approved').sort({ position: 1, createdAt: 1 });
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

// GET /api/waitlist/count
router.get('/count', async (req, res, next) => {
  try {
    const count = await Waitlist.countDocuments();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/waitlist/reorder
router.patch('/reorder', async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
    await Promise.all(ids.map((id, i) => Waitlist.updateOne({ _id: id }, { position: i })));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/waitlist/:id/approve
router.patch('/:id/approve', async (req, res, next) => {
  try {
    const entry = await Waitlist.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    await sendApprovalEmail(entry.email, entry.name);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/waitlist/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Waitlist.findByIdAndDelete(req.params.id);
    await normalizePositions();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
