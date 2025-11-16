# 🚀 Deploy lên Render.com - Hướng Dẫn Chi Tiết

## 📋 Tổng quan
- **Chi phí**: Miễn phí (Free tier)
- **Tốc độ**: ⭐⭐⭐⭐ (Rất nhanh)
- **Hỗ trợ**: SQLite, Node.js, Database
- **Auto-deploy**: Có (từ GitHub)
- **Thời gian deploy**: 2-3 phút

---

## 🎯 Bước 1: Tạo GitHub Repository

### Push code lên GitHub
```bash
cd "c:\Users\Admin\Desktop\QR Scanner"

# Tạo remote
git remote add origin https://github.com/<YOUR-USERNAME>/qr-scanner.git

# Set main branch
git branch -M main

# Push code
git push -u origin main
```

---

## 🎯 Bước 2: Tạo Render Account

1. Vào https://render.com
2. Click "Sign Up"
3. Sign up with GitHub (dễ nhất)
4. Authorize Render

---

## 🎯 Bước 3: Deploy lên Render

### Cách 1: Web UI (Dễ nhất)
1. Vào https://dashboard.render.com
2. Click "+ New" → "Web Service"
3. Chọn "GitHub" → "Connect GitHub"
4. Chọn repo `qr-scanner`
5. Điền form:

```
Name: qr-scanner
Region: Singapore (sgp)
Branch: main
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

6. Click "Create Web Service"

✅ Deploy sẽ bắt đầu!

---

## ⏳ Theo dõi Deploy

Vào Render Dashboard → Events tab
Chờ tới khi thấy:
```
==> Your service is live 🎉
```

**URL sẽ là**:
```
https://qr-scanner-xxxxx.onrender.com
```

---

## 🧪 Test

```bash
# Test API
curl https://qr-scanner-xxxxx.onrender.com/health

# Test Web
https://qr-scanner-xxxxx.onrender.com/lite.html
```

---

## 🔄 Update Code

```bash
git add .
git commit -m "Update something"
git push origin main
```

Render sẽ tự động deploy! ✅

---

## ⚠️ Lưu ý

- **SQLite**: Database sẽ bị reset nếu service restart
- **Performance**: Free tier có giới hạn RAM, OK cho testing
- **Uptime**: ~99% SLA trên free tier

---

**Render URL của bạn**: https://qr-scanner-xxxxx.onrender.com 🚀
