const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  // Silent fail - logs directory may not be writable on Vercel
}

const transports = [
  new winston.transports.Console()
];

// Try to add file transports only if on local environment
if (process.env.NODE_ENV !== 'production') {
  try {
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error'
      })
    );
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log')
      })
    );
  } catch (err) {
    // Silent fail
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: transports
});

module.exports = logger;
