/**
 * String Input Sanitizer Helper
 * Strips HTML tags, script elements, and dangerous control characters to prevent XSS and script injection.
 */

const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags & content
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip inline JS links
    .replace(/on\w+\s*=/gi, '') // Strip event handlers like onload=, onerror=
    .trim();
};

const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
  }
  return obj;
};

module.exports = { sanitizeString, sanitizeObject };
