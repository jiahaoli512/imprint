// Joins a user's first/last name, skipping blanks. Returns `fallback` (default
// '') when neither is set.
export function fullName(user, fallback = '') {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || fallback;
}
