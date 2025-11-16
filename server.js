require('dotenv').config();
const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const database = require('./services/database');
const qrScannerRouter = require('./routes/qr-scanner');
const statsRouter = require('./routes/stats');
const { setupWebSocket } = require('./services/websocket');

const app = express();
expressWs(app);

// Middleware bảo mật
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "ws://localhost:3000", "ws://localhost:*", "http://localhost:*", "ws://*", "wss://*", "https:", "http:"]
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add compression middleware
const compression = require('compression');
app.use(compression());

// Static files with caching
app.use(express.static('public', {
  maxAge: '1h',
  etag: false
}));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Khởi tạo database (async, non-blocking)
let dbReady = false;
database.initialize()
  .then(() => {
    dbReady = true;
    logger.info('Database ready');
  })
  .catch(err => {
    logger.warn('Database initialization failed, using in-memory fallback:', err.message);
    dbReady = true; // Still mark as ready even if it fails (in-memory will be used)
  });

// API Routes
app.use('/api/qr', qrScannerRouter);
app.use('/api/stats', statsRouter);

// WebSocket cho realtime scanning
setupWebSocket(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Serve home page (lite version on Vercel, full version locally)
app.get('/', (req, res) => {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  const filePath = isVercel ? 'public/lite.html' : 'public/index.html';
  res.sendFile(__dirname + '/' + filePath);
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`QR Scanner API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
