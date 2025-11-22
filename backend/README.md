# MediBytes Backend API

FastAPI backend for the MediBytes decentralized healthcare platform.

## Features

- 🔐 **Hybrid Authentication**: JWT for patients, wallet verification for doctors
- ⛓️ **Blockchain Integration**: Web3.py with Polygon Amoy testnet
- 📦 **IPFS Storage**: Pinata integration for medical records
- 🤖 **AI Analysis**: OCR + OpenAI GPT-4 for health insights
- 💾 **Database**: Supabase PostgreSQL
- 📄 **Auto Docs**: FastAPI Swagger UI at `/docs`

## Tech Stack

- **FastAPI** 0.109.0 - Modern Python web framework
- **Supabase** 2.3.4 - Authentication & database
- **Web3.py** 6.15.1 - Blockchain interactions
- **OpenAI** 1.10.0 - AI analysis
- **Pytesseract** 0.3.10 - OCR
- **Pinata** - IPFS file storage

## Prerequisites

- Python 3.10+
- Tesseract OCR installed
- Supabase account
- Pinata account
- OpenAI API key
- Polygon Amoy RPC access

## Installation

### 1. Install Tesseract OCR

**Windows:**
```bash
# Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
# Add to PATH: C:\Program Files\Tesseract-OCR
```

**macOS:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt install tesseract-ocr
```

### 2. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
```

### 4. Set Up Supabase Database

Create these tables in your Supabase project:

```sql
-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    license_number TEXT NOT NULL,
    specialization TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pending reports (doctor approval workflow)
CREATE TABLE pending_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    document_hash TEXT NOT NULL,
    ipfs_cid TEXT NOT NULL,
    report_type TEXT NOT NULL,
    report_date DATE,
    facility TEXT,
    symptoms TEXT,
    ai_summary TEXT,
    risk_level TEXT,
    status TEXT DEFAULT 'pending',
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_address TEXT NOT NULL,
    doctor_address TEXT NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'pending',
    expires_at TIMESTAMP,
    approved_at TIMESTAMP,
    revoked_at TIMESTAMP,
    blockchain_tx TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pending_reports_patient ON pending_reports(patient_id);
CREATE INDEX idx_pending_reports_status ON pending_reports(status);
CREATE INDEX idx_access_permissions_patient ON access_permissions(patient_address);
CREATE INDEX idx_access_permissions_doctor ON access_permissions(doctor_address);
```

### 5. Add Smart Contract ABI

```bash
# Copy contract ABI to backend
mkdir -p backend/contracts
cp ../contracts/artifacts/MedicalRecordSystem.json backend/contracts/
```

## Running the Server

### Development Mode

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### With Gunicorn (Production)

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health status

### Authentication
- `POST /api/auth/patient/register` - Register patient
- `POST /api/auth/patient/login` - Patient login
- `POST /api/auth/doctor/verify-wallet` - Doctor wallet verification

### Patient Operations
- `POST /api/patient/upload-report` - Upload medical report
- `GET /api/patient/reports` - Get patient reports
- `GET /api/patient/access-requests` - Get access requests
- `POST /api/patient/approve-access` - Approve doctor access
- `POST /api/patient/revoke-access` - Revoke doctor access

### Doctor Operations
- `GET /api/doctor/pending-approvals` - Get pending reports
- `POST /api/doctor/approve-report/{report_id}` - Approve report
- `POST /api/doctor/confirm-approval/{report_id}` - Confirm blockchain approval
- `POST /api/doctor/reject-report/{report_id}` - Reject report
- `POST /api/doctor/request-access` - Request patient access

### Verification
- `POST /api/verify/document` - Verify document
- `GET /api/verify/hash/{document_hash}` - Verify by hash

## API Documentation

Interactive API docs available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/service key
- `BLOCKCHAIN_RPC_URL` - Polygon RPC endpoint
- `MEDICAL_RECORD_CONTRACT_ADDRESS` - Deployed contract address
- `ADMIN_PRIVATE_KEY` - Backend wallet for patient operations
- `PINATA_JWT` - Pinata API JWT token
- `OPENAI_API_KEY` - OpenAI API key

## Architecture

```
backend/
├── main.py              # FastAPI application
├── config.py            # Configuration settings
├── models.py            # Pydantic data models
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
└── services/
    ├── __init__.py
    ├── auth.py          # Authentication service
    ├── blockchain.py    # Web3 integration
    ├── ipfs.py          # IPFS/Pinata service
    ├── ai_analysis.py   # OCR + AI analysis
    └── database.py      # Supabase operations
```

## Service Architecture

### Authentication Flow (Patients)
1. Patient registers with email/password
2. Supabase creates auth user
3. Backend generates deterministic blockchain address
4. Backend registers patient on-chain (admin wallet)
5. JWT token issued for API access

### Authentication Flow (Doctors)
1. Doctor connects MetaMask wallet
2. Signs message with private key
3. Backend verifies signature
4. Checks if wallet is registered on-chain
5. JWT token issued with wallet address

### Report Upload Flow
1. Patient uploads medical report (PDF/image)
2. Backend performs OCR extraction
3. OpenAI analyzes health data
4. File encrypted with patient key
5. Uploaded to Pinata IPFS
6. Stored as PENDING in database
7. Awaits doctor approval

### Doctor Approval Flow
1. Doctor reviews pending report
2. Approves via frontend
3. Backend adds record to blockchain
4. Database status updated to APPROVED
5. Patient notified

### Access Control Flow
1. Doctor requests access to patient records
2. Request stored in database
3. Patient approves via UI
4. Backend calls `approveAccess()` on-chain
5. Doctor can now view records

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=. --cov-report=html
```

## Troubleshooting

### Tesseract Not Found
```bash
# Add to PATH or set in code
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Blockchain Connection Issues
- Verify RPC URL is correct
- Check if admin wallet has MATIC for gas
- Ensure contract address is checksummed

### Supabase Auth Errors
- Verify API keys in .env
- Check if tables exist
- Enable Row Level Security policies

## Security Considerations

1. **Private Keys**: Never commit `.env` file
2. **CORS**: Configure allowed origins
3. **Rate Limiting**: Add rate limits in production
4. **File Validation**: Enforce file size/type limits
5. **Encryption**: All patient data encrypted before IPFS upload

## Deployment

### Docker

```bash
docker build -t medibytes-backend .
docker run -p 8000:8000 --env-file .env medibytes-backend
```

### Railway/Render

1. Connect GitHub repo
2. Set environment variables
3. Deploy with: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## License

MIT

## Support

For issues or questions, contact: medibytes@example.com
