const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// ─── Security Middleware ─────────────────────────────────────
// Helmet: Sets secure HTTP headers (XSS protection, clickjacking, MIME-sniffing, etc.)
app.use(helmet());

// Compression: Compresses all JSON response payloads sent to the client (Brotli/Gzip)
app.use(compression());

// ─── CORS ────────────────────────────────────────────────────
// Enable CORS (allow frontend to talk to backend)
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL, // Production Vercel URL (e.g. https://resumify-xyz.vercel.app)
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Body Parsing ────────────────────────────────────────────
// Parse JSON request bodies (with size limit to prevent payload DoS)
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── NoSQL Injection Protection ──────────────────────────────
// Custom sanitizer (express-mongo-sanitize is incompatible with Express 5)
// Strips keys starting with $ or containing . from req.body and req.params
// Prevents attacks like { "email": { "$gt": "" } } from bypassing auth
const sanitize = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    }
  }
};
app.use((req, res, next) => {
  sanitize(req.body);
  sanitize(req.params);
  next();
});

// ─── Rate Limiting ───────────────────────────────────────────
// 1. General rate limiter: 200 requests per 15 minutes per IP (for normal API queries)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// 2. Strict limiter for expensive Gemini AI resume analysis
const aiAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 analyses per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many analysis requests. Please try again later.' },
});
app.use('/api/resume/analyze', aiAnalysisLimiter);

// Strict limiter for humanizing text
const humanizeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many humanizer requests. Please try again later.' },
});
app.use('/api/resume/humanize', humanizeLimiter);

// Strict limiter for parsing files (DOCX/PDF) to prevent resource exhaustion
const parseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 parser requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many document upload attempts. Please try again later.' },
});
app.use('/api/resume/parse', parseLimiter);

// 3. Strict limiter for email sending and verification to prevent OTP spam/brute-force
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 signup/verification/OTP resend attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Please try again in 10 minutes.' },
});
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/verify-email', authLimiter);
app.use('/api/auth/resend-code', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resume', require('./routes/resumeRoutes'));

// Health check endpoint (verifies DB connectivity)
app.get('/api/health', (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
    message: dbOk ? 'Resumify API is running! 🚀' : 'API is running but database is unreachable',
  });
});

// ─── Error Handling ──────────────────────────────────────────
// Handle Multer errors (file upload issues)
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
  }
  if (err.message === 'Only PDF and DOCX files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS: Origin not allowed' });
  }
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Graceful Error Handlers ─────────────────────────────────
// Catch unhandled promise rejections (e.g. failed DB queries not in try/catch)
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Don't crash — log and continue
});

// Catch uncaught exceptions (genuine bugs)
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  // Must exit — process is in an unreliable state
  process.exit(1);
});

// ─── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // One-time migration: Mark existing users (pre-verification feature) as verified
  const User = require('./models/User');
  const result = await User.updateMany(
    { verificationCode: { $exists: false }, isVerified: { $ne: true } },
    { $set: { isVerified: true } }
  );
  if (result.modifiedCount > 0) {
    console.log(`✅ Migrated ${result.modifiedCount} existing user(s) to verified status.`);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Resumify server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
  });
});
