const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - checks JWT token
const protect = async (req, res, next) => {
  // Check if token exists in Authorization header
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  ) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    // Extract token from "Bearer <token>"
    const token = req.headers.authorization.split(' ')[1];

    // Verify the token and decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request (without password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    next(); // Continue to the next middleware/route
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

module.exports = { protect };
