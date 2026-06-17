// Formats a date as e.g. "Jun 17, 2026" (or "June 17, 2026" when long).
export function formatDate(date, { long = false } = {}) {
  return new Date(date).toLocaleDateString('en-US', {
    month: long ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
