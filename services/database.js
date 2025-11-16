require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');
const InMemoryDB = require('./in-memory-db');

const dbPath = path.join(__dirname, '../data/qr_scanner.db');

class Database {
  constructor() {
    this.db = null;
    this.useInMemory = false;
    this.inMemoryDb = null;
  }

  async initialize() {
    // On Vercel, try SQLite first, fallback to in-memory
    return new Promise((resolve, reject) => {
      try {
        this.db = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            logger.warn('SQLite connection failed, using in-memory database:', err.message);
            this.useInMemory = true;
            this.inMemoryDb = new InMemoryDB();
            this.inMemoryDb.initialize().then(resolve).catch(reject);
          } else {
            logger.info('Connected to SQLite database');
            this.useInMemory = false;
            this.createTables().then(resolve).catch(reject);
          }
        });
      } catch (err) {
        logger.warn('Failed to initialize SQLite, using in-memory database:', err.message);
        this.useInMemory = true;
        this.inMemoryDb = new InMemoryDB();
        this.inMemoryDb.initialize().then(resolve).catch(reject);
      }
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Bảng QR codes
        this.db.run(`
          CREATE TABLE IF NOT EXISTS qr_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            qr_code TEXT NOT NULL UNIQUE,
            product_name TEXT,
            product_id TEXT,
            scan_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            camera_id TEXT,
            status TEXT DEFAULT 'new',
            processing_time_ms INTEGER,
            confidence REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) logger.error('Error creating qr_scans table:', err);
        });

        // Bảng thống kê
        this.db.run(`
          CREATE TABLE IF NOT EXISTS scan_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id TEXT,
            total_scans INTEGER DEFAULT 0,
            successful_scans INTEGER DEFAULT 0,
            failed_scans INTEGER DEFAULT 0,
            avg_processing_time REAL,
            scan_date DATE DEFAULT CURRENT_DATE,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) logger.error('Error creating scan_stats table:', err);
        });

        // Bảng lỗi
        this.db.run(`
          CREATE TABLE IF NOT EXISTS scan_errors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id TEXT,
            error_type TEXT,
            error_message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) logger.error('Error creating scan_errors table:', err);
          resolve();
        });

        // Tạo index để tăng tốc độ truy vấn
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_qr_code ON qr_scans(qr_code)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_scan_time ON qr_scans(scan_time)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_camera_id ON qr_scans(camera_id)`);
      });
    });
  }

  async saveScan(scanData) {
    if (this.useInMemory) {
      return this.inMemoryDb.saveScan(scanData);
    }

    return new Promise((resolve, reject) => {
      const { qrCode, productName, productId, cameraId, processingTime, confidence } = scanData;
      
      this.db.run(
        `INSERT OR IGNORE INTO qr_scans (qr_code, product_name, product_id, camera_id, processing_time_ms, confidence)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [qrCode, productName, productId, cameraId, processingTime, confidence],
        function(err) {
          if (err) {
            logger.error('Error saving scan:', err);
            reject(err);
          } else {
            resolve({ id: this.lastID, qrCode });
          }
        }
      );
    });
  }

  async getRecentScans(limit = 50, cameraId = null) {
    if (this.useInMemory) {
      return this.inMemoryDb.getRecentScans(limit);
    }

    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM qr_scans ORDER BY scan_time DESC LIMIT ?`;
      let params = [limit];

      if (cameraId) {
        query = `SELECT * FROM qr_scans WHERE camera_id = ? ORDER BY scan_time DESC LIMIT ?`;
        params = [cameraId, limit];
      }

      this.db.all(query, params, (err, rows) => {
        if (err) {
          logger.error('Error fetching scans:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async getStatistics(cameraId = null, days = 1) {
    if (this.useInMemory) {
      return this.inMemoryDb.getStatistics();
    }

    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          camera_id,
          COUNT(*) as total_scans,
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as pending,
          AVG(processing_time_ms) as avg_processing_time,
          MAX(processing_time_ms) as max_processing_time,
          MIN(processing_time_ms) as min_processing_time,
          AVG(confidence) as avg_confidence
        FROM qr_scans
        WHERE scan_time >= datetime('now', '-${days} days')
      `;

      if (cameraId) {
        query += ` AND camera_id = ?`;
      }

      query += ` GROUP BY camera_id`;

      const params = cameraId ? [cameraId] : [];

      this.db.all(query, params, (err, rows) => {
        if (err) {
          logger.error('Error fetching statistics:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async updateScanStatus(scanId, status) {
    if (this.useInMemory) {
      return this.inMemoryDb.updateScanStatus(scanId, status);
    }

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE qr_scans SET status = ? WHERE id = ?`,
        [status, scanId],
        function(err) {
          if (err) {
            logger.error('Error updating scan status:', err);
            reject(err);
          } else {
            resolve({ success: true });
          }
        }
      );
    });
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new Database();
