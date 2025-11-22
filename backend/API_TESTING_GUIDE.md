# MediBytes Backend - API Testing Guide

Quick reference for testing all API endpoints manually.

## Setup

1. Start backend server:
```bash
cd backend
python start.py
```

2. Base URL: `http://localhost:8000`

3. API Docs: http://localhost:8000/docs (Interactive Swagger UI)

## Testing with curl (PowerShell)

### 1. Health Check

```powershell
# Root endpoint
curl http://localhost:8000/

# Health status
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "services": {
    "database": "connected",
    "blockchain": "connected",
    "ipfs": "connected"
  }
}
```

---

## Authentication Endpoints

### 2. Register Patient

```powershell
curl -X POST http://localhost:8000/api/auth/patient/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "dob": "1990-05-15",
    "gender": "male"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "patient",
  "blockchain_address": "0xABCD...1234"
}
```

### 3. Login Patient

```powershell
curl -X POST http://localhost:8000/api/auth/patient/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123!"
  }'
```

### 4. Verify Doctor Wallet

```powershell
curl -X POST http://localhost:8000/api/auth/doctor/verify-wallet `
  -H "Content-Type: application/json" `
  -d '{
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "message": "Login to MediBytes",
    "signature": "0xabcd...signature-from-metamask"
  }'
```

---

## Patient Endpoints (Requires Authentication)

**Set Token:**
```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 5. Upload Medical Report

```powershell
# Create a multipart form request
$filePath = "C:\path\to\medical-report.pdf"

curl -X POST http://localhost:8000/api/patient/upload-report `
  -H "Authorization: Bearer $token" `
  -F "file=@$filePath" `
  -F 'metadata={"report_type":"lab_test","facility":"City Hospital","report_date":"2024-01-15","symptoms":"Annual checkup"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Report uploaded successfully",
  "data": {
    "report_id": "123e4567-e89b-12d3-a456-426614174000",
    "document_hash": "0xabcd1234...",
    "ipfs_cid": "QmXyz123...",
    "status": "pending",
    "ai_insights": {
      "risk_level": "low",
      "summary": "All values within normal range",
      "recommendations": [
        "Continue healthy lifestyle",
        "Schedule next checkup in 6 months"
      ],
      "abnormal_values": [],
      "follow_up_needed": false
    }
  }
}
```

### 6. Get Patient Reports

```powershell
curl http://localhost:8000/api/patient/reports `
  -H "Authorization: Bearer $token"
```

### 7. Get Access Requests

```powershell
curl http://localhost:8000/api/patient/access-requests `
  -H "Authorization: Bearer $token"
```

### 8. Approve Doctor Access

```powershell
curl -X POST http://localhost:8000/api/patient/approve-access `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "doctor_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

### 9. Revoke Doctor Access

```powershell
curl -X POST http://localhost:8000/api/patient/revoke-access `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "doctor_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

---

## Doctor Endpoints (Requires Authentication)

**Set Token:**
```powershell
$doctorToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 10. Get Pending Approvals

```powershell
curl http://localhost:8000/api/doctor/pending-approvals `
  -H "Authorization: Bearer $doctorToken"
```

**Expected Response:**
```json
{
  "success": true,
  "pending_reports": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "patient_id": "550e8400-e29b-41d4-a716-446655440000",
      "document_hash": "0xabcd1234...",
      "ipfs_cid": "QmXyz123...",
      "report_type": "lab_test",
      "report_date": "2024-01-15",
      "facility": "City Hospital",
      "ai_summary": "All values normal",
      "risk_level": "low",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

### 11. Approve Report

```powershell
$reportId = "123e4567-e89b-12d3-a456-426614174000"

curl -X POST "http://localhost:8000/api/doctor/approve-report/$reportId" `
  -H "Authorization: Bearer $doctorToken"
```

### 12. Confirm Approval (After Blockchain TX)

```powershell
curl -X POST "http://localhost:8000/api/doctor/confirm-approval/$reportId" `
  -H "Authorization: Bearer $doctorToken" `
  -H "Content-Type: application/json" `
  -d '{
    "tx_hash": "0x1234abcd..."
  }'
```

### 13. Reject Report

```powershell
curl -X POST "http://localhost:8000/api/doctor/reject-report/$reportId" `
  -H "Authorization: Bearer $doctorToken" `
  -H "Content-Type: application/json" `
  -d '{
    "reason": "Incomplete information"
  }'
```

### 14. Request Patient Access

```powershell
curl -X POST http://localhost:8000/api/doctor/request-access `
  -H "Authorization: Bearer $doctorToken" `
  -H "Content-Type: application/json" `
  -d '{
    "patient_address": "0xABCD1234...",
    "purpose": "Treatment consultation",
    "duration_days": 30
  }'
```

---

## Verification Endpoints (Public)

### 15. Verify Document (Upload File)

```powershell
$filePath = "C:\path\to\document.pdf"

curl -X POST http://localhost:8000/api/verify/document `
  -F "file=@$filePath"
```

**Expected Response:**
```json
{
  "is_valid": true,
  "document_hash": "0xabcd1234...",
  "blockchain_record": {
    "ipfs_cid": "QmXyz123...",
    "patient_address": "0xABCD...",
    "timestamp": 1705320000,
    "issued_by": "0x742d...",
    "report_type": "lab_test"
  }
}
```

### 16. Verify by Hash

```powershell
$hash = "0xabcd1234567890abcdef"

curl "http://localhost:8000/api/verify/hash/$hash"
```

---

## Testing with Postman

### Import Collection

1. Open Postman
2. Import → Paste URL: http://localhost:8000/openapi.json
3. All endpoints auto-imported!

### Environment Variables

Create environment with:
- `base_url`: `http://localhost:8000`
- `patient_token`: `{{patient_login_response.access_token}}`
- `doctor_token`: `{{doctor_login_response.access_token}}`

---

## Testing Workflow

### Complete Patient Flow

```powershell
# 1. Register patient
$registerResponse = curl -X POST http://localhost:8000/api/auth/patient/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Pass123!","name":"Test User","dob":"1990-01-01","gender":"male"}' | ConvertFrom-Json

$token = $registerResponse.access_token

# 2. Upload report
curl -X POST http://localhost:8000/api/patient/upload-report `
  -H "Authorization: Bearer $token" `
  -F "file=@report.pdf" `
  -F 'metadata={"report_type":"lab_test","facility":"Hospital","report_date":"2024-01-15"}'

# 3. Get reports
curl http://localhost:8000/api/patient/reports `
  -H "Authorization: Bearer $token"
```

### Complete Doctor Flow

```powershell
# 1. Verify wallet
$doctorResponse = curl -X POST http://localhost:8000/api/auth/doctor/verify-wallet `
  -H "Content-Type: application/json" `
  -d '{"wallet_address":"0x742d...","message":"Login","signature":"0xsig..."}' | ConvertFrom-Json

$doctorToken = $doctorResponse.access_token

# 2. Get pending reports
curl http://localhost:8000/api/doctor/pending-approvals `
  -H "Authorization: Bearer $doctorToken"

# 3. Approve report
curl -X POST "http://localhost:8000/api/doctor/approve-report/report-id" `
  -H "Authorization: Bearer $doctorToken"
```

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Error Response Format

```json
{
  "detail": "Error message here",
  "status_code": 400
}
```

---

## Testing Checklist

- [ ] Health endpoints working
- [ ] Patient registration works
- [ ] Patient login works
- [ ] JWT token valid
- [ ] Doctor wallet verification works
- [ ] File upload works (PDF)
- [ ] File upload works (Image)
- [ ] AI analysis runs
- [ ] Reports saved to database
- [ ] Reports saved to IPFS
- [ ] Doctor can see pending reports
- [ ] Doctor can approve reports
- [ ] Reports added to blockchain
- [ ] Access control works
- [ ] Document verification works
- [ ] All endpoints return correct status codes
- [ ] Error handling works

---

## Automated Testing Script

Create `test_api.ps1`:

```powershell
# MediBytes API Test Script

$baseUrl = "http://localhost:8000"

Write-Host "Testing MediBytes Backend API..." -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing health endpoint..." -ForegroundColor Yellow
$health = curl "$baseUrl/health" | ConvertFrom-Json
if ($health.status -eq "healthy") {
    Write-Host "✅ Health check passed" -ForegroundColor Green
} else {
    Write-Host "❌ Health check failed" -ForegroundColor Red
}

# Test 2: Patient Registration
Write-Host "`n2. Testing patient registration..." -ForegroundColor Yellow
$email = "test_$(Get-Random)@example.com"
$registerData = @{
    email = $email
    password = "TestPass123!"
    name = "Test User"
    dob = "1990-01-01"
    gender = "male"
} | ConvertTo-Json

try {
    $register = curl -X POST "$baseUrl/api/auth/patient/register" `
        -H "Content-Type: application/json" `
        -d $registerData | ConvertFrom-Json
    
    if ($register.access_token) {
        Write-Host "✅ Registration successful" -ForegroundColor Green
        $token = $register.access_token
    }
} catch {
    Write-Host "❌ Registration failed: $_" -ForegroundColor Red
}

# Test 3: Get Reports
Write-Host "`n3. Testing get reports..." -ForegroundColor Yellow
try {
    $reports = curl "$baseUrl/api/patient/reports" `
        -H "Authorization: Bearer $token" | ConvertFrom-Json
    
    Write-Host "✅ Get reports successful (count: $($reports.reports.Count))" -ForegroundColor Green
} catch {
    Write-Host "❌ Get reports failed: $_" -ForegroundColor Red
}

Write-Host "`nTesting complete!" -ForegroundColor Cyan
```

Run with:
```powershell
.\test_api.ps1
```

---

## Tips

1. **Use Swagger UI**: Easiest way to test - http://localhost:8000/docs
2. **Save Tokens**: Store tokens in variables for authenticated requests
3. **Check Logs**: Monitor server console for errors
4. **Use ReDoc**: Alternative docs - http://localhost:8000/redoc
5. **Postman Collection**: Auto-import from OpenAPI spec

Happy testing! 🧪
