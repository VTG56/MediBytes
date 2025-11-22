#!/bin/bash
# MediBytes Quick Deployment Script for Linux/Mac

echo "🚀 MediBytes Deployment Script"
echo "================================"
echo ""

# Check if .env files exist
echo "📝 Checking environment files..."
ENV_FILES=("frontend/.env" "blockchain/.env" "ml-service/.env")
ALL_ENV_EXIST=true

for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing! Copy from .env.example"
        ALL_ENV_EXIST=false
    fi
done

if [ "$ALL_ENV_EXIST" = false ]; then
    echo ""
    echo "⚠️  Please create .env files before deploying!"
    echo "   Run: cp .env.example .env (in each directory)"
    exit 1
fi

echo ""
echo "🔧 Compiling smart contracts..."
cd blockchain
npm run compile
if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi
echo "✅ Contracts compiled successfully"

echo ""
echo "🚀 Deploying to Polygon Mumbai Testnet..."
echo "⏳ This may take 1-2 minutes..."
npm run deploy:mumbai
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    echo "   Make sure you have:"
    echo "   1. Mumbai MATIC in your wallet"
    echo "   2. Correct PRIVATE_KEY in blockchain/.env"
    exit 1
fi
echo "✅ Contracts deployed successfully"

cd ..

echo ""
echo "📋 Reading deployed contract addresses..."
if [ -f "shared/contract-addresses.json" ]; then
    EHR_ADDRESS=$(jq -r '.PrivateEHRStorage' shared/contract-addresses.json)
    ACCESS_ADDRESS=$(jq -r '.PrivateAccessControl' shared/contract-addresses.json)
    ORGAN_ADDRESS=$(jq -r '.OrganDonorRegistry' shared/contract-addresses.json)
    
    echo ""
    echo "📝 UPDATE YOUR frontend/.env WITH THESE ADDRESSES:"
    echo "================================================"
    echo "VITE_EHR_STORAGE_ADDRESS=$EHR_ADDRESS"
    echo "VITE_ACCESS_CONTROL_ADDRESS=$ACCESS_ADDRESS"
    echo "VITE_ORGAN_REGISTRY_ADDRESS=$ORGAN_ADDRESS"
    echo "================================================"
    
    # Auto-update frontend .env
    echo ""
    read -p "Would you like to auto-update frontend/.env? (y/n) " UPDATE_ENV
    if [ "$UPDATE_ENV" = "y" ] || [ "$UPDATE_ENV" = "Y" ]; then
        sed -i "s/VITE_EHR_STORAGE_ADDRESS=.*/VITE_EHR_STORAGE_ADDRESS=$EHR_ADDRESS/" frontend/.env
        sed -i "s/VITE_ACCESS_CONTROL_ADDRESS=.*/VITE_ACCESS_CONTROL_ADDRESS=$ACCESS_ADDRESS/" frontend/.env
        sed -i "s/VITE_ORGAN_REGISTRY_ADDRESS=.*/VITE_ORGAN_REGISTRY_ADDRESS=$ORGAN_ADDRESS/" frontend/.env
        echo "✅ frontend/.env updated automatically"
    fi
else
    echo "⚠️  Could not find contract addresses file"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "📚 Next Steps:"
echo "  1. Verify contract addresses in frontend/.env"
echo "  2. Start frontend:  cd frontend && npm run dev"
echo "  3. Start ML service: cd ml-service && python run.py"
echo "  4. Open http://localhost:5173"
echo ""
echo "🔍 View transactions on Mumbai:"
echo "   https://mumbai.polygonscan.com"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
