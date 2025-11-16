#!/bin/bash
# Setup script cho QR Scanner API

echo "🚀 QR Scanner API - Setup"
echo "========================="

# Tạo thư mục cần thiết
echo "📁 Creating directories..."
mkdir -p data logs services routes utils

# Cài đặt dependencies
echo "📦 Installing dependencies..."
npm install

# Tạo file .env
if [ ! -f .env ]; then
  echo "⚙️  Creating .env file..."
  cp .env.example .env
  echo ".env file created. Please configure it as needed."
fi

# Kiểm tra Node.js version
NODE_VERSION=$(node -v)
echo "✓ Node.js version: $NODE_VERSION"

# Hiển thị thông tin khởi động
echo ""
echo "✓ Setup completed!"
echo ""
echo "To start the server, run:"
echo "  npm start        - Production"
echo "  npm run dev      - Development (with auto-reload)"
echo ""
echo "Server will run on: http://localhost:3000"
echo "Health check: http://localhost:3000/health"
