// Derives the viewer context that ownership/visibility-gated services expect from
// a request: who is viewing (a user id, or null if anonymous/admin) and whether
// they're acting as an admin. One place owns this shape so routes don't repeat the
// `req.user?.id` / `!!req.admin` extraction (auth middleware sets req.user/req.admin).
function viewerContext(req) {
  return { viewerId: req.user?.id ?? null, isAdmin: !!req.admin };
}

module.exports = { viewerContext };
