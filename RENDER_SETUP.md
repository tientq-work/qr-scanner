# 🚀 HƯỚNG DẪN DEPLOY LÊN RENDER - TỪNG BƯỚC

## 📌 Tóm Tắt Quy Trình
1. **Tạo GitHub account** (nếu chưa có)
2. **Tạo GitHub repository** cho QR Scanner
3. **Push code** lên GitHub
4. **Tạo Render account**
5. **Deploy** từ Render dashboard
6. **Test** ứng dụng

---

## 🎯 Bước 1: Tạo GitHub Account (Nếu Chưa Có)

1. Vào https://github.com/signup
2. Điền email, password, username
3. Verify email
4. ✅ Xong!

**Ghi nhớ USERNAME của bạn** (ví dụ: `tientq`)

---

## 🎯 Bước 2: Tạo Repository Trên GitHub

### Cách A: Web UI (Dễ nhất)
1. Vào https://github.com/new
2. Điền thông tin:
   ```
   Repository name: qr-scanner
   Description: QR Code Scanner API for Conveyor Belt Systems
   Public: ✅ (chọn)
   Add .gitignore: Node
   ```
3. Click "Create repository"

### Cách B: GitHub Desktop App
1. Download: https://desktop.github.com
2. File → New Repository
3. Điền `qr-scanner`
4. Chọn folder: `c:\Users\Admin\Desktop\QR Scanner`
5. Publish

---

## 🎯 Bước 3: Push Code Lên GitHub

### Option 1: Command Line (Terminal)

**Mở Terminal / Command Prompt**:
```bash
cd "c:\Users\Admin\Desktop\QR Scanner"
```

**Configure Git** (nếu chưa làm):
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@gmail.com"
```

**Add remote GitHub**:
```bash
git remote add origin https://github.com/<YOUR-USERNAME>/qr-scanner.git
```

**Thay `<YOUR-USERNAME>` bằng username GitHub bạn**

**Set main branch**:
```bash
git branch -M main
```

**Push code**:
```bash
git push -u origin main
```

Sẽ được hỏi GitHub credentials → Nhập username và personal token/password

---

### Option 2: GitHub Desktop
1. Open in GitHub Desktop
2. File → Add Local Repository
3. Chọn folder: `c:\Users\Admin\Desktop\QR Scanner`
4. Publish → Connect to GitHub
5. ✅ Code đã push!

---

## ✅ Verify Push Thành Công

Vào https://github.com/<YOUR-USERNAME>/qr-scanner

Bạn sẽ thấy:
- Tất cả files của project
- Branches: `main`
- Last commit: `Add render.yaml...`

---

## 🎯 Bước 4: Tạo Render Account

1. Vào https://render.com
2. Click "Get Started" hoặc "Sign Up"
3. **Chọn "Continue with GitHub"** (dễ nhất)
4. GitHub sẽ hỏi authorize → Click "Authorize"
5. ✅ Render account tạo xong!

---

## 🎯 Bước 5: Deploy Lên Render

### Vào Render Dashboard:
https://dashboard.render.com

### Create New Service:
1. Click **"+ New"** (góc trái)
2. Chọn **"Web Service"**
3. Chọn **"GitHub"** (GitHub)

### Authorize Render:
- Render sẽ hỏi access to GitHub
- Click "Authorize" → GitHub authorizes
- Render quay lại dashboard

### Select Repository:
- Chọn repo: **`qr-scanner`**
- Click "Connect"

### Configure Deployment:

**Điền form**:
```
📝 Name: qr-scanner
🌍 Region: Singapore (sgp)
🔀 Branch: main
⚙️ Runtime: Node
🔨 Build Command: npm install
▶️ Start Command: npm start
💰 Plan: Free
```

### Optional - Environment Variables:
Leave blank (không cần thêm)

### Create Web Service:
Click **"Create Web Service"**

---

## ⏳ Render đang Deploy!

Render sẽ:
1. Clone code từ GitHub
2. Cài npm packages
3. Run `npm start`
4. Start server

### Theo dõi tiến độ:

Vào tab **"Events"** - bạn sẽ thấy logs:
```
Building...
npm install (downloading packages)
...
QR Scanner API running on port 3000
==> Your service is live 🎉
```

**Chờ tới khi thấy dòng cuối "live" là xong!**

---

## ✅ Deploy Xong!

### URL của ứng dụng:
```
https://qr-scanner-xxxxx.onrender.com
```

**(Thay `xxxxx` bằng ID riêng của bạn)**

---

## 🧪 Test Ứng Dụng

### Test Lite Version (Nhanh):
```
https://qr-scanner-xxxxx.onrender.com/lite.html
```

### Test Full Version:
```
https://qr-scanner-xxxxx.onrender.com
```

### Test API:
```bash
# Terminal/PowerShell
curl https://qr-scanner-xxxxx.onrender.com/health

# Hoặc vào browser:
https://qr-scanner-xxxxx.onrender.com/health
```

Response sẽ là:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T...",
  "environment": "production"
}
```

---

## 🔄 Update Code

**Khi bạn muốn update ứng dụng**:

```bash
# 1. Sửa code locally
# (ví dụ: fix bug, thêm feature)

# 2. Commit
git add .
git commit -m "Fix something"

# 3. Push lên GitHub
git push origin main

# 4. Render sẽ auto-deploy
# (Check Events tab trong Render)
```

✅ **Auto-deploy** - Render sẽ tự động build lại khi có push!

---

## ⚠️ Lưu Ý Quan Trọng

### SQLite Database
- Database file sẽ nằm ở `/data/qr_scanner.db`
- **CẢNH BÁO**: Sẽ bị XÓA nếu Render restart service
- Nếu muốn persistent data → Thêm PostgreSQL

### Performance
- Free tier: OK cho testing/demo
- Max 750 hours/tháng
- Hibernate nếu không dùng 15 phút

### Custom Domain (Tùy chọn)
1. Render dashboard → Settings
2. Custom Domain
3. Add domain của bạn
4. Point DNS từ registrar của bạn

---

## 🆘 Troubleshooting

### Deploy fail?
- Check "Events" tab → xem logs lỗi
- Verify GitHub access
- Verify `npm start` command

### App không load?
- Refresh browser
- Check Render status page

### Slow performance?
- Free tier có giới hạn RAM
- Upgrade plan nếu cần

---

## 📞 Cần Giúp?

- **Render Docs**: https://render.com/docs
- **This Guide**: Xem file `RENDER_DEPLOY.md`
- **GitHub Issues**: https://github.com

---

## 🎉 HOÀN TẤT!

Ứng dụng QR Scanner của bạn đã live trên Render! 🚀

**Chia sẻ URL**:
```
https://qr-scanner-xxxxx.onrender.com/lite.html
```

---

**Bạn làm xong chưa? Cho biết URL nếu đã deploy! 👈**
