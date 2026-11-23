'use strict';

const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const rateLimit = require('../middleware/rateLimit.middleware');

const router = express.Router();

// Rate limit: 20 requests per 15 minutes per IP for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

module.exports = router;
