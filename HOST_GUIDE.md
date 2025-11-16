# 🚀 Deploy QR Scanner - Các Platform Khác

## 1. **Render.com** ⭐ (Recommended - Miễn phí + Nhanh)

### Bước 1: Push lên GitHub
```bash
git remote add origin https://github.com/<username>/<repo-qr-scanner>
git branch -M main
git push -u origin main
```

### Bước 2: Deploy lên Render
1. Vào https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub → Select repository
4. Cấu hình:
   - **Name**: `qr-scanner`
   - **Region**: Singapore
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click "Create Web Service"

✅ URL sẽ là: `https://qr-scanner-xxxxx.onrender.com`

---

## 2. **Heroku** (Cũ nhưng vẫn dùng được)

```bash
# Cài Heroku CLI
choco install heroku-cli

# Login
heroku login

# Create app
heroku create qr-scanner

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

✅ URL: `https://qr-scanner.herokuapp.com`

---

## 3. **Railway.app** (Tốt + Miễn phí $5/tháng)

```bash
# Login (nếu account chưa hết trial)
railway login

# Link project
railway link

# Deploy
railway up
```

---

## 4. **Google Cloud Run** (Miễn phí + Mạnh)

### Tạo Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Deploy
```bash
# Cài Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

gcloud auth login
gcloud config set project PROJECT_ID
gcloud run deploy qr-scanner \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated
```

---

## 5. **DigitalOcean App Platform** (Miễn phí trial $200/2 tháng)

1. Vào https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect GitHub repository
4. Select branch: `main`
5. Auto-detect: Node.js
6. Click "Create Resources"

---

## 6. **AWS Elastic Beanstalk** (Free tier có giới hạn)

```bash
# Cài EB CLI
pip install awsebcli

# Init
eb init -p node.js-18 qr-scanner

# Create environment
eb create qr-scanner-env

# Deploy
eb deploy
```

---

## 7. **Linode** (VPS - $5/tháng)

1. Tạo Linode instance (Ubuntu 22.04)
2. SSH vào server
3. Setup Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. Clone repository:
```bash
git clone https://github.com/<username>/qr-scanner.git
cd qr-scanner
npm install
npm start
```

5. Setup reverse proxy với Nginx/PM2

---

## 8. **Chạy Locally + Expose qua Ngrok**

```bash
# Terminal 1: Start app
npm start

# Terminal 2: Expose qua Ngrok
npx ngrok http 3000
```

✅ URL: `https://xxxxx.ngrok.io` (tạm thời, thay đổi mỗi khi restart)

---

## 🎯 Lựa chọn tốt nhất:

| Platform | Chi phí | Tốc độ | Hỗ trợ SQLite | Khó độ |
|----------|--------|--------|---------------|--------|
| **Render** | Miễn phí | ⭐⭐⭐⭐ | ✅ | Dễ |
| **Railway** | $5/tháng | ⭐⭐⭐⭐ | ✅ | Dễ |
| **Google Cloud Run** | Miễn phí | ⭐⭐⭐⭐⭐ | ✅ | Trung bình |
| **Heroku** | Trả phí | ⭐⭐⭐ | ✅ | Dễ |
| **Linode** | $5/tháng | ⭐⭐⭐⭐⭐ | ✅ | Khó |

**👉 Khuyến nghị: Render.com (dễ nhất + miễn phí + nhanh)**

---

## 📝 Các lệnh chung:

```bash
# Build locally
npm install
npm start

# Test trước khi deploy
# Truy cập: http://localhost:3000

# Commit và push
git add .
git commit -m "Ready to deploy"
git push
```

---

## ❓ Cần giúp?

1. **Render**: https://render.com/docs
2. **Railway**: https://docs.railway.app/
3. **Google Cloud**: https://cloud.google.com/docs
4. **Heroku**: https://devcenter.heroku.com/

---

**Lựa chọn platform nào? 👇**
