const router = require('express').Router();
const handle = require('../middleware/handle');
const { contactLimiter } = require('../middleware/rateLimit');
const { submitContact } = require('../services/contactService');

// Public contact form → emails the Imprint inbox. Rate-limited (5/hour/IP,
// counting successes) to deter abuse of an unauthenticated, email-sending
// endpoint. Validation/business logic lives in contactService.
router.post('/', contactLimiter, handle(async (req, res) => {
  await submitContact(req.body);
  res.status(202).json({ message: 'Thanks — your message has been sent!' });
}));

module.exports = router;
