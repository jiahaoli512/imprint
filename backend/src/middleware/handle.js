module.exports = function handle(fn) {
  return async (req, res, next) => {
    try { await fn(req, res); }
    catch (err) { err.status ? res.status(err.status).json({ error: err.message }) : next(err); }
  };
};
