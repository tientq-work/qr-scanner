@echo off
REM Vercel Deployment Quick Setup

echo 🚀 QR Scanner - Vercel Deployment Setup
echo =======================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI không được cài đặt
    echo 📦 Cài đặt Vercel CLI...
    call npm install -g vercel
)

REM Check if Git is initialized
if not exist .git (
    echo 📦 Khởi tạo Git repository...
    call git init
    call git add .
    call git commit -m "Initial commit for Vercel deployment"
)

echo.
echo ✅ Chuẩn bị xong!
echo.
echo 📝 Các bước tiếp theo:
echo.
echo 1️⃣  Push lên GitHub (nếu chưa có):
echo    git remote add origin https://github.com/^<username^>/^<repo^>
echo    git branch -M main
echo    git push -u origin main
echo.
echo 2️⃣  Deploy lên Vercel:
echo    vercel login
echo    vercel --prod
echo.
echo 3️⃣  Hoặc vào https://vercel.com/new để import repository
echo.
echo 📖 Chi tiết xem DEPLOY.md
echo.
pause
