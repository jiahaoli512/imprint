const { friendAcceptedActivity } = require('./friendService');

const MAX_ITEMS = 30;

// Registered activity sources, each `(userId) => Promise<Array<{ type, at, ... }>>`.
// Adding a new kind of activity (e.g. badge unlocks) means adding a source here —
// the aggregator, route, and client don't change (open for extension). Sources are
// merged, sorted newest-first, and capped.
const SOURCES = [
  friendAcceptedActivity,
  // badgeEarnedActivity,  ← future: "you / a friend earned a badge"
];

async function getActivity(userId) {
  const lists = await Promise.all(SOURCES.map((source) => source(userId)));
  return lists
    .flat()
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, MAX_ITEMS);
}

module.exports = { getActivity };
