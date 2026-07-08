const rateLimit = require('express-rate-limit');

// Every limiter below shares the same header policy (standardHeaders on,
// legacyHeaders off) and JSON error shape — only the window/cap/message and
// (for a couple) skipSuccessfulRequests actually vary per endpoint. Baking the
// shared defaults into one factory means that policy can't silently drift
// across limiters.
function createLimiter({ windowMs, max, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: { error: message },
  });
}

// Generous default for general API traffic
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: 'Too many requests, please try again later.',
});

// Strict limiter for auth-sensitive endpoints (login, register, admin login)
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  message: 'Too many attempts, please try again later.',
});

// Strict limiter for the public contact form. Unlike authLimiter, this counts
// *successful* requests too — a successful submission is the abusable action
// here (it sends an email / consumes Brevo quota), so it must be capped. A real
// visitor never exceeds a handful per hour.
const contactLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many messages sent. Please try again later.',
});

// Limiter for the signup verification-code request endpoint. Like contactLimiter
// it counts *successful* requests too, because a success sends an email — the
// abusable action. Per-email cooldown/cap in verificationService is the finer
// guard; this caps total sends from one IP across emails. Generous enough for a
// real signup (a couple of resends) but not for inbox flooding.
const codeRequestLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  message: 'Too many verification codes requested. Please try again later.',
});

// Limiter for sending friend requests. Counts *successful* requests too, because
// each accepted send emails the recipient — the abusable action (spamming other
// users' inboxes / Brevo quota). The one-pending-request-per-pair unique index
// already prevents re-spamming a single person; this caps fan-out to many
// recipients from one IP. Generous for real use (adding a batch of friends).
const friendRequestLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: 'Too many friend requests. Please try again later.',
});

module.exports = { apiLimiter, authLimiter, contactLimiter, codeRequestLimiter, friendRequestLimiter };
