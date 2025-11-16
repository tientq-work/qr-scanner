@echo off
REM Setup script cho QR Scanner API (Windows)

echo.
echo 🚀 QR Scanner API - Setup
echo =========================
echo.

REM Tạo thư mục cần thiết
echo 📁 Creating directories...
if not exist data mkdir data
if not exist logs mkdir logs
if not exist services mkdir services
if not exist routes mkdir routes
if not exist utils mkdir utils

REM Cài đặt dependencies
echo 📦 Installing dependencies...
call npm install

REM Tạo file .env
if not exist .env (
  echo ⚙️  Creating .env file...
  copy .env.example .env
  echo .env file created. Please configure it as needed.
)

REM Kiểm tra Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js version: %NODE_VERSION%

echo.
echo ✓ Setup completed!
echo.
echo To start the server, run:
echo   npm start        - Production
echo   npm run dev      - Development (with auto-reload)
echo.
echo Server will run on: http://localhost:3000
echo Health check: http://localhost:3000/health
echo.
pause
