const jsQR = require('jsqr');
const logger = require('../utils/logger');

class QRScanner {
  constructor() {
    this.deduplicationCache = new Map();
    this.cacheTimeout = 500; // 500ms để tránh duplicate scans
  }

  /**
   * Quét mã QR từ frame ảnh
   * @param {Buffer} frameBuffer - Buffer ảnh từ camera
   * @param {number} width - Chiều rộng ảnh
   * @param {number} height - Chiều cao ảnh
   * @returns {Promise<Array>} - Mảng các mã QR tìm được
   */
  async scanFrame(frameBuffer, width, height) {
    try {
      const startTime = Date.now();

      // Chuyển đổi buffer thành ImageData format
      const imageData = {
        data: frameBuffer,
        width: width,
        height: height
      };

      // Quét QR code
      const qrCode = jsQR(frameBuffer, width, height);
      
      const processingTime = Date.now() - startTime;

      if (qrCode && qrCode.data) {
        return {
          success: true,
          data: qrCode.data,
          processingTime: processingTime,
          confidence: qrCode.binaryData ? 0.95 : 0.85,
          location: qrCode.location
        };
      }

      return {
        success: false,
        processingTime: processingTime
      };
    } catch (error) {
      logger.error('Error scanning frame:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Kiểm tra trùng lặp để tránh scan cùng mã QR nhiều lần
   * @param {string} qrData - Dữ liệu mã QR
   * @returns {boolean} - true nếu là scan mới
   */
  isNewScan(qrData) {
    const cached = this.deduplicationCache.get(qrData);
    
    if (cached) {
      const timePassed = Date.now() - cached;
      if (timePassed < this.cacheTimeout) {
        return false; // Còn trong khoảng thời gian deduplication
      }
    }

    // Thêm vào cache
    this.deduplicationCache.set(qrData, Date.now());
    
    // Xóa cache cũ nếu quá lớn
    if (this.deduplicationCache.size > 1000) {
      const firstKey = this.deduplicationCache.keys().next().value;
      this.deduplicationCache.delete(firstKey);
    }

    return true;
  }

  /**
   * Xử lý dữ liệu QR code
   * @param {string} rawData - Dữ liệu QR thô
   * @returns {Object} - Dữ liệu QR được phân tích
   */
  parseQRData(rawData) {
    try {
      // Thử parse dạng JSON
      try {
        return JSON.parse(rawData);
      } catch (e) {
        // Nếu không phải JSON, tách theo format thông thường
        // Format: productId|productName|batchCode|...
        const parts = rawData.split('|');
        if (parts.length > 1) {
          return {
            productId: parts[0],
            productName: parts[1],
            batchCode: parts[2],
            rawData: rawData
          };
        }
      }

      // Mặc định trả về dữ liệu thô
      return {
        productId: rawData,
        productName: 'Unknown',
        rawData: rawData
      };
    } catch (error) {
      logger.error('Error parsing QR data:', error);
      return {
        productId: rawData,
        rawData: rawData
      };
    }
  }

  /**
   * Validate mã QR
   * @param {string} qrData - Dữ liệu mã QR
   * @returns {boolean}
   */
  validateQRData(qrData) {
    if (!qrData || typeof qrData !== 'string') {
      return false;
    }

    // Kiểm tra độ dài hợp lệ (thường 10-300 ký tự)
    if (qrData.length < 5 || qrData.length > 500) {
      return false;
    }

    // Kiểm tra ký tự hợp lệ (chỉ chứa ký tự in được)
    if (!/^[\x20-\x7E]*$/.test(qrData)) {
      return false;
    }

    return true;
  }

  setDeduplicationTime(ms) {
    this.cacheTimeout = ms;
  }

  clearCache() {
    this.deduplicationCache.clear();
  }
}

module.exports = new QRScanner();
