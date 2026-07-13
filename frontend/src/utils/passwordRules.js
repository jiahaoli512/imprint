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

// Each rule annotated with whether the given password passes it — the shape the
// PasswordChecklist renders. Keeps the "rules + pass state" derivation in one place.
export const evaluatePassword = (p) => PW_RULES.map((r) => ({ ...r, passed: r.test(p) }));

// True when a new-password + confirm pair are both a valid password AND equal
// — the "ready to submit" gate shared by every "set a new password" form
// (signup, forgot-password, change-password). Requires `p` to already be
// valid so a confirm field that happens to equal an invalid `p` doesn't
// read as a match.
export const passwordsMatch = (p, confirm) => passwordValid(p) && confirm.length > 0 && confirm === p;
