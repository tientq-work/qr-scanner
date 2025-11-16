# 📱 QR Scanner - Deploy Lên Render.com

## 🚀 3 Bước Chính:

### 1️⃣ PUSH CODE LÊN GITHUB
```bash
cd "c:\Users\Admin\Desktop\QR Scanner"

git remote add origin https://github.com/YOUR-USERNAME/qr-scanner.git
git branch -M main
git push -u origin main
```

**Sau này chỉ cần**:
```bash
git push
```

---

### 2️⃣ TẠO RENDER ACCOUNT
- Vào https://render.com
- "Sign Up with GitHub"
- Authorize Render

---

### 3️⃣ DEPLOY
- Vào https://dashboard.render.com
- "+ New" → "Web Service"
- Connect GitHub → Select `qr-scanner`
- Điền:
  ```
  Name: qr-scanner
  Region: Singapore
  Branch: main
  Build: npm install
  Start: npm start
  Plan: Free
  ```
- Click "Create Web Service"
- ✅ **XONG!**

---

## 📊 Quá Trình:
1. GitHub: Push code (60 giây)
2. Render: Clone & Build (30-60 giây)
3. Deploy: Start server (20-30 giây)
4. **Live**: ✅ (tổng 2-3 phút)

---

## ✅ Kết Quả:
```
URL: https://qr-scanner-xxxxx.onrender.com
```

**Test**: 
- https://qr-scanner-xxxxx.onrender.com/lite.html
- https://qr-scanner-xxxxx.onrender.com/health

---

## 🔄 Update Sau Này:
```bash
git add .
git commit -m "Your message"
git push
```

Render **tự động deploy** lại! ✅

---

## 📌 File Hướng Dẫn:
- `RENDER_SETUP.md` - Chi tiết từng bước
- `RENDER_DEPLOY.md` - Tham khảo thêm
- `HOST_GUIDE.md` - Các option khác

---

**Bắt đầu từ Bước 1 trên! 👆**
