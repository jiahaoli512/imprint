// Display-name helpers shared by the services and email templates so the
// first/last → display-name rules live in exactly one place (the frontend has
// its own copy under src/utils/fullName.js — packages can't share a module).

// A user's full display name from first/last (empty string when neither is set).
function fullName(user) {
  return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
}

// A user's first name for greetings, falling back to their username so we never
// address them as "" — callers still add a final generic fallback ("there").
function firstName(user) {
  return (user?.firstName || '').trim() || user?.username || '';
}

module.exports = { fullName, firstName };
