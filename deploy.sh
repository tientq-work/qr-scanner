#!/bin/bash
# Vercel Deployment Quick Setup

echo "🚀 QR Scanner - Vercel Deployment Setup"
echo "======================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI không được cài đặt"
    echo "📦 Cài đặt Vercel CLI..."
    npm install -g vercel
fi

# Check if Git is initialized
if [ ! -d .git ]; then
    echo "📦 Khởi tạo Git repository..."
    git init
    git add .
    git commit -m "Initial commit for Vercel deployment"
fi

echo ""
echo "✅ Chuẩn bị xong!"
echo ""
echo "📝 Các bước tiếp theo:"
echo ""
echo "1️⃣  Push lên GitHub (nếu chưa có):"
echo "   git remote add origin https://github.com/<username>/<repo>"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "2️⃣  Deploy lên Vercel:"
echo "   vercel login"
echo "   vercel --prod"
echo ""
echo "3️⃣  Hoặc vào https://vercel.com/new để import repository"
echo ""
echo "📖 Chi tiết xem DEPLOY.md"
echo ""
