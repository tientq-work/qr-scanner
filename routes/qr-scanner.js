const express = require('express');
const router = express.Router();
const database = require('../services/database');
const qrScanner = require('../services/qr-scanner');
const { broadcastScan, broadcastStats } = require('../services/websocket');
const logger = require('../utils/logger');

/**
 * POST /api/qr/scan
 * Quét mã QR từ dữ liệu base64 hoặc buffer
 */
router.post('/scan', async (req, res) => {
  try {
    const { imageData, width, height, cameraId, qrCode } = req.body;

    // Nếu được gửi qrCode trực tiếp (từ demo mode hoặc manual input)
    if (qrCode) {
      try {
        const parsedData = qrScanner.parseQRData(qrCode);
        
        const dbResult = await database.saveScan({
          qrCode: qrCode,
          productName: parsedData.productName,
          productId: parsedData.productId,
          cameraId: cameraId || 'default',
          processingTime: 10,
          confidence: 1.0
        });

        broadcastScan({
          scanId: dbResult.id,
          qrCode: qrCode,
          productName: parsedData.productName,
          productId: parsedData.productId,
          cameraId: cameraId || 'default',
          processingTime: 10,
          confidence: 1.0,
          timestamp: new Date().toISOString()
        });

        return res.json({
          success: true,
          message: 'QR code scanned successfully',
          qrCode: qrCode,
          ...parsedData,
          processingTime: 10,
          confidence: 1.0
        });
      } catch (err) {
        logger.error('Error processing direct QR code:', err);
        return res.json({
          success: false,
          message: 'Error processing QR code',
          error: err.message
        });
      }
    }

    if (!imageData || !width || !height) {
      return res.status(400).json({
        error: 'Missing required parameters: imageData, width, height or qrCode'
      });
    }

    // Chuyển đổi base64 thành buffer
    const buffer = Buffer.from(imageData, 'base64');
    const startTime = Date.now();

    // Quét QR code
    const scanResult = await qrScanner.scanFrame(buffer, width, height);
    
    if (!scanResult.success) {
      return res.json({
        success: false,
        message: 'No QR code detected',
        processingTime: scanResult.processingTime
      });
    }

    // Kiểm tra trùng lặp
    if (!qrScanner.isNewScan(scanResult.data)) {
      return res.json({
        success: false,
        message: 'Duplicate scan detected',
        qrCode: scanResult.data,
        processingTime: scanResult.processingTime
      });
    }

    // Parse dữ liệu QR
    const parsedData = qrScanner.parseQRData(scanResult.data);

    // Validate
    if (!qrScanner.validateQRData(scanResult.data)) {
      return res.json({
        success: false,
        message: 'Invalid QR data',
        processingTime: scanResult.processingTime
      });
    }

    // Lưu vào database
    const dbResult = await database.saveScan({
      qrCode: scanResult.data,
      productName: parsedData.productName,
      productId: parsedData.productId,
      cameraId: cameraId || 'default',
      processingTime: scanResult.processingTime,
      confidence: scanResult.confidence
    });

    // Broadcast kết quả
    broadcastScan({
      scanId: dbResult.id,
      qrCode: scanResult.data,
      productName: parsedData.productName,
      productId: parsedData.productId,
      cameraId: cameraId || 'default',
      processingTime: scanResult.processingTime,
      confidence: scanResult.confidence,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      scanId: dbResult.id,
      qrCode: scanResult.data,
      ...parsedData,
      processingTime: scanResult.processingTime,
      confidence: scanResult.confidence,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Scan error:', error);
    res.status(500).json({
      error: 'Scan failed',
      message: error.message
    });
  }
});

/**
 * POST /api/qr/batch-scan
 * Quét nhiều mã QR cùng một lúc từ dữ liệu raw
 */
router.post('/batch-scan', async (req, res) => {
  try {
    const { scans, cameraId } = req.body;

    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({
        error: 'Invalid scans data'
      });
    }

    const results = [];
    
    for (const scan of scans) {
      try {
        if (!qrScanner.isNewScan(scan)) {
          results.push({
            qrCode: scan,
            status: 'duplicate'
          });
          continue;
        }

        const parsedData = qrScanner.parseQRData(scan);

        if (!qrScanner.validateQRData(scan)) {
          results.push({
            qrCode: scan,
            status: 'invalid'
          });
          continue;
        }

        const dbResult = await database.saveScan({
          qrCode: scan,
          productName: parsedData.productName,
          productId: parsedData.productId,
          cameraId: cameraId || 'default',
          processingTime: 0,
          confidence: 0.9
        });

        results.push({
          scanId: dbResult.id,
          qrCode: scan,
          ...parsedData,
          status: 'success'
        });

        broadcastScan({
          scanId: dbResult.id,
          qrCode: scan,
          ...parsedData,
          cameraId: cameraId || 'default',
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        logger.error(`Error processing scan ${scan}:`, err);
        results.push({
          qrCode: scan,
          status: 'error',
          message: err.message
        });
      }
    }

    res.json({
      success: true,
      processed: scans.length,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Batch scan error:', error);
    res.status(500).json({
      error: 'Batch scan failed',
      message: error.message
    });
  }
});

/**
 * GET /api/qr/recent
 * Lấy danh sách QR code quét gần đây
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 50, cameraId } = req.query;
    
    const scans = await database.getRecentScans(
      Math.min(parseInt(limit), 500),
      cameraId
    );

    res.json({
      success: true,
      count: scans.length,
      data: scans,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching recent scans:', error);
    res.status(500).json({
      error: 'Failed to fetch scans',
      message: error.message
    });
  }
});

/**
 * GET /api/qr/:qrCode
 * Lấy thông tin chi tiết của một mã QR
 */
router.get('/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;

    const query = `SELECT * FROM qr_scans WHERE qr_code = ? ORDER BY scan_time DESC LIMIT 1`;
    
    database.db.get(query, [qrCode], (err, row) => {
      if (err) {
        logger.error('Error fetching QR details:', err);
        return res.status(500).json({
          error: 'Failed to fetch QR details',
          message: err.message
        });
      }

      if (!row) {
        return res.status(404).json({
          error: 'QR code not found'
        });
      }

      res.json({
        success: true,
        data: row
      });
    });

  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /api/qr/:scanId/status
 * Cập nhật trạng thái của một scan
 */
router.put('/:scanId/status', async (req, res) => {
  try {
    const { scanId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }

    await database.updateScanStatus(scanId, status);

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      scanId: scanId,
      status: status
    });

  } catch (error) {
    logger.error('Error updating status:', error);
    res.status(500).json({
      error: 'Failed to update status',
      message: error.message
    });
  }
});

/**
 * DELETE /api/qr/cache/clear
 * Xóa cache deduplication
 */
router.delete('/cache/clear', (req, res) => {
  qrScanner.clearCache();
  res.json({
    success: true,
    message: 'Cache cleared'
  });
});

module.exports = router;
