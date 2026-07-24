const router = require('express').Router();
const handle = require('../middleware/handle');
const requireAdminAuth = require('../middleware/adminAuth');
const { waitlistJoinLimiter } = require('../middleware/rateLimit');
const { joinWaitlist, listWaitlist, countWaitlist, checkWaitlist, reorderWaitlist, approveEntry, deleteEntry } = require('../services/waitlistService');

// Public routes. Join is rate-limited (failed attempts only) to slow bulk
// email probing of this unauthenticated endpoint — its own bucket, not
// shared with login/register/verify-code endpoints, per rateLimit.js's
// authLimiter comment.
router.post('/',      waitlistJoinLimiter, handle(async (req, res) => {
  const result = await joinWaitlist(req.body.email, req.body.name);
  res.status(201).json({ message: "You're on the list!", ...result });
}));
router.get('/count',  handle(async (req, res) => { res.json({ count: await countWaitlist() }); }));
router.get('/check',  handle(async (req, res) => {
  res.json(await checkWaitlist(req.query.email));
}));

// Admin-only routes
router.get('/',                requireAdminAuth, handle(async (req, res) => { res.json(await listWaitlist()); }));
router.patch('/reorder',       requireAdminAuth, handle(async (req, res) => { await reorderWaitlist(req.body.ids); res.json({ ok: true }); }));
router.patch('/:id/approve',   requireAdminAuth, handle(async (req, res) => { await approveEntry(req.params.id); res.json({ ok: true }); }));
router.delete('/:id',          requireAdminAuth, handle(async (req, res) => { await deleteEntry(req.params.id); res.json({ ok: true }); }));

module.exports = router;
