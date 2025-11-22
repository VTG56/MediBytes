# MediBytes Backend - Complete Setup Guide

## Overview

This guide walks you through setting up the MediBytes backend from scratch.

## Prerequisites Checklist

- [ ] Python 3.10 or higher installed
- [ ] Git installed
- [ ] Tesseract OCR installed
- [ ] Supabase account created
- [ ] Pinata account created
- [ ] OpenAI API key obtained
- [ ] MetaMask wallet with Polygon Amoy MATIC

## Step-by-Step Setup

### 1. Install Tesseract OCR

**Windows:**
1. Download installer: https://github.com/UB-Mannheim/tesseract/wiki
2. Run installer (recommended path: `C:\Program Files\Tesseract-OCR`)
3. Add to PATH:
   - Search "Environment Variables" in Windows
   - Edit System PATH
   - Add: `C:\Program Files\Tesseract-OCR`
4. Verify: `tesseract --version`

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install tesseract-ocr
```

### 2. Clone & Navigate

```bash
cd d:/BMS/medibytes/backend
```

### 3. Create Virtual Environment (Recommended)

```bash
# Create venv
python -m venv venv

# Activate
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Windows CMD:
venv\Scripts\activate.bat

# macOS/Linux:
source venv/bin/activate
```

### 4. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- FastAPI + Uvicorn (web framework)
- Supabase (database & auth)
- Web3.py (blockchain)
- OpenAI (AI analysis)
- Pytesseract (OCR)
- And more...

### 5. Set Up Supabase

#### A. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Wait for provisioning (~2 minutes)
4. Note your project URL and API keys

#### B. Create Database Tables

Go to SQL Editor in Supabase and run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    dob DATE NOT NULL,
    gender TEXT,
    blockchain_address TEXT,
    role TEXT DEFAULT 'patient',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Doctors table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    license_number TEXT NOT NULL,
    specialization TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pending reports (awaiting doctor approval)
CREATE TABLE pending_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    document_hash TEXT NOT NULL,
    ipfs_cid TEXT NOT NULL,
    report_type TEXT NOT NULL,
    report_date DATE,
    facility TEXT,
    symptoms TEXT,
    ai_summary TEXT,
    risk_level TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by TEXT,
    approved_at TIMESTAMP,
    rejected_by TEXT,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    blockchain_tx TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Access permissions
CREATE TABLE access_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_address TEXT NOT NULL,
    doctor_address TEXT NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
    expires_at TIMESTAMP,
    approved_at TIMESTAMP,
    revoked_at TIMESTAMP,
    blockchain_tx TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(patient_address, doctor_address)
);

-- Indexes for performance
CREATE INDEX idx_pending_reports_patient ON pending_reports(patient_id);
CREATE INDEX idx_pending_reports_status ON pending_reports(status);
CREATE INDEX idx_access_permissions_patient ON access_permissions(patient_address);
CREATE INDEX idx_access_permissions_doctor ON access_permissions(doctor_address);
CREATE INDEX idx_access_permissions_status ON access_permissions(status);
```

#### C. Configure Auth Settings

1. Go to Authentication > Settings
2. Enable Email provider
3. Disable email confirmations (for testing) OR configure email templates
4. Set JWT expiry (default: 1 hour)

### 6. Get Pinata Credentials

1. Go to https://pinata.cloud
2. Sign up for free account
3. Go to API Keys
4. Click "New Key"
5. Enable permissions:
   - ✅ pinFileToIPFS
   - ✅ pinJSONToIPFS
   - ✅ unpin
6. Copy:
   - API Key
   - API Secret
   - JWT token

### 7. Get OpenAI API Key

1. Go to https://platform.openai.com
2. Sign up / Log in
3. Go to API Keys
4. Create new secret key
5. Copy key (starts with `sk-...`)

### 8. Set Up Admin Wallet

You need a wallet that the backend will use to mediate patient blockchain operations.

**Option A: Create New Wallet**
```bash
# Run in Python
from web3 import Web3
w3 = Web3()
account = w3.eth.account.create()
print(f"Address: {account.address}")
print(f"Private Key: {account.key.hex()}")
```

**Option B: Use Existing Wallet**
- Export private key from MetaMask
- Never use your main wallet - create a dedicated one!

**Get Testnet MATIC:**
1. Go to https://faucet.polygon.technology/
2. Select Polygon Amoy
3. Enter admin wallet address
4. Get free testnet MATIC

### 9. Copy Smart Contract ABI

```bash
# From project root
cp contracts/artifacts/MedicalRecordSystem.json backend/contracts/

# If contracts folder doesn't exist:
mkdir backend/contracts
```

### 10. Configure Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit .env (use notepad, VS Code, or any text editor)
```

Fill in the values:

```env
# Server
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# Blockchain
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
CHAIN_ID=80002
MEDICAL_RECORD_CONTRACT_ADDRESS=0x745d52A59140ec1A6dEeeE38687256f8e3533845

# Admin Wallet (backend wallet)
ADMIN_PRIVATE_KEY=0x1234...your-private-key
ADMIN_WALLET_ADDRESS=0xABCD...your-wallet-address

# Pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PINATA_GATEWAY=https://gateway.pinata.cloud

# OpenAI
OPENAI_API_KEY=sk-...your-openai-key
OPENAI_MODEL=gpt-4

# Security
MASTER_ENCRYPTION_KEY=your-super-secret-encryption-key-min-32-chars

# File Upload
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=.pdf,.png,.jpg,.jpeg
```

### 11. Verify Setup

Run the setup checker:

```bash
python start.py
```

It will check:
- ✅ Python version
- ✅ Tesseract installation
- ✅ .env file
- 📦 Install dependencies
- 🚀 Start server

### 12. Test the API

Once server is running, test these endpoints:

**Health Check:**
```bash
curl http://localhost:8000/health
```

**API Documentation:**
Open in browser: http://localhost:8000/docs

### 13. Test with Frontend

1. Make sure frontend is configured to point to `http://localhost:8000`
2. Start frontend: `cd frontend && npm run dev`
3. Test patient registration
4. Test doctor wallet login
5. Upload a medical report

## Common Issues & Solutions

### Issue: "Tesseract not found"

**Solution:**
```python
# Add to services/ai_analysis.py after imports:
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Issue: "Cannot connect to Supabase"

**Solutions:**
- Verify URL and keys in .env
- Check if tables exist in Supabase
- Ensure no trailing slashes in SUPABASE_URL

### Issue: "Blockchain connection failed"

**Solutions:**
- Verify RPC URL is working: `curl https://rpc-amoy.polygon.technology`
- Check contract address is correct
- Ensure admin wallet has MATIC for gas

### Issue: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Issue: "CORS error from frontend"

**Solution:**
Add frontend URL to CORS_ORIGINS in .env:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Issue: "OpenAI rate limit"

**Solution:**
- Check your OpenAI account usage
- Add payment method if on free tier
- Reduce AI analysis frequency

## Production Deployment

### Environment Variables

Set these in production:
```env
# Security
JWT_SECRET=<generate-new-strong-secret>
MASTER_ENCRYPTION_KEY=<generate-new-strong-key>

# CORS - add your production domain
CORS_ORIGINS=https://yourdomain.com

# Database - use production Supabase project

# Blockchain - switch to mainnet
BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
CHAIN_ID=137
```

### Run with Gunicorn

```bash
gunicorn main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### Docker Deployment

```dockerfile
FROM python:3.10-slim

# Install Tesseract
RUN apt-get update && \
    apt-get install -y tesseract-ocr && \
    apt-get clean

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Security Checklist

- [ ] .env file in .gitignore
- [ ] Strong JWT secret (min 32 chars)
- [ ] Admin private key secured
- [ ] CORS restricted to known origins
- [ ] Rate limiting enabled
- [ ] File upload size limits enforced
- [ ] Input validation on all endpoints
- [ ] HTTPS in production
- [ ] Supabase RLS policies enabled
- [ ] Regular security updates

## Next Steps

1. ✅ Backend running
2. Connect frontend to backend
3. Test complete user flows
4. Add monitoring (Sentry, LogRocket)
5. Set up CI/CD
6. Deploy to production

## Support

If you encounter issues:
1. Check logs in console
2. Review .env configuration
3. Test each service independently
4. Check GitHub issues
5. Contact support

## Architecture Diagram

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ HTTP/REST
       │
┌──────▼──────┐
│   FastAPI   │
│   Backend   │
└──────┬──────┘
       │
   ┌───┴────────────┬──────────────┬──────────────┐
   │                │              │              │
┌──▼───┐     ┌─────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
│ Auth │     │ Blockchain│  │   IPFS   │  │    AI    │
│      │     │  (Web3)   │  │ (Pinata) │  │ (OpenAI) │
└──────┘     └───────────┘  └──────────┘  └──────────┘
   │
   │ Supabase
   │
┌──▼───────┐
│ Database │
│ (Postgres)│
└──────────┘
```

Happy coding! 🚀
