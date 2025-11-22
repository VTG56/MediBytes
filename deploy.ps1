# MediBytes Quick Deployment Script for Windows PowerShell
# Run this after configuring .env files

Write-Host "🚀 MediBytes Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env files exist
$envFiles = @(
    "frontend\.env",
    "blockchain\.env",
    "ml-service\.env"
)

Write-Host "📝 Checking environment files..." -ForegroundColor Yellow
$allEnvExist = $true
foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing! Copy from .env.example" -ForegroundColor Red
        $allEnvExist = $false
    }
}

if (-not $allEnvExist) {
    Write-Host ""
    Write-Host "⚠️  Please create .env files before deploying!" -ForegroundColor Red
    Write-Host "   Run: cp .env.example .env (in each directory)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔧 Compiling smart contracts..." -ForegroundColor Yellow
Set-Location blockchain
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Compilation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Contracts compiled successfully" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Deploying to Polygon Mumbai Testnet..." -ForegroundColor Yellow
Write-Host "⏳ This may take 1-2 minutes..." -ForegroundColor Gray
npm run deploy:mumbai
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "   Make sure you have:" -ForegroundColor Yellow
    Write-Host "   1. Mumbai MATIC in your wallet" -ForegroundColor Yellow
    Write-Host "   2. Correct PRIVATE_KEY in blockchain/.env" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Contracts deployed successfully" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "📋 Reading deployed contract addresses..." -ForegroundColor Yellow
if (Test-Path "shared\contract-addresses.json") {
    $addresses = Get-Content "shared\contract-addresses.json" | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "📝 UPDATE YOUR frontend\.env WITH THESE ADDRESSES:" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "VITE_EHR_STORAGE_ADDRESS=$($addresses.PrivateEHRStorage)" -ForegroundColor Yellow
    Write-Host "VITE_ACCESS_CONTROL_ADDRESS=$($addresses.PrivateAccessControl)" -ForegroundColor Yellow
    Write-Host "VITE_ORGAN_REGISTRY_ADDRESS=$($addresses.OrganDonorRegistry)" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Cyan
    
    # Auto-update frontend .env if possible
    Write-Host ""
    $updateEnv = Read-Host "Would you like to auto-update frontend/.env? (y/n)"
    if ($updateEnv -eq 'y' -or $updateEnv -eq 'Y') {
        $envPath = "frontend\.env"
        $envContent = Get-Content $envPath
        
        $envContent = $envContent -replace "VITE_EHR_STORAGE_ADDRESS=.*", "VITE_EHR_STORAGE_ADDRESS=$($addresses.PrivateEHRStorage)"
        $envContent = $envContent -replace "VITE_ACCESS_CONTROL_ADDRESS=.*", "VITE_ACCESS_CONTROL_ADDRESS=$($addresses.PrivateAccessControl)"
        $envContent = $envContent -replace "VITE_ORGAN_REGISTRY_ADDRESS=.*", "VITE_ORGAN_REGISTRY_ADDRESS=$($addresses.OrganDonorRegistry)"
        
        $envContent | Set-Content $envPath
        Write-Host "✅ frontend/.env updated automatically" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Could not find contract addresses file" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Verify contract addresses in frontend/.env" -ForegroundColor White
Write-Host "  2. Start frontend:  cd frontend && npm run dev" -ForegroundColor White
Write-Host "  3. Start ML service: cd ml-service && python run.py" -ForegroundColor White
Write-Host "  4. Open http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔍 View transactions on Mumbai:" -ForegroundColor Cyan
Write-Host "   https://mumbai.polygonscan.com" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md" -ForegroundColor Gray
Write-Host ""
