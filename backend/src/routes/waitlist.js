const router = require('express').Router();
const handle = require('../middleware/handle');
const { joinWaitlist, listWaitlist, countWaitlist, checkWaitlist, reorderWaitlist, approveEntry, deleteEntry } = require('../services/waitlistService');

router.post('/', handle(async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const result = await joinWaitlist(email, name);
  res.status(201).json({ message: "You're on the list!", ...result });
}));

router.get('/', handle(async (req, res) => {
  res.json(await listWaitlist());
}));

router.get('/count', handle(async (req, res) => {
  const count = await countWaitlist();
  res.json({ count });
}));

router.get('/check', handle(async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  res.json(await checkWaitlist(email));
}));

router.patch('/reorder', handle(async (req, res) => {
  await reorderWaitlist(req.body.ids);
  res.json({ ok: true });
}));

router.patch('/:id/approve', handle(async (req, res) => {
  await approveEntry(req.params.id);
  res.json({ ok: true });
}));

router.delete('/:id', handle(async (req, res) => {
  await deleteEntry(req.params.id);
  res.json({ ok: true });
}));

module.exports = router;
