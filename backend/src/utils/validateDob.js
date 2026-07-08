const httpError = require('./httpError');

// Date-of-birth / age-gate validation for signup. Split out of validate.js as
// its own domain (distinct from string/identity checks).
const MIN_AGE = 18;

// Whole years between `dob` and today.
function ageFromDob(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// True if `s` (a "YYYY-MM-DD" string) is a real calendar date — i.e. the day/
// month didn't silently roll over. `new Date("2006-02-30")` yields Mar 2, so a
// plausible-looking impossible date would otherwise pass. Rejects 2/30, 6/31, …
function isRealCalendarDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

// Throws a 400 unless `dateOfBirth` is a real calendar date (no month/day
// rollover) with a 4-digit year and an age of at least MIN_AGE. Keeps the signup
// age gate next to the other validators rather than inline in the service.
function validateDateOfBirth(dateOfBirth) {
  if (!isRealCalendarDate(dateOfBirth))
    throw httpError(400, 'Please enter a valid date of birth.');
  const year = +String(dateOfBirth).slice(0, 4);
  if (year < 1000 || year > 9999)
    throw httpError(400, 'Please enter a valid 4-digit birth year.');
  if (ageFromDob(dateOfBirth) < MIN_AGE)
    throw httpError(400, `You must be at least ${MIN_AGE} years old.`);
}

module.exports = { validateDateOfBirth, ageFromDob, isRealCalendarDate, MIN_AGE };
