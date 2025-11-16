# Nếu Vercel vẫn gặp vấn đề, hãy thử các platform khác:

## 1. Railway.app (Dễ nhất + Free tier $5/tháng)
```bash
npm install -g railway
railway login
railway init
railway up
# Hoặc link GitHub: https://railway.app
```

## 2. Fly.io (Miễn phí tier + tốt cho Node.js)
```bash
npm install -g flyctl
flyctl auth login
flyctl launch
flyctl deploy
```

## 3. Render.com (Free tier + SQLite hỗ trợ tốt)
```bash
# Kéo repo GitHub -> https://render.com
# Choose Node.js, set build/start commands
```

## 4. Heroku (Không có free tier nữa nhưng mạnh)
```bash
npm install -g heroku
heroku login
heroku create qr-scanner
heroku config:set NODE_ENV=production
git push heroku main
```

## 5. Chạy locally + expose qua Ngrok
```bash
npm start
# Terminal khác:
npx ngrok http 3000
```

---

**Lựa chọn tốt nhất:** Railway hoặc Fly.io (miễn phí + ổn định)
