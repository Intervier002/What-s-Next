const xss = require('xss');

// Strip HTML tags and dangerous characters from any string
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return xss(str.trim())          // remove XSS attack vectors
    .replace(/<[^>]*>/g, '')      // strip any remaining HTML tags
    .replace(/[<>"'`]/g, '')      // remove remaining dangerous chars
    .slice(0, 200);               // hard cap at 200 chars
}

// Sanitize req.body before it hits any route
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
          .filter(Boolean); // remove empty strings after sanitization
      }
    }
  }
  next();
}

module.exports = { sanitizeInput, sanitizeString };
