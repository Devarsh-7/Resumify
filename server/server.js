const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const { logSecurityEvent } = require('./utils/logger');
const botProtection = require('./middleware/botProtection');

dotenv.config();

const app = express();

// Trust reverse proxies (Render, Vercel, Cloudflare, Nginx) for IP & HTTPS headers
app.set('trust proxy', 1);

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Security headers and payload compression
app.use(helmet({
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
}));
app.use(compression());

// Audit logger for security events and server errors
app.use((req, res, next) => {
  res.on('finish', () => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user = req.user ? req.user._id : 'ANONYMOUS';

    if (res.statusCode === 429) {
      logSecurityEvent('RATE_LIMITED', { ip, user, path: req.originalUrl, method: req.method, status: res.statusCode, message: 'Rate limit exceeded' });
    } else if (res.statusCode === 401 || res.statusCode === 403) {
      logSecurityEvent('SECURITY_VIOLATION', { ip, user, path: req.originalUrl, method: req.method, status: res.statusCode, message: 'Unauthorized or forbidden access attempt' });
    } else if (res.statusCode >= 500) {
      logSecurityEvent('API_ERROR', { ip, user, path: req.originalUrl, method: req.method, status: res.statusCode, message: 'Server internal error' });
    }
  });
  next();
});

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Sanitize query params, body, and route params against NoSQL injection
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
  sanitize(req.query);
  next();
});

// Block scrapers and automated bots
app.use('/api', botProtection);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// Specific rate limiters for resource-heavy endpoints
const aiAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many analysis requests. Please try again later.' },
});
app.use('/api/resume/analyze', aiAnalysisLimiter);

const humanizeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many humanizer requests. Please try again later.' },
});
app.use('/api/resume/humanize', humanizeLimiter);

const parseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many document upload attempts. Please try again later.' },
});
app.use('/api/resume/parse', parseLimiter);

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resume', require('./routes/resumeRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
    message: dbOk ? 'Resumify API is running' : 'API is running but database is unreachable',
  });
});

// Error handling for Multer and CORS
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
  }
  if (err.message === 'Only PDF and DOCX files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS: Origin not allowed' });
  }
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// Graceful process error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Resumify server running on port ${PORT}`);
  });
});
