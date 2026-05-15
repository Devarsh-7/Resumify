const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { signup, login, googleLogin, verifyEmail, resendCode, getMe, updateProfile, deleteAccount, requestPasswordReset, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// ─── Rate Limiters (per-route) ───────────────────────────────

// Auth attempts: 10 requests per 15 minutes per IP
// Prevents brute-force login and signup spam
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again after 15 minutes.' },
});

// OTP verification: 5 requests per 10 minutes per IP
// Prevents brute-forcing the 6-digit code (1M combinations)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts, please try again after 10 minutes.' },
});

// Public routes (no login needed)
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.post('/verify-email', otpLimiter, verifyEmail);
router.post('/resend-code', otpLimiter, resendCode);
router.post('/forgot-password', authLimiter, requestPasswordReset);
router.post('/reset-password', otpLimiter, resetPassword);

// Protected routes (login required)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.delete('/account', protect, deleteAccount);

module.exports = router;
