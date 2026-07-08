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

module.exports = { COOLDOWN_DAYS, daysUntil };
