const rateLimit = require('express-rate-limit');

// Generous default for general API traffic
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict limiter for auth-sensitive endpoints (login, register, admin login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  message: { error: 'Too many attempts, please try again later.' },
});

// Strict limiter for the public contact form. Unlike authLimiter, this counts
// *successful* requests too — a successful submission is the abusable action
// here (it sends an email / consumes Brevo quota), so it must be capped. A real
// visitor never exceeds a handful per hour.
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent. Please try again later.' },
});

module.exports = { apiLimiter, authLimiter, contactLimiter };
