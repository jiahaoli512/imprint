const httpError = require('./httpError');

// Self-service profile-edit cooldown windows, in days. Split out of validate.js:
// this is rate-limiting/date math, not "is this input well-formed" validation —
// a genuinely different concern that happened to accumulate in the same file.
// Mirrors frontend/src/utils/cooldowns.js (the client-side copy that drives UI
// hints/eligibility only; this is the enforced source of truth).
const COOLDOWN_DAYS = { username: 30, name: 7 };

// Whole days remaining before `lastChangedAt` clears a `days`-long cooldown
// (0 when eligible, or when there's no prior change). Used to gate self-service
// edits and to build the "try again in N day(s)" message.
function daysUntil(lastChangedAt, days) {
  if (!lastChangedAt) return 0;
  const elapsedMs = Date.now() - new Date(lastChangedAt).getTime();
  const remainingMs = days * 24 * 60 * 60 * 1000 - elapsedMs;
  return remainingMs <= 0 ? 0 : Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}

// Throws a 429 with the standard "try again in N day(s)" message if
// `lastChangedAt` hasn't cleared its `days`-long cooldown yet. `label` names
// the field in the message (e.g. "name", "username"). A no-op when eligible.
function assertCooldownElapsed(lastChangedAt, days, label) {
  const wait = daysUntil(lastChangedAt, days);
  if (wait > 0) throw httpError(429, `You can change your ${label} again in ${wait} day${wait === 1 ? '' : 's'}.`);
}

module.exports = { COOLDOWN_DAYS, daysUntil, assertCooldownElapsed };
