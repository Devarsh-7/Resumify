const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { signup, login, googleLogin, verifyEmail, resendCode, getMe, updateProfile, deleteAccount, requestPasswordReset, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Rate limiting configurations for auth endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this IP. Please try again later.' },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset attempts. Please try again after 15 minutes.' },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Please try again after 10 minutes.' },
});

// Public authentication routes
router.post('/signup', signupLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/google', loginLimiter, googleLogin);
router.post('/verify-email', otpLimiter, verifyEmail);
router.post('/resend-code', otpLimiter, resendCode);
router.post('/forgot-password', passwordResetLimiter, requestPasswordReset);
router.post('/reset-password', otpLimiter, resetPassword);

// Authenticated user profile routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.delete('/account', protect, deleteAccount);

module.exports = router;
