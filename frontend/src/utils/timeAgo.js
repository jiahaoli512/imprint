import { formatDate } from './formatDate';

// Compact relative timestamp for notifications: "just now", "5m", "3h", "2d",
// "4w". Beyond ~a month it falls back to an absolute date so old items stay
// meaningful. Input is anything Date-parseable (ISO string, Date, ms).
export function timeAgo(input) {
  if (!input) return '';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (secs < 45) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks}w`;
  return formatDate(input);
}
