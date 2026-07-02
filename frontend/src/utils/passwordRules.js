// Password policy shared by the signup and forgot-password flows so both enforce
// identical requirements from one source. Mirrors the server-side checkPassword
// in backend/src/utils/validate.js.
export const SPECIAL_RE = /[~`!@#$%^&*()\-_+=[\]{}|\\;:"<>,./?]/;

export const PW_RULES = [
  { key: 'length',  label: 'At least 12 characters',
    test: (p) => p.length >= 12 },
  { key: 'upper',   label: 'One uppercase letter (A–Z)',
    test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'One lowercase letter (a–z)',
    test: (p) => /[a-z]/.test(p) },
  { key: 'number',  label: 'One number (0–9)',
    test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'One special character, not at start or end',
    test: (p) => p.length >= 3 && SPECIAL_RE.test(p.slice(1, -1)) },
];

// True when a password satisfies every rule.
export const passwordValid = (p) => PW_RULES.every((r) => r.test(p));
