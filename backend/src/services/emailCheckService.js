const { checkEmail, normalizeEmail } = require('../utils/validate');
const { isDeliverable } = require('../utils/verifalia');
const httpError = require('../utils/httpError');

// The one place "is this email worth trying to send to" is decided. The cheap
// sync checkEmail (regex format check) always runs first and rejects for free,
// before ever spending a Verifalia credit — conserves the free-tier daily
// quota, since only a syntactically-plausible address reaches Verifalia at
// all. Shared by joinWaitlist and the check-email endpoint (forgot-password's
// email step) so this policy can't drift between the two call sites.
async function assertDeliverable(email) {
  checkEmail(email);
  if (!(await isDeliverable(normalizeEmail(email))))
    throw httpError(400, "This email address doesn't look reachable. Please double-check it.");
}

module.exports = { assertDeliverable };
