const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../utils/http');

// Requires `Authorization: Bearer <token>`; sets req.user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Not authorised, please log in' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Session expired, please log in again' });
  }

  const user = await User.findById(payload.id);
  if (!user) {
    return res.status(401).json({ message: 'Account no longer exists' });
  }

  req.user = user;
  next();
});

// Use after `protect`: authorize('admin'), authorize('worker', 'admin'), ...
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do this' });
    }
    next();
  };

module.exports = { protect, authorize };
