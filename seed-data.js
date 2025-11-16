/**
 * Seed Database - Tạo dữ liệu mẫu cho QR Scanner
 */

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/qr_scanner.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Connection error:', err);
    process.exit(1);
  }
  console.log('✓ Connected to database');
  createTablesAndSeed();
});

function createTablesAndSeed() {
  db.serialize(() => {
    // Create tables
    db.run(`CREATE TABLE IF NOT EXISTS qr_scans (
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
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS scan_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id TEXT,
      total_scans INTEGER DEFAULT 0,
      successful_scans INTEGER DEFAULT 0,
      failed_scans INTEGER DEFAULT 0,
      avg_processing_time REAL,
      scan_date DATE DEFAULT CURRENT_DATE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS scan_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id TEXT,
      error_type TEXT,
      error_message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Delete old data
    db.run('DELETE FROM qr_scans');
    db.run('DELETE FROM scan_stats');
    db.run('DELETE FROM scan_errors');

    // Insert dữ liệu mẫu
    const now = new Date();
    const sampleProducts = [
      { name: 'Laptop Dell XPS 13', id: 'SKU001' },
      { name: 'Mouse Logitech MX', id: 'SKU002' },
      { name: 'Keyboard RGB', id: 'SKU003' },
      { name: 'USB Hub 7-Port', id: 'SKU004' },
      { name: 'Monitor LG 27"', id: 'SKU005' },
      { name: 'Webcam Logitech', id: 'SKU006' },
      { name: 'Headphone Sony', id: 'SKU007' },
      { name: 'SSD Samsung 970', id: 'SKU008' },
      { name: 'RAM Corsair 16GB', id: 'SKU009' },
      { name: 'Power Supply 650W', id: 'SKU010' },
    ];

    const cameras = ['camera_1', 'camera_2', 'camera_3'];
    let inserted = 0;

    // Insert 50 records
    for (let i = 0; i < 50; i++) {
      const product = sampleProducts[i % sampleProducts.length];
      const camera = cameras[Math.floor(Math.random() * cameras.length)];
      const scanTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const processingTime = Math.floor(Math.random() * 100) + 20;
      const confidence = 0.80 + Math.random() * 0.20;
      const qrCode = `QR-${i.toString().padStart(5, '0')}`;

      db.run(
        `INSERT OR IGNORE INTO qr_scans 
         (qr_code, product_name, product_id, camera_id, scan_time, processing_time_ms, confidence, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          qrCode,
          product.name,
          product.id,
          camera,
          scanTime.toISOString(),
          processingTime,
          confidence,
          Math.random() > 0.1 ? 'processed' : 'new'
        ],
        (err) => {
          if (!err) inserted++;
        }
      );
    }

    // Sau khi insert xong
    setTimeout(() => {
      console.log(`\n✓ Inserted ${inserted} QR scan records`);
      displaySummary();
    }, 1000);
  });
}

function displaySummary() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 DATABASE SUMMARY');
  console.log('='.repeat(50));

  db.all(`
    SELECT 
      COUNT(*) as total_scans,
      COUNT(DISTINCT qr_code) as unique_products,
      COUNT(DISTINCT camera_id) as active_cameras,
      AVG(processing_time_ms) as avg_processing_time,
      AVG(confidence) as avg_confidence
    FROM qr_scans
  `, (err, rows) => {
    if (rows && rows[0]) {
      const stats = rows[0];
      console.log(`\n📈 Scan Statistics:`);
      console.log(`   • Tổng scan: ${stats.total_scans}`);
      console.log(`   • Sản phẩm duy nhất: ${stats.unique_products}`);
      console.log(`   • Camera hoạt động: ${stats.active_cameras}`);
      console.log(`   • Tốc độ xử lý trung bình: ${Math.round(stats.avg_processing_time)}ms`);
      console.log(`   • Độ tin cậy trung bình: ${(stats.avg_confidence * 100).toFixed(1)}%`);
    }

    // Top products
    db.all(`
      SELECT 
        qr_code,
        product_name,
        COUNT(*) as scan_count
      FROM qr_scans
      GROUP BY qr_code
      ORDER BY scan_count DESC
      LIMIT 5
    `, (err, rows) => {
      if (rows && rows.length > 0) {
        console.log(`\n🏆 Top 5 Sản phẩm:`);
        rows.forEach((row, idx) => {
          console.log(`   ${idx + 1}. ${row.product_name} (${row.scan_count} scans) - ${row.qr_code}`);
        });
      }

      // Camera stats
      db.all(`
        SELECT 
          camera_id,
          COUNT(*) as total_scans,
          MAX(scan_time) as last_scan
        FROM qr_scans
        GROUP BY camera_id
      `, (err, rows) => {
        if (rows && rows.length > 0) {
          console.log(`\n📷 Camera Statistics:`);
          rows.forEach((row) => {
            const lastScan = new Date(row.last_scan).toLocaleString('vi-VN');
            console.log(`   • ${row.camera_id}: ${row.total_scans} scans (Last: ${lastScan})`);
          });
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ Database seeded successfully!');
        console.log('='.repeat(50) + '\n');
        
        db.close();
        process.exit(0);
      });
    });
  });
}
