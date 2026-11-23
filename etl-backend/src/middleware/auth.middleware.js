'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes: verifies Bearer JWT token and attaches authenticated user to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Bearer token missing.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing.',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[auth.middleware] Fatal: JWT_SECRET environment variable is missing.');
      return res.status(500).json({
        success: false,
        message: 'Authentication service configuration error.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid or malformed authentication token.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account associated with token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[auth.middleware] Unexpected error in protect middleware:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication processing failed.',
    });
  }
};

module.exports = protect;
