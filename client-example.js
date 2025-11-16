/**
 * QR Scanner Client - Ví dụ sử dụng WebSocket
 * Chạy trong Node.js hoặc browser
 */

class QRScannerClient {
  constructor(wsUrl = 'ws://localhost:3000/api/qr/stream', cameraId = 'camera_1') {
    this.wsUrl = wsUrl;
    this.cameraId = cameraId;
    this.ws = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
  }

  /**
   * Kết nối đến WebSocket server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.wsUrl);
        url.searchParams.append('cameraId', this.cameraId);

        this.ws = new WebSocket(url.toString());

        this.ws.onopen = () => {
          console.log('✓ Connected to QR Scanner');
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('✗ WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('✗ Disconnected from QR Scanner');
          this.isConnected = false;
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Xử lý tin nhắn từ server
   */
  handleMessage(message) {
    const { type } = message;

    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type)(message);
    }

    console.log(`[${type}]`, message);
  }

  /**
   * Đăng ký handler cho loại message
   */
  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Gửi dữ liệu quét
   */
  sendScan(qrCode, productName = '', productId = '', processingTime = 0, confidence = 0.9) {
    if (!this.isConnected) {
      console.error('Not connected to server');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'scan',
      qrCode: qrCode,
      productName: productName,
      productId: productId,
      processingTime: processingTime,
      confidence: confidence
    }));
  }

  /**
   * Ping để giữ kết nối
   */
  ping() {
    if (this.isConnected) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Đóng kết nối
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }
}

// Ví dụ sử dụng
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QRScannerClient;
}

// Browser example
async function setupQRScanner() {
  const client = new QRScannerClient('ws://localhost:3000/api/qr/stream', 'camera_1');

  // Xử lý khi kết nối thành công
  client.on('connected', (msg) => {
    console.log('Connected with client ID:', msg.clientId);
  });

  // Xử lý kết quả quét từ các client khác
  client.on('scan_result', (msg) => {
    console.log('New scan detected:', msg.data);
    // Cập nhật UI tại đây
  });

  // Xử lý xác nhận quét
  client.on('scan_ack', (msg) => {
    console.log('Scan acknowledged:', msg.scanId);
  });

  try {
    await client.connect();

    // Gửi ping mỗi 30 giây
    setInterval(() => client.ping(), 30000);

    // Ví dụ: gửi dữ liệu quét
    client.sendScan('PRODUCT123456', 'Sản phẩm A', 'PROD001', 45, 0.95);

  } catch (error) {
    console.error('Failed to connect:', error);
  }
}

// Khởi động nếu là file chạy trực tiếp
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', setupQRScanner);
}
