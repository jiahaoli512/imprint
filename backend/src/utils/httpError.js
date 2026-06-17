// Creates an Error tagged with an HTTP status, so route error handlers can
// surface it with the right code: `throw httpError(404, 'Not found')`.
module.exports = function httpError(status, message) {
  return Object.assign(new Error(message), { status });
};
