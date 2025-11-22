# MediBytes Backend - Quick Reference Card

## 🚀 Quick Start

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python start.py
```

**Server**: http://localhost:8000  
**Docs**: http://localhost:8000/docs

---

## 📁 File Structure

```
backend/
├── main.py              # FastAPI app (20+ endpoints)
├── models.py            # Pydantic models
├── config.py            # Settings
├── requirements.txt     # Dependencies
├── .env.example         # Config template
└── services/
    ├── auth.py          # Authentication
    ├── blockchain.py    # Web3 integration
    ├── ipfs.py          # Pinata/IPFS
    ├── ai_analysis.py   # OCR + OpenAI
    └── database.py      # Supabase
```

---

## 🔑 Environment Variables

```env
# Core
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
JWT_SECRET=your-secret-key-min-32-chars

# Blockchain
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
MEDICAL_RECORD_CONTRACT_ADDRESS=0x745d52A59140ec1A6dEeeE38687256f8e3533845
ADMIN_PRIVATE_KEY=0x...

# Services
PINATA_JWT=eyJ...
OPENAI_API_KEY=sk-...
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/patient/register`
- `POST /api/auth/patient/login`
- `POST /api/auth/doctor/verify-wallet`

### Patient
- `POST /api/patient/upload-report`
- `GET /api/patient/reports`
- `GET /api/patient/access-requests`
- `POST /api/patient/approve-access`
- `POST /api/patient/revoke-access`

### Doctor
- `GET /api/doctor/pending-approvals`
- `POST /api/doctor/approve-report/{id}`
- `POST /api/doctor/confirm-approval/{id}`
- `POST /api/doctor/reject-report/{id}`
- `POST /api/doctor/request-access`

### Verification
- `POST /api/verify/document`
- `GET /api/verify/hash/{hash}`

---

## 🗄️ Database Tables

### patients
```sql
id, email, name, dob, gender, blockchain_address, created_at
```

### doctors
```sql
id, wallet_address, name, license_number, specialization, last_login
```

### pending_reports
```sql
id, patient_id, document_hash, ipfs_cid, report_type, status,
approved_by, approved_at, blockchain_tx, created_at
```

### access_permissions
```sql
id, patient_address, doctor_address, purpose, status,
expires_at, blockchain_tx, created_at
```

---

## 🔐 Authentication

### Patient (JWT)
```javascript
// Register/Login
POST /api/auth/patient/login
{
  "email": "user@example.com",
  "password": "pass123"
}

// Response
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}

// Use token
Authorization: Bearer eyJ...
```

### Doctor (Wallet)
```javascript
// Sign message with MetaMask
const message = "Login to MediBytes";
const signature = await signer.signMessage(message);

// Verify
POST /api/auth/doctor/verify-wallet
{
  "wallet_address": "0x...",
  "message": "Login to MediBytes",
  "signature": "0x..."
}
```

---

## 📦 Services Overview

### AuthService
- `register_patient()` - Create patient account
- `login_patient()` - Authenticate patient
- `verify_wallet_signature()` - Verify MetaMask signature
- `create_access_token()` - Generate JWT

### BlockchainService
- `register_patient()` - Register on-chain
- `add_medical_record()` - Add record to blockchain
- `approve_access()` - Grant doctor access
- `verify_document()` - Verify document authenticity

### IPFSService
- `upload_to_pinata()` - Upload to IPFS
- `fetch_from_ipfs()` - Retrieve from IPFS
- `encrypt_file()` - Encrypt before upload
- `decrypt_file()` - Decrypt after download

### AIService
- `extract_text_ocr()` - OCR from PDF/images
- `analyze_health_data()` - OpenAI analysis
- `parse_lab_values()` - Extract lab results

### DatabaseService
- `create_pending_report()` - Save report to DB
- `get_pending_reports()` - Fetch pending reports
- `mark_report_approved()` - Update report status
- `create_access_request()` - Request access
- `approve_access_request()` - Approve access

---

## 🔄 Workflows

### Report Upload Flow
```
1. Patient uploads file → Backend
2. OCR extracts text
3. OpenAI analyzes health data
4. File encrypted with patient key
5. Uploaded to IPFS (Pinata)
6. Saved as PENDING in database
7. AI insights returned to patient
8. Awaits doctor approval
```

### Doctor Approval Flow
```
1. Doctor views pending reports
2. Reviews report details
3. Clicks approve
4. Backend adds record to blockchain
5. Database updated to APPROVED
6. Patient can now see on blockchain
```

### Access Control Flow
```
1. Doctor requests access
2. Request stored in DB
3. Patient receives notification
4. Patient approves via UI
5. Backend calls approveAccess() on-chain
6. Doctor can now view records
```

---

## 🐛 Troubleshooting

### Tesseract Not Found
```python
# Add to ai_analysis.py
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Blockchain Connection Failed
- Check RPC URL
- Verify contract address
- Ensure admin wallet has MATIC

### Supabase Auth Error
- Verify URL and keys
- Check if tables exist
- Enable auth provider

### CORS Error
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🧪 Testing

### Quick Test
```bash
# Health check
curl http://localhost:8000/health

# Interactive docs
# Open: http://localhost:8000/docs
```

### Register & Login
```bash
# Register
curl -X POST http://localhost:8000/api/auth/patient/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test","dob":"1990-01-01","gender":"male"}'

# Login
curl -X POST http://localhost:8000/api/auth/patient/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | ✅ Success |
| 201 | ✅ Created |
| 400 | ❌ Bad Request |
| 401 | ❌ Unauthorized |
| 403 | ❌ Forbidden |
| 404 | ❌ Not Found |
| 500 | ❌ Server Error |

---

## 🔧 Dependencies

```
fastapi==0.109.0         # Web framework
uvicorn[standard]==0.27.0 # Server
supabase==2.3.4          # Database + Auth
web3==6.15.1             # Blockchain
openai==1.10.0           # AI analysis
pytesseract==0.3.10      # OCR
python-jose[cryptography]==3.3.0  # JWT
cryptography==42.0.0     # Encryption
```

---

## 📚 Documentation

- **README.md** - Overview & features
- **SETUP_GUIDE.md** - Complete setup instructions
- **API_TESTING_GUIDE.md** - Testing endpoints
- **IMPLEMENTATION_SUMMARY.md** - What we built
- **Swagger UI** - http://localhost:8000/docs

---

## 🚀 Deployment

### Local
```bash
uvicorn main:app --reload
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker
```bash
docker build -t medibytes-backend .
docker run -p 8000:8000 --env-file .env medibytes-backend
```

---

## 🔒 Security Checklist

- [ ] .env file not committed
- [ ] Strong JWT secret (32+ chars)
- [ ] Admin private key secured
- [ ] CORS configured properly
- [ ] File size limits enforced
- [ ] Input validation active
- [ ] HTTPS in production
- [ ] Database RLS enabled

---

## 📞 Support

**Logs**: Check console output  
**Docs**: http://localhost:8000/docs  
**Health**: http://localhost:8000/health  

---

## 🎯 Next Steps

1. ✅ Backend created
2. Configure .env
3. Set up Supabase
4. Install Tesseract
5. Run `python start.py`
6. Test endpoints
7. Connect frontend
8. Deploy to production

---

**Smart Contract**: `0x745d52A59140ec1A6dEeeE38687256f8e3533845`  
**Network**: Polygon Amoy (Chain ID: 80002)  
**License**: MIT

---

*MediBytes - Decentralized Healthcare Records* 🏥⛓️
