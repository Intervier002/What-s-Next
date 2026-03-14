const xss = require('xss');

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return xss(str.trim())
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .slice(0, 200);
}

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
      if (Array.isArray(req.body[key])) {
        req.body[key] = req.body[key]
          .filter(item => typeof item === 'string')
          .map(sanitizeString)
          .filter(Boolean);
      }
    }
  }
  next();
}

module.exports = { sanitizeInput, sanitizeString };
