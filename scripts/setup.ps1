# MediBytes Setup Script for Windows
# Run this in PowerShell

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   MediBytes Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✅ Python $pythonVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed. Please install Python 3.10+ first." -ForegroundColor Red
    Write-Host "Download from: https://www.python.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Install Frontend Dependencies
Write-Host "📦 Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host ""

# Install Blockchain Dependencies
Write-Host "📦 Installing Blockchain dependencies..." -ForegroundColor Yellow
Set-Location blockchain
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Blockchain dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install blockchain dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host ""

# Install ML Service Dependencies
Write-Host "📦 Installing ML Service dependencies..." -ForegroundColor Yellow
Write-Host "⚠️  This may take several minutes..." -ForegroundColor Yellow
Set-Location ml-service
python -m pip install -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ML Service dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install ML service dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host ""

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ .env file created. Please update it with your configuration." -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env file already exists" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Setup Complete! 🎉" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env file with your configuration" -ForegroundColor White
Write-Host "2. Start local blockchain:" -ForegroundColor White
Write-Host "   cd blockchain; npm run node" -ForegroundColor Gray
Write-Host "3. Deploy contracts (in new terminal):" -ForegroundColor White
Write-Host "   cd blockchain; npm run deploy:local" -ForegroundColor Gray
Write-Host "4. Start ML service (in new terminal):" -ForegroundColor White
Write-Host "   cd ml-service; python run.py" -ForegroundColor Gray
Write-Host "5. Start frontend (in new terminal):" -ForegroundColor White
Write-Host "   cd frontend; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Access the app at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
