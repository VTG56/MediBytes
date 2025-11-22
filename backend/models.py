"""
MediBytes Backend - Pydantic Models
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============================================================================
# Authentication Models
# ============================================================================


class PatientRegister(BaseModel):
    """Patient registration data"""

    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    dob: str  # Date of birth (YYYY-MM-DD)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")


class PatientLogin(BaseModel):
    """Patient login credentials"""

    email: EmailStr
    password: str


class DoctorWalletVerify(BaseModel):
    """Doctor wallet verification"""

    wallet_address: str = Field(..., pattern="^0x[a-fA-F0-9]{40}$")
    message: str  # Message that was signed
    signature: str  # Wallet signature


class TokenResponse(BaseModel):
    """JWT token response"""

    access_token: str
    token_type: str = "bearer"
    user_id: Optional[str] = None
    role: str  # "patient" or "doctor"
    blockchain_address: Optional[str] = None


class User(BaseModel):
    """Current authenticated user"""

    user_id: Optional[str] = None
    wallet_address: Optional[str] = None
    email: Optional[str] = None
    role: str  # "patient" or "doctor"
    blockchain_address: Optional[str] = None


# ============================================================================
# Medical Record Models
# ============================================================================


class MedicalRecordMetadata(BaseModel):
    """Medical record metadata"""

    report_type: str
    facility: str
    report_date: str  # ISO format
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    clinical_notes: Optional[str] = None


class LabValue(BaseModel):
    """Lab test value"""

    parameter: str  # e.g., "Hemoglobin"
    value: str  # e.g., "14.2"
    unit: str  # e.g., "g/dL"
    normal_range: str  # e.g., "13-17 g/dL"
    status: str = Field(..., pattern="^(normal|high|low|critical)$")


class AIInsights(BaseModel):
    """AI-generated health insights"""

    risk_level: str  # "low", "medium", "high", "critical"
    summary: str
    recommendations: List[str]
    abnormal_values: Optional[List[LabValue]] = None
    extracted_lab_values: Optional[List[LabValue]] = None


class PendingReport(BaseModel):
    """Pending report awaiting doctor approval"""

    id: str
    patient_id: str
    patient_address: str
    patient_name: Optional[str] = None
    document_hash: str
    ipfs_cid: str
    report_type: str
    facility: str
    report_date: str
    symptoms: Optional[str] = None
    extracted_text: Optional[str] = None
    ai_insights: Optional[Dict[str, Any]] = None
    uploaded_at: datetime
    status: str  # "PENDING_DOCTOR_APPROVAL"


class BlockchainRecord(BaseModel):
    """Verified record on blockchain"""

    document_hash: str
    ipfs_cid: str
    report_type: str
    issuing_facility: str
    patient_address: str
    issued_by: str  # Doctor's wallet address
    issued_date: int  # Unix timestamp
    approved_at: int  # Unix timestamp
    is_doctor_verified: bool
    metadata: str  # JSON string


# ============================================================================
# Access Control Models
# ============================================================================


class AccessRequest(BaseModel):
    """Doctor requests access to patient records"""

    patient_address: str = Field(..., pattern="^0x[a-fA-F0-9]{40}$")
    purpose: str = Field(..., min_length=10, max_length=200)
    duration_days: int = Field(..., ge=1, le=365)


class AccessApproval(BaseModel):
    """Patient approves/revokes doctor access"""

    doctor_address: str = Field(..., pattern="^0x[a-fA-F0-9]{40}$")


class AccessPermission(BaseModel):
    """Access permission details"""

    patient: str
    requester: str  # Doctor's wallet
    status: str  # "Pending", "Approved", "Revoked"
    requested_at: int
    expires_at: Optional[int] = None
    purpose: str


# ============================================================================
# Organ Donation Models (if needed)
# ============================================================================


class OrganDonorRegister(BaseModel):
    """Organ donor registration"""

    donor_address: str
    blood_type: str
    organs: List[str]
    medical_history: Optional[str] = None
    age: int
    weight: float
    height: float


class OrganRecipientRegister(BaseModel):
    """Organ recipient registration"""

    recipient_address: str
    blood_type: str
    organ_needed: str
    urgency_score: int = Field(..., ge=1, le=10)
    medical_condition: str


# ============================================================================
# Response Models
# ============================================================================


class SuccessResponse(BaseModel):
    """Generic success response"""

    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Generic error response"""

    success: bool = False
    error: str
    detail: Optional[str] = None


class TransactionResponse(BaseModel):
    """Blockchain transaction response"""

    success: bool
    transaction_hash: str
    block_number: Optional[int] = None
    gas_used: Optional[int] = None


# ============================================================================
# Enhanced Organ Donation Models
# ============================================================================


class OrganDonorData(BaseModel):
    """Enhanced organ donor registration with all required fields"""

    patient_id: str  # Patient's Supabase UUID
    blood_type: str = Field(..., pattern="^(A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-)$")
    organ_type: str  # Comma-separated: kidney, liver, heart, lung, pancreas, cornea
    age: int = Field(..., ge=18, le=75)
    tissue_type_hla: Optional[str] = None  # HLA typing e.g., "A*02:01"
    encrypted_medical_history: Optional[str] = None
    ipfs_cid: str  # IPFS hash for medical clearance certificate
    is_active: bool = True


class DonorSearchFilters(BaseModel):
    """Search filters for finding compatible organ donors"""

    organ_type: str  # Required: kidney, liver, heart, lung, pancreas, cornea
    blood_type: Optional[str] = Field(None, pattern="^(A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-)$")
    min_age: Optional[int] = Field(None, ge=18)
    max_age: Optional[int] = Field(None, le=75)
    tissue_type_hla: Optional[str] = None
    limit: int = Field(50, ge=1, le=100)


class OrganMatchRequest(BaseModel):
    """Request to create an organ match between donor and recipient"""

    donor_patient_id: str  # Donor's Supabase UUID
    recipient_patient_id: str  # Recipient's Supabase UUID
    organ_type: str
    compatibility_score: float = Field(..., ge=0.0, le=100.0)
    match_details: Optional[Dict[str, Any]] = None  # Breakdown: blood_match, hla_match, age_factor
    matched_by: Optional[str] = None  # Doctor's wallet address who created the match
