// Name/username format rules shared across the profile setup and edit forms.
// Mirrors the server-side rules in backend/src/utils/validate.js — keep in sync.
export const NAME_RE = /^[\p{L}'’-]+$/u;          // first name: letters, hyphens, apostrophes
export const NAME_SPACES_RE = /^[\p{L}'’ -]+$/u;  // last name: also allows spaces
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// True if the (trimmed) value looks like a valid email address.
export function isValidEmail(email) {
  return EMAIL_RE.test((email || '').trim());
}

// Canonical email form for lookups/submission (mirrors normalizeEmail on the
// backend). Kept in one place so the auth flows don't each inline trim/lowercase.
export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

// Validates first/last name format. The caller is responsible for the "first
// name required" check (its wording differs per form); this covers the shared
// length/character rules. Returns an error message, or '' if valid.
export function validateName(firstName, lastName) {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  if (first.length > 50) return 'First name must be 50 characters or fewer.';
  if (/\s/.test(first)) return 'First name cannot contain spaces.';
  if (!NAME_RE.test(first)) return 'First name can only contain letters, hyphens, and apostrophes.';
  if (last.length > 50) return 'Last name must be 50 characters or fewer.';
  if (last && !NAME_SPACES_RE.test(last)) return 'Last name can only contain letters, spaces, hyphens, and apostrophes.';
  return '';
}
