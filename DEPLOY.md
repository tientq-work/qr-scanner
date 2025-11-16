# 🚀 Hướng Dẫn Deploy lên Vercel

## Các Bước Deploy

### 1. Chuẩn Bị
Đảm bảo bạn có:
- Git được cài đặt
- Vercel CLI được cài đặt
- Account Vercel (đăng ký miễn phí tại https://vercel.com)

### 2. Push code lên GitHub
```bash
# Tạo repository mới trên GitHub
# Sau đó chạy các lệnh sau trong thư mục dự án:

git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

### 3. Deploy lên Vercel - Cách 1: Web UI (Dễ Nhất)
1. Truy cập https://vercel.com/new
2. Click "Import Git Repository"
3. Chọn repository GitHub của bạn
4. Cấu hình:
   - **Framework**: Node.js
   - **Root Directory**: ./
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: (để trống hoặc thêm theo cần)
5. Click "Deploy"

### 4. Deploy lên Vercel - Cách 2: Vercel CLI (Command Line)
```bash
# Cài đặt Vercel CLI
npm install -g vercel

# Đăng nhập Vercel
vercel login

# Deploy (từ thư mục dự án)
cd "c:\Users\Admin\Desktop\QR Scanner"
vercel

# Deploy production
vercel --prod
```

### 5. Sau khi Deploy
- Vercel sẽ cấp cho bạn một URL: `https://<project-name>.vercel.app`
- Truy cập URL đó để kiểm tra ứng dụng

## Cấu Hình Vercel

File `vercel.json` đã được cấu hình với:
- **Runtime**: Node.js
- **Routes**: Tất cả request đi đến `server.js`
- **Environment**: Database path và NODE_ENV

## Lưu Ý Quan Trọng

### 1. Dữ Liệu Database
- SQLite database được lưu trong `/data` folder
- Trên Vercel, mỗi deployment sẽ có database mới (ephemeral)
- Để persist data, cần chuyển sang PostgreSQL hoặc MongoDB

**Giải pháp**: Thêm database bên ngoài
```bash
# Option 1: MongoDB Atlas (miễn phí 512MB)
vercel env add MONGODB_URI

# Option 2: PostgreSQL (Railway, Neon)
vercel env add DATABASE_URL
```

### 2. WebSocket Support
- Vercel hỗ trợ WebSocket trên Pro plan
- Miễn phí: WebSocket hoạt động nhưng có giới hạn

### 3. Port
- Vercel tự động chỉ định port thông qua `process.env.PORT`
- File `server.js` đã được cấu hình để sử dụng port này

### 4. Build & Deployment
- Mỗi push lên GitHub sẽ tự động deploy
- Build time: ~2-3 phút
- Logs hiển thị tại Vercel dashboard

## Tối Ưu Hóa cho Vercel

### 1. Giảm kích thước node_modules
```bash
npm prune --production
```

### 2. Thêm start script timeout
```json
"scripts": {
  "start": "timeout 30 node server.js || exit 0"
}
```

### 3. Health check endpoint (đã có)
- GET `/api/health` - kiểm tra server hoạt động

## Troubleshooting

### Error: "Cannot find module 'sqlite3'"
```bash
npm install --save sqlite3
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Error: "EACCES: permission denied"
- Xóa node_modules và package-lock.json
- Chạy `npm install` lại

### Port timeout trên Vercel
- Vercel yêu cầu server lắng nghe trên `process.env.PORT`
- File `server.js` đã được cấu hình (xem dòng: `const PORT = process.env.PORT || 3000`)

## Monitoring

Sau khi deploy:
1. Truy cập Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project
3. Xem:
   - **Deployments**: Lịch sử deploy
   - **Analytics**: Performance metrics
   - **Logs**: Server logs real-time
   - **Settings**: Cấu hình environment variables

## URL Ứng Dụng

Sau khi deploy thành công:
```
https://<project-name>.vercel.app
https://<project-name>.vercel.app/api/health
https://<project-name>.vercel.app/api/qr/recent
```

## Tiếp Theo

1. **Thêm Database Bên Ngoài** (tùy chọn)
   - MongoDB Atlas
   - PostgreSQL (Neon, Railway)
   - Firebase Realtime DB

2. **Custom Domain** (tùy chọn)
   - Thêm domain riêng trong Vercel Settings

3. **Environment Variables** (tùy chọn)
   - Set thông qua Vercel Dashboard
   - Hoặc file `.env.production`

4. **Auto Deployment**
   - Mỗi push lên GitHub → tự động deploy
   - Có thể rollback lại version cũ

## Hỗ Trợ Thêm

- **Vercel Docs**: https://vercel.com/docs
- **Node.js on Vercel**: https://vercel.com/docs/concepts/functions/serverless-functions/node-js
- **Troubleshooting**: https://vercel.com/docs/common-issues

---

**Chúc bạn deploy thành công! 🚀**
