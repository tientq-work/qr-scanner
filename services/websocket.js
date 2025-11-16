const logger = require('../utils/logger');
const database = require('./database');

let wsClients = [];

/**
 * Setup WebSocket cho realtime scanning
 */
function setupWebSocket(app) {
  app.ws('/api/qr/stream', (ws, req) => {
    const clientId = req.query.cameraId || `client-${Date.now()}`;
    logger.info(`WebSocket client connected: ${clientId}`);
    
    ws.clientId = clientId;
    wsClients.push(ws);

    // Gửi thông báo kết nối
    ws.send(JSON.stringify({
      type: 'connected',
      clientId: clientId,
      timestamp: new Date().toISOString()
    }));

    // Xử lý tin nhắn từ client
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        
        if (data.type === 'scan') {
          handleScanData(data, ws, clientId);
        } else if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        logger.error('WebSocket message error:', error);
      }
    });

    // Xử lý đóng kết nối
    ws.on('close', () => {
      logger.info(`WebSocket client disconnected: ${clientId}`);
      wsClients = wsClients.filter(client => client !== ws);
    });

    // Xử lý lỗi
    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${clientId}:`, error);
    });
  });
}

/**
 * Xử lý dữ liệu scan từ client
 */
async function handleScanData(data, ws, clientId) {
  try {
    const { qrCode, productName, productId, processingTime, confidence } = data;

    // Lưu vào database
    const result = await database.saveScan({
      qrCode,
      productName,
      productId,
      cameraId: clientId,
      processingTime: processingTime || 0,
      confidence: confidence || 0.9
    });

    // Gửi acknowledgment cho client
    ws.send(JSON.stringify({
      type: 'scan_ack',
      scanId: result.id,
      qrCode: qrCode,
      timestamp: new Date().toISOString()
    }));

    // Broadcast tới các client khác
    broadcastScan({
      scanId: result.id,
      qrCode,
      productName,
      productId,
      cameraId: clientId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error handling scan data:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
}

/**
 * Broadcast dữ liệu scan tới tất cả clients
 */
function broadcastScan(scanData) {
  const message = JSON.stringify({
    type: 'scan_result',
    data: scanData
  });

  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

/**
 * Broadcast thống kê tới tất cả clients
 */
function broadcastStats(stats) {
  const message = JSON.stringify({
    type: 'stats_update',
    data: stats,
    timestamp: new Date().toISOString()
  });

  wsClients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

module.exports = {
  setupWebSocket,
  broadcastScan,
  broadcastStats
};
