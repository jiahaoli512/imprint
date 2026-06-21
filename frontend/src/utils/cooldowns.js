// Self-service profile-edit cooldowns, in days. The backend is the source of
// truth (COOLDOWN_DAYS in backend/src/utils/validate.js) and enforces these;
// these client copies only drive the UI hints/eligibility. Keep in sync.
export const COOLDOWN_DAYS = { username: 30, name: 7 };

// Whole days left before a `days`-long cooldown clears (0 when eligible / unset).
export function daysUntil(ts, days) {
  if (!ts) return 0;
  const remMs = days * 86400000 - (Date.now() - new Date(ts).getTime());
  return remMs <= 0 ? 0 : Math.ceil(remMs / 86400000);
}
