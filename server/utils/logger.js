/**
 * Security Audit Logger for Resumify AI
 * Logs security-relevant events (Auth attempts, Rate limits, Security failures, API errors)
 */

const logSecurityEvent = (eventType, details) => {
  const timestamp = new Date().toISOString();
  const logPayload = {
    timestamp,
    event: eventType,
    ip: details.ip || 'UNKNOWN',
    user: details.user || 'ANONYMOUS',
    path: details.path || 'N/A',
    method: details.method || 'N/A',
    status: details.status || 'N/A',
    message: details.message || '',
  };

  const formattedLog = `[SECURITY AUDIT] ${timestamp} | EVENT: ${eventType} | IP: ${logPayload.ip} | USER: ${logPayload.user} | METHOD: ${logPayload.method} | PATH: ${logPayload.path} | STATUS: ${logPayload.status} | MSG: ${logPayload.message}`;

  if (eventType === 'API_ERROR' || eventType === 'SECURITY_VIOLATION') {
    console.error(formattedLog);
  } else if (eventType === 'RATE_LIMITED' || eventType === 'AUTH_FAILURE') {
    console.warn(formattedLog);
  } else {
    console.log(formattedLog);
  }
};

module.exports = { logSecurityEvent };
