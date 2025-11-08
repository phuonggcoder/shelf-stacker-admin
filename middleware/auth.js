const jwt = require('jsonwebtoken');

// Minimal authentication middleware for admin UI routes.
// Expects Authorization: Bearer <token>. If JWT_SECRET env var is set, verify token.
// Otherwise tries to parse token as JSON (development convenience).

module.exports = function(req, res, next) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth) { req.user = {}; return next(); }
  const parts = auth.split(' ');
  if (parts.length !== 2) { req.user = {}; return next(); }
  const token = parts[1];
  const secret = process.env.JWT_SECRET;
  if (secret) {
    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
    } catch (e) {
      return res.status(401).json({ msg: 'Invalid token' });
    }
    return next();
  }
  // Fallback: try to parse token as JSON string
  try {
    req.user = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
  } catch (e) {
    req.user = { sub: 'dev-admin', roles: ['admin'] };
  }
  return next();
};
