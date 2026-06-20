// Case-insensitive substring match used by the admin tables' search boxes. An
// empty query matches everything; otherwise any field containing it matches.
export function matchesQuery(query, ...fields) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f || '').toLowerCase().includes(q));
}
