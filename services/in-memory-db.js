// In-memory database (fallback khi SQLite fail)
class InMemoryDatabase {
  constructor() {
    this.scans = [];
    this.stats = [];
    this.errors = [];
    this.initialized = true;
  }

  log(message) {
    console.log(`[InMemoryDB] ${message}`);
  }

  async initialize() {
    this.log('Using in-memory database');
    return Promise.resolve();
  }

  async saveScan(scanData) {
    const scan = {
      id: this.scans.length + 1,
      qr_code: scanData.qrCode,
      product_name: scanData.productName,
      product_id: scanData.productId,
      camera_id: scanData.cameraId,
      processing_time_ms: scanData.processingTime,
      confidence: scanData.confidence,
      scan_time: new Date().toISOString(),
      status: 'new',
      created_at: new Date().toISOString()
    };
    
    // Check for duplicates
    if (this.scans.some(s => s.qr_code === scanData.qrCode)) {
      throw new Error('Duplicate QR code');
    }
    
    this.scans.unshift(scan); // Add to beginning
    return { id: scan.id, qrCode: scan.qr_code };
  }

  async getRecentScans(limit = 10) {
    return this.scans.slice(0, limit);
  }

  async getStatistics(startDate, endDate) {
    return {
      totalScans: this.scans.length,
      avgProcessingTime: this.scans.length > 0 
        ? Math.round(this.scans.reduce((a, b) => a + b.processing_time_ms, 0) / this.scans.length)
        : 0,
      avgConfidence: this.scans.length > 0
        ? (this.scans.reduce((a, b) => a + b.confidence, 0) / this.scans.length).toFixed(2)
        : 0,
      cameras: [...new Set(this.scans.map(s => s.camera_id))]
    };
  }

  async getHourlyStats(date) {
    const hours = {};
    this.scans.forEach(scan => {
      const hour = new Date(scan.scan_time).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    return Object.entries(hours).map(([hour, count]) => ({ hour, count }));
  }

  async getDailyStats(startDate, endDate) {
    const days = {};
    this.scans.forEach(scan => {
      const day = new Date(scan.scan_time).toISOString().split('T')[0];
      days[day] = (days[day] || 0) + 1;
    });
    return Object.entries(days).map(([day, count]) => ({ day, count }));
  }

  async getTopProducts(limit = 5) {
    const products = {};
    this.scans.forEach(scan => {
      const key = `${scan.product_id}-${scan.product_name}`;
      products[key] = (products[key] || 0) + 1;
    });
    return Object.entries(products)
      .map(([key, count]) => {
        const [id, name] = key.split('-');
        return { productId: id, productName: name, scanCount: count };
      })
      .sort((a, b) => b.scanCount - a.scanCount)
      .slice(0, limit);
  }

  async updateScanStatus(scanId, status) {
    const scan = this.scans.find(s => s.id === scanId);
    if (scan) {
      scan.status = status;
      return scan;
    }
    return null;
  }

  async getScanById(scanId) {
    return this.scans.find(s => s.id === scanId);
  }

  async clearCache() {
    return Promise.resolve();
  }
}

module.exports = InMemoryDatabase;
