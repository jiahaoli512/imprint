const router = require('express').Router();
const handle = require('../middleware/handle');
const { authLimiter } = require('../middleware/rateLimit');
const { sendContactEmail } = require('../utils/email');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public contact form → emails the Imprint inbox. Rate-limited with the strict
// limiter to deter abuse of an unauthenticated, email-sending endpoint.
router.post('/', authLimiter, handle(async (req, res) => {
  const firstName = (req.body.firstName || '').trim();
  const lastName = (req.body.lastName || '').trim();
  const email = (req.body.email || '').trim();
  const feedback = (req.body.feedback || '').trim();

  if (!firstName || !lastName) return res.status(400).json({ error: 'First and last name are required' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'A valid email is required' });
  if (!feedback) return res.status(400).json({ error: 'Feedback is required' });
  if (firstName.length > 100 || lastName.length > 100 || email.length > 254 || feedback.length > 5000) {
    return res.status(400).json({ error: 'One or more fields are too long' });
  }

  await sendContactEmail({ firstName, lastName, email, feedback });
  res.status(202).json({ message: 'Thanks — your message has been sent!' });
}));

module.exports = router;
