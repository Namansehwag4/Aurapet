const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes: verifies incoming JWT tokens
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header (standard: Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header array
    token = req.headers.authorization.split(' ')[1];
  }

  // Verify token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route (token missing)'
    });
  }

  try {
    // Verify token validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user details from database and attach to the request object (excluding password)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found in database'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized (token verification failed)'
    });
  }
};

module.exports = { protect };
