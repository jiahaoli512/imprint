const httpError = require('../utils/httpError');
const { checkLength, checkEmail } = require('../utils/validate');
const { sendContactEmail } = require('../utils/email');

// Validates a contact-form submission and forwards it to the Imprint inbox.
// Validation errors throw httpError so the central handler formats the response.
async function submitContact({ firstName, lastName, email, feedback } = {}) {
  firstName = (firstName || '').trim();
  lastName = (lastName || '').trim();
  email = (email || '').trim();
  feedback = (feedback || '').trim();

  if (!firstName || !lastName) throw httpError(400, 'First and last name are required.');
  if (!feedback) throw httpError(400, 'Feedback is required.');
  checkEmail(email);
  checkLength('firstName', firstName);
  checkLength('lastName', lastName);
  checkLength('email', email);
  checkLength('feedback', feedback);

  await sendContactEmail({ firstName, lastName, email, feedback });
}

module.exports = { submitContact };
