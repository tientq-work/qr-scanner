# QR Code Scanner API - Realtime cho Băng Chuyền

API đọc mã QR realtime hiệu năng cao, được thiết kế cho hệ thống băng chuyền sản xuất.

## 🚀 Tính Năng

- **Realtime Scanning**: WebSocket hỗ trợ quét realtime
- **High Performance**: Xử lý nhiều mã QR nhanh chóng
- **Deduplication**: Tự động phát hiện và lọc quét trùng
- **Database**: SQLite lưu trữ tất cả dữ liệu quét
- **Statistics**: Thống kê chi tiết quét theo giờ, ngày
- **Multi-Camera**: Hỗ trợ nhiều camera cùng lúc
- **RESTful API**: Dễ tích hợp với hệ thống hiện tại

## 📦 Cài Đặt

```bash
# Clone hoặc tải project
cd "QR Scanner"

# Cài đặt dependencies
npm install

# Tạo file .env từ .env.example
copy .env.example .env

# Chạy server
npm start

# Hoặc chạy với hot-reload (development)
npm run dev
```

## 🔌 API Endpoints

### Quét QR Code

#### `POST /api/qr/scan`
Quét một mã QR từ ảnh

**Request:**
```json
{
  "imageData": "base64_encoded_image",
  "width": 640,
  "height": 480,
  "cameraId": "camera_1"
}
```

**Response:**
```json
{
  "success": true,
  "scanId": 1,
  "qrCode": "PRODUCT123456",
  "productName": "Sản phẩm A",
  "productId": "PROD001",
  "processingTime": 45,
  "confidence": 0.95,
  "timestamp": "2025-11-16T10:30:00.000Z"
}
```

#### `POST /api/qr/batch-scan`
Quét nhiều mã QR cùng lúc

**Request:**
```json
{
  "scans": ["QR001", "QR002", "QR003"],
  "cameraId": "camera_1"
}
```

**Response:**
```json
{
  "success": true,
  "processed": 3,
  "results": [
    {
      "scanId": 1,
      "qrCode": "QR001",
      "status": "success"
    },
    {
      "qrCode": "QR002",
      "status": "duplicate"
    },
    {
      "qrCode": "QR003",
      "status": "invalid"
    }
  ]
}
```

#### `GET /api/qr/recent`
Lấy danh sách QR gần đây

**Query Parameters:**
- `limit` (default: 50) - Số lượng tối đa
- `cameraId` (optional) - Lọc theo camera

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": 1,
      "qr_code": "PRODUCT123456",
      "product_name": "Sản phẩm A",
      "scan_time": "2025-11-16T10:30:00.000Z",
      "processing_time_ms": 45,
      "confidence": 0.95
    }
  ]
}
```

#### `GET /api/qr/:qrCode`
Lấy chi tiết một mã QR

#### `PUT /api/qr/:scanId/status`
Cập nhật trạng thái quét

**Request:**
```json
{
  "status": "processed"
}
```

### Thống Kê

#### `GET /api/stats`
Thống kê tổng hợp

**Query Parameters:**
- `cameraId` (optional)
- `days` (default: 1)

#### `GET /api/stats/hourly`
Thống kê theo giờ

**Query Parameters:**
- `hours` (default: 24)
- `cameraId` (optional)

#### `GET /api/stats/daily`
Thống kê theo ngày

**Query Parameters:**
- `days` (default: 30)
- `cameraId` (optional)

#### `GET /api/stats/cameras`
Danh sách camera

#### `GET /api/stats/top-products`
Sản phẩm quét nhiều nhất

**Query Parameters:**
- `limit` (default: 20)
- `days` (default: 7)

#### `GET /api/stats/performance`
Hiệu năng quét

## 🔌 WebSocket API

### Kết Nối

```javascript
const ws = new WebSocket('ws://localhost:3000/api/qr/stream?cameraId=camera_1');

ws.onopen = () => {
  console.log('Connected to QR Scanner');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'connected') {
    console.log('Client ID:', message.clientId);
  }
  
  if (message.type === 'scan_result') {
    console.log('New scan:', message.data);
  }
};
```

### Gửi Dữ Liệu Quét

```javascript
ws.send(JSON.stringify({
  type: 'scan',
  qrCode: 'PRODUCT123456',
  productName: 'Sản phẩm A',
  productId: 'PROD001',
  processingTime: 45,
  confidence: 0.95
}));
```

### Ping/Pong (Keep-alive)

```javascript
// Client gửi ping
ws.send(JSON.stringify({
  type: 'ping'
}));

// Server gửi pong
// {
//   type: 'pong',
//   timestamp: 1234567890
// }
```

## 💻 Ví Dụ Sử Dụng

### Node.js Client

```javascript
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:3000/api';

// Quét QR từ file ảnh
async function scanQRCode(imagePath, cameraId) {
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');

  try {
    const response = await axios.post(`${API_URL}/qr/scan`, {
      imageData: base64,
      width: 640,
      height: 480,
      cameraId: cameraId
    });

    console.log('Scan result:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Lấy thống kê
async function getStatistics() {
  try {
    const response = await axios.get(`${API_URL}/stats/performance`, {
      params: {
        hours: 24
      }
    });

    console.log('Performance stats:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

scanQRCode('./qr_image.jpg', 'camera_1');
getStatistics();
```

### Python Client

```python
import requests
import base64
import json

API_URL = 'http://localhost:3000/api'

def scan_qr_code(image_path, camera_id):
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    payload = {
        'imageData': image_data,
        'width': 640,
        'height': 480,
        'cameraId': camera_id
    }
    
    response = requests.post(f'{API_URL}/qr/scan', json=payload)
    print(json.dumps(response.json(), indent=2))

def get_recent_scans(limit=50):
    response = requests.get(f'{API_URL}/qr/recent', params={'limit': limit})
    print(json.dumps(response.json(), indent=2))

# Sử dụng
scan_qr_code('qr_image.jpg', 'camera_1')
get_recent_scans()
```

## 📊 Cấu Trúc Database

### Bảng: qr_scans
- `id` - ID duy nhất
- `qr_code` - Dữ liệu mã QR
- `product_name` - Tên sản phẩm
- `product_id` - ID sản phẩm
- `scan_time` - Thời gian quét
- `camera_id` - ID camera
- `status` - Trạng thái (new, processed, error)
- `processing_time_ms` - Thời gian xử lý (ms)
- `confidence` - Độ tin cậy (0-1)

### Bảng: scan_stats
- Thống kê quét theo camera và ngày

### Bảng: scan_errors
- Lưu trữ lỗi quét

## ⚡ Tối Ưu Hiệu Năng

1. **Deduplication Cache**: Tự động loại bỏ quét trùng trong 500ms
2. **Database Indexing**: Index tối ưu cho truy vấn nhanh
3. **Connection Pooling**: Tái sử dụng kết nối database
4. **WebSocket Streaming**: Truyền dữ liệu realtime hiệu quả
5. **Batch Processing**: Xử lý nhiều mã QR cùng lúc

## 📝 Configuration

Chỉnh sửa file `.env`:

```
PORT=3000              # Cổng API server
NODE_ENV=development   # Environment (development/production)
LOG_LEVEL=info         # Mức log (debug/info/warn/error)
DATABASE_PATH=./data/qr_scanner.db  # Đường dẫn database
```

## 📁 Cấu Trúc Thư Mục

```
QR Scanner/
├── server.js              # Entry point
├── package.json           # Dependencies
├── .env.example          # Environment template
├── services/
│   ├── database.js       # Database service
│   ├── qr-scanner.js     # QR scanning logic
│   └── websocket.js      # WebSocket handler
├── routes/
│   ├── qr-scanner.js     # QR API endpoints
│   └── stats.js          # Statistics endpoints
├── utils/
│   └── logger.js         # Logging utility
├── data/                 # Database storage
├── logs/                 # Log files
└── README.md            # Documentation
```

## 🔒 Bảo Mật

- Helmet.js cho security headers
- CORS enabled cho multi-domain
- Input validation trên tất cả API
- Database prepared statements

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs trong thư mục `logs/`
2. Database connection
3. Port availability
4. Node.js version (>= 12.0.0)

## 📄 License

MIT License
