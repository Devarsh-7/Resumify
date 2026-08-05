const { logSecurityEvent } = require('../utils/logger');

// List of known automated scraper/bot user-agents
const BLOCKED_USER_AGENTS = [
  /python-requests/i,
  /python-urllib/i,
  /curl\//i,
  /wget\//i,
  /scrapy/i,
  /libwww-perl/i,
  /go-http-client/i,
  /java\//i,
  /httpclient/i,
  /postmanruntime/i, // Block unauthenticated Postman runtime scripting in production
];

const botProtection = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';

  // Only enforce strict user-agent bot filtering in production
  if (process.env.NODE_ENV === 'production') {
    const isBlocked = BLOCKED_USER_AGENTS.some((pattern) => pattern.test(userAgent));

    if (isBlocked && !req.headers.authorization) {
      logSecurityEvent('SECURITY_VIOLATION', {
        ip: req.ip,
        user: 'BOT_SCRAPER',
        path: req.originalUrl,
        method: req.method,
        status: 403,
        message: `Automated bot request blocked (User-Agent: ${userAgent})`,
      });

      return res.status(403).json({ message: 'Access denied. Automated request detected.' });
    }
  }

  next();
};

module.exports = botProtection;
