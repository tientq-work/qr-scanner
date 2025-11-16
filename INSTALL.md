# QR Scanner - Hướng Dẫn Cài Đặt

## 📋 Yêu Cầu

- **Node.js** >= 12.0.0
- **npm** hoặc **yarn**
- **Camera** (cho quét realtime)
- **Port** 3000 (mặc định) - có thể thay đổi

## 🚀 Cài Đặt

### 1. Clone hoặc Tải Project
```bash
cd "QR Scanner"
```

### 2. Chạy Setup Script

**Trên Windows:**
```cmd
setup.bat
```

**Trên Mac/Linux:**
```bash
bash setup.sh
```

### 3. Cấu Hình (tuỳ chọn)

Chỉnh sửa file `.env`:
```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
DATABASE_PATH=./data/qr_scanner.db
```

## ▶️ Chạy Ứng Dụng

### Chế Độ Production
```bash
npm start
```

### Chế Độ Development (Auto-reload)
```bash
npm run dev
```

## 🌐 Truy Cập

**Web Interface:** http://localhost:3000
**API:** http://localhost:3000/api
**Health Check:** http://localhost:3000/health

## 📁 Cấu Trúc Thư Mục

```
QR Scanner/
├── public/                 # Web interface
│   ├── index.html         # Main page
│   ├── css/
│   │   └── styles.css     # Styles
│   └── js/
│       └── app.js         # Frontend logic
├── services/              # Backend services
│   ├── database.js        # Database operations
│   ├── qr-scanner.js      # QR scanning logic
│   └── websocket.js       # WebSocket handling
├── routes/                # API routes
│   ├── qr-scanner.js      # QR endpoints
│   └── stats.js           # Statistics endpoints
├── utils/
│   └── logger.js          # Logging
├── data/                  # Database (auto-created)
├── logs/                  # Log files (auto-created)
├── server.js              # Main server file
├── package.json           # Dependencies
└── .env.example          # Environment template
```

## 🎯 Tính Năng Chính

### 📷 Quét QR
- Quét từ camera realtime
- Nhập thủ công
- Batch scanning

### 📊 Thống Kê
- Hiệu năng realtime
- Biểu đồ quét theo giờ
- Top sản phẩm
- Danh sách camera

### 📜 Lịch Sử
- Danh sách quét
- Tìm kiếm
- Xuất CSV

### ⚙️ Cài Đặt
- Cấu hình API
- Cài đặt quét
- Kiểm tra kết nối

## 🔌 WebSocket URL

Kết nối WebSocket:
```
ws://localhost:3000/api/qr/stream?cameraId=camera_1
```

## 📡 API Endpoints

### Quét QR
```
POST /api/qr/scan
POST /api/qr/batch-scan
GET  /api/qr/recent
GET  /api/qr/:qrCode
PUT  /api/qr/:scanId/status
```

### Thống Kê
```
GET /api/stats
GET /api/stats/hourly
GET /api/stats/daily
GET /api/stats/cameras
GET /api/stats/top-products
GET /api/stats/performance
```

## 🔐 Bảo Mật

- CORS được cấu hình
- Helmet.js cho security headers
- Input validation
- Prepared statements

## 🐛 Troubleshooting

### Không thể kết nối
1. Kiểm tra server đang chạy: `npm start`
2. Kiểm tra port 3000 có sẵn sàng
3. Kiểm tra firewall

### Camera không hoạt động
1. Kiểm tra camera đã được cho phép
2. Thử refresh trang
3. Kiểm tra console (F12) có lỗi

### Database error
1. Kiểm tra thư mục `data/` có tồn tại
2. Xóa file `data/qr_scanner.db` để reset
3. Chạy lại server

## 📝 Logs

Xem logs:
```bash
# All logs
tail -f logs/combined.log

# Errors only
tail -f logs/error.log
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra file logs
2. Kiểm tra console (F12)
3. Đọc error message kỹ

## 📄 License

MIT License

---

**Phát triển bởi:** QR Scanner Team
**Version:** 1.0.0
**Last Updated:** 2025-11-16
