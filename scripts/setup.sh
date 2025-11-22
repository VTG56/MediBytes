#!/bin/bash

# MediBytes Setup Script
echo "================================"
echo "   MediBytes Setup Script"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install Frontend Dependencies
echo "📦 Installing Frontend dependencies..."
cd frontend
npm install
cd ..
echo "✅ Frontend dependencies installed"
echo ""

# Install Blockchain Dependencies
echo "📦 Installing Blockchain dependencies..."
cd blockchain
npm install
cd ..
echo "✅ Blockchain dependencies installed"
echo ""

# Install ML Service Dependencies
echo "📦 Installing ML Service dependencies..."
cd ml-service
python3 -m pip install -r requirements.txt
cd ..
echo "✅ ML Service dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "================================"
echo "   Setup Complete! 🎉"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start local blockchain: cd blockchain && npm run node"
echo "3. Deploy contracts: cd blockchain && npm run deploy:local"
echo "4. Start ML service: cd ml-service && python run.py"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
