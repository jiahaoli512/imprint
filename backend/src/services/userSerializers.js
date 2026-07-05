const { fullName } = require('../utils/names');
const { signToken } = require('../utils/token');

// One place owning "what shape does a User take when it crosses to the client",
// shared by the profile and friend services so the rules don't drift apart.

// Public "card" shape for a user in lists (search results, friends, requests):
// username + display name only — never _id/email.
const toPublicUser = (user) => ({ username: user.username, name: fullName(user) });

// Profile view for a given viewer. The raw Mongoose doc never crosses this
// boundary: _id (and anything else) is dropped, and the owner-only fields — date
// of birth and the cooldown stamps the edit screen needs — are included only for
// the owner or an admin. Keeping the visibility policy here means callers just get
// "the profile this viewer may see," with no field-level rules in the HTTP layer.
function toProfileView(user, { isOwner = false, isAdmin = false } = {}) {
  const view = {
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
  };
  if (isOwner || isAdmin) {
    view.dateOfBirth = user.dateOfBirth;
    view.usernameChangedAt = user.usernameChangedAt;
    view.nameChangedAt = user.nameChangedAt;
  }
  return view;
}

// The successful-auth wire shape: a freshly-signed token plus the account's
// username (null until profile setup). Shared by login and the two reset paths
// so the "what a login returns" contract lives in one place.
const toAuthResult = (user) => ({ token: signToken(user), username: user.username || null });

module.exports = { toPublicUser, toProfileView, toAuthResult };
