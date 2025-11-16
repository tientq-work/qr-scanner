const express = require('express');
const router = express.Router();
const database = require('../services/database');
const logger = require('../utils/logger');

/**
 * GET /api/stats
 * Lấy thống kê quét QR code
 */
router.get('/', async (req, res) => {
  try {
    const { cameraId, days = 1 } = req.query;

    const stats = await database.getStatistics(cameraId, parseInt(days));

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/stats/hourly
 * Thống kê theo giờ
 */
router.get('/hourly', async (req, res) => {
  try {
    const { cameraId, hours = 24 } = req.query;

    let query = `
      SELECT 
        strftime('%Y-%m-%d %H:00:00', scan_time) as hour,
        COUNT(*) as total_scans,
        AVG(processing_time_ms) as avg_processing_time,
        AVG(confidence) as avg_confidence
      FROM qr_scans
      WHERE scan_time >= datetime('now', '-${parseInt(hours)} hours')
    `;

    if (cameraId) {
      query += ` AND camera_id = ?`;
    }

    query += ` GROUP BY hour ORDER BY hour DESC`;

    const params = cameraId ? [cameraId] : [];

    database.db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error fetching hourly stats:', err);
        return res.status(500).json({
          error: 'Failed to fetch hourly statistics',
          message: err.message
        });
      }

      res.json({
        success: true,
        data: rows || [],
        timestamp: new Date().toISOString()
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
 * GET /api/stats/daily
 * Thống kê theo ngày
 */
router.get('/daily', async (req, res) => {
  try {
    const { cameraId, days = 30 } = req.query;

    let query = `
      SELECT 
        DATE(scan_time) as date,
        COUNT(*) as total_scans,
        COUNT(DISTINCT qr_code) as unique_products,
        AVG(processing_time_ms) as avg_processing_time,
        MIN(processing_time_ms) as min_processing_time,
        MAX(processing_time_ms) as max_processing_time,
        AVG(confidence) as avg_confidence
      FROM qr_scans
      WHERE scan_time >= datetime('now', '-${parseInt(days)} days')
    `;

    if (cameraId) {
      query += ` AND camera_id = ?`;
    }

    query += ` GROUP BY date ORDER BY date DESC`;

    const params = cameraId ? [cameraId] : [];

    database.db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error fetching daily stats:', err);
        return res.status(500).json({
          error: 'Failed to fetch daily statistics',
          message: err.message
        });
      }

      res.json({
        success: true,
        data: rows || [],
        timestamp: new Date().toISOString()
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
 * GET /api/stats/cameras
 * Danh sách tất cả camera đã quét
 */
router.get('/cameras', async (req, res) => {
  try {
    const query = `
      SELECT 
        camera_id,
        COUNT(*) as total_scans,
        MAX(scan_time) as last_scan,
        AVG(processing_time_ms) as avg_processing_time
      FROM qr_scans
      GROUP BY camera_id
      ORDER BY last_scan DESC
    `;

    database.db.all(query, (err, rows) => {
      if (err) {
        logger.error('Error fetching camera stats:', err);
        return res.status(500).json({
          error: 'Failed to fetch camera statistics',
          message: err.message
        });
      }

      res.json({
        success: true,
        data: rows || [],
        timestamp: new Date().toISOString()
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
 * GET /api/stats/top-products
 * Sản phẩm quét nhiều nhất
 */
router.get('/top-products', async (req, res) => {
  try {
    const { limit = 20, cameraId, days = 7 } = req.query;

    let query = `
      SELECT 
        qr_code,
        product_id,
        product_name,
        COUNT(*) as scan_count,
        MAX(scan_time) as last_scan
      FROM qr_scans
      WHERE scan_time >= datetime('now', '-${parseInt(days)} days')
    `;

    if (cameraId) {
      query += ` AND camera_id = ?`;
    }

    query += ` GROUP BY qr_code ORDER BY scan_count DESC LIMIT ${Math.min(parseInt(limit), 100)}`;

    const params = cameraId ? [cameraId] : [];

    database.db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error fetching top products:', err);
        return res.status(500).json({
          error: 'Failed to fetch top products',
          message: err.message
        });
      }

      res.json({
        success: true,
        data: rows || [],
        timestamp: new Date().toISOString()
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
 * GET /api/stats/performance
 * Thống kê hiệu năng quét
 */
router.get('/performance', async (req, res) => {
  try {
    const { cameraId, hours = 24 } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_scans,
        COUNT(DISTINCT qr_code) as unique_qr_codes,
        AVG(processing_time_ms) as avg_processing_time,
        MIN(processing_time_ms) as min_processing_time,
        MAX(processing_time_ms) as max_processing_time,
        AVG(confidence) as avg_confidence,
        MIN(confidence) as min_confidence,
        MAX(confidence) as max_confidence,
        (COUNT(*) * 3600.0 / 
         (strftime('%s', MAX(scan_time)) - strftime('%s', MIN(scan_time)))) as scans_per_hour
      FROM qr_scans
      WHERE scan_time >= datetime('now', '-${parseInt(hours)} hours')
    `;

    if (cameraId) {
      query += ` AND camera_id = ?`;
    }

    const params = cameraId ? [cameraId] : [];

    database.db.get(query, params, (err, row) => {
      if (err) {
        logger.error('Error fetching performance stats:', err);
        return res.status(500).json({
          error: 'Failed to fetch performance statistics',
          message: err.message
        });
      }

      res.json({
        success: true,
        data: row || {},
        timestamp: new Date().toISOString()
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

module.exports = router;
