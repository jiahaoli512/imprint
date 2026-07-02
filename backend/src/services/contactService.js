const httpError = require('../utils/httpError');
const { checkLength, checkEmail } = require('../utils/validate');
const { sendContactEmail } = require('../utils/email');

// Allowed contact-form categories — the source of truth the frontend <select>
// mirrors (kept byte-for-byte identical). Submissions are validated against this
// allowlist so the email can't carry an arbitrary category string.
const CONTACT_CATEGORIES = [
  'General Inquiry',
  'Account & Login',
  'Bug / Technical Issue',
  'Feature Request',
  'Feedback / Suggestion',
  'Privacy / Data Request',
  'Other',
];

// Validates a contact-form submission and forwards it to the Imprint inbox.
// Validation errors throw httpError so the central handler formats the response.
async function submitContact({ firstName, lastName, email, feedback, category } = {}) {
  firstName = (firstName || '').trim();
  lastName = (lastName || '').trim();
  email = (email || '').trim();
  feedback = (feedback || '').trim();
  category = (category || '').trim();

  if (!firstName || !lastName) throw httpError(400, 'First and last name are required.');
  if (!CONTACT_CATEGORIES.includes(category)) throw httpError(400, 'Please select a valid category.');
  if (!feedback) throw httpError(400, 'Feedback is required.');
  checkEmail(email);
  checkLength('firstName', firstName);
  checkLength('lastName', lastName);
  checkLength('email', email);
  checkLength('feedback', feedback);

  await sendContactEmail({ firstName, lastName, email, feedback, category });
}

module.exports = { submitContact, CONTACT_CATEGORIES };
