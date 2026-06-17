// Defense against NoSQL operator injection: recursively remove any object
// keys that start with '$' (Mongo operators) or contain '.' (dotted paths)
// from the request body. Express 5's default query parser does not parse
// bracket notation into nested objects, and route params are always strings,
// so the JSON body is the realistic injection surface.
function scrub(value) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach(scrub);
    return;
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
    } else {
      scrub(value[key]);
    }
  }
}

module.exports = function sanitizeBody(req, res, next) {
  scrub(req.body);
  next();
};
