// Formats a date as e.g. "Jun 17, 2026" (or "June 17, 2026" when long).
//
// Pass `utc: true` for date-only values like a date of birth: those are stored
// as UTC midnight (e.g. 2006-05-12T00:00:00Z), so formatting them in the
// viewer's local timezone shifts the calendar day backward for anyone west of
// UTC. Forcing UTC shows the exact day that was entered, everywhere. Real
// timestamps (createdAt, etc.) should stay in local time, so leave `utc` off.
export function formatDate(date, { long = false, utc = false } = {}) {
  return new Date(date).toLocaleDateString('en-US', {
    month: long ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
    ...(utc ? { timeZone: 'UTC' } : {}),
  });
}
