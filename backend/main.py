"""
MediBytes Backend - Main Application
FastAPI server with blockchain integration, AI analysis, and IPFS storage
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
import uvicorn
import logging

PATIENT_BLOCKCHAIN_ADDRESS = "0xBeDdBdED049f68D005723d4077314Afe0d5D326f"
from config import settings
from services.auth import AuthService, get_current_user
from services.blockchain import BlockchainService
from services.ipfs import IPFSService
from services.ai_analysis import AIService
from services.database import DatabaseService
from services.model import ModelService
from models import (
    PatientRegister,
    PatientLogin,
    DoctorWalletVerify,
    TokenResponse,
    User,
    MedicalRecordMetadata,
    AccessRequest,
    AccessApproval,
    OrganDonorData,
    DonorSearchFilters,
    OrganMatchRequest,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MediBytes API",
    description="Blockchain-based healthcare platform backend",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
auth_service = AuthService()
blockchain_service = BlockchainService()
ipfs_service = IPFSService()
ai_service = AIService()
db_service = DatabaseService()
model_service = ModelService()


# ============================================================================
# Health Check
# ============================================================================


@app.get("/")
async def root():
    """API Health check"""
    return {
        "status": "online",
        "service": "MediBytes Backend",
        "version": "1.0.0",
        "environment": settings.environment,
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "api": "healthy",
        "blockchain": blockchain_service.is_connected(),
        "ipfs": await ipfs_service.test_connection(),
        "database": await db_service.test_connection(),
    }


# ============================================================================
# Authentication Endpoints
# ============================================================================


@app.post("/api/auth/patient/register", response_model=TokenResponse)
async def register_patient(patient_data: PatientRegister):
    """Register a new patient with username/password"""
    try:
        user = await auth_service.register_patient(
            email=patient_data.email,
            password=patient_data.password,
            name=patient_data.name,
            dob=patient_data.dob,
            gender=patient_data.gender,
        )

        blockchain_address = auth_service.generate_patient_address(user["id"])
        tx_hash = await blockchain_service.register_patient(blockchain_address)
        await db_service.update_user_blockchain_address(user["id"], blockchain_address)

        token = auth_service.create_access_token(
            data={"user_id": user["id"], "role": "patient", "email": patient_data.email}
        )

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user["id"],
            role="patient",
            blockchain_address=blockchain_address,
        )

    except Exception as e:
        logger.error(f"Patient registration failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/patient/login", response_model=TokenResponse)
async def login_patient(credentials: PatientLogin):
    """Patient login with email/password"""
    try:
        user = await auth_service.login_patient(
            credentials.email, credentials.password
        )
        blockchain_address = await db_service.get_user_blockchain_address(user["id"])

        token = auth_service.create_access_token(
            data={"user_id": user["id"], "role": "patient", "email": credentials.email}
        )

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user["id"],
            role="patient",
            blockchain_address=blockchain_address,
        )

    except Exception as e:
        logger.error(f"Patient login failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/api/auth/doctor/verify-wallet")
async def verify_doctor_wallet(wallet_data: DoctorWalletVerify):
    """Verify doctor wallet and check on-chain registration"""
    try:
        is_valid = auth_service.verify_wallet_signature(
            wallet_data.wallet_address, wallet_data.message, wallet_data.signature
        )

        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid wallet signature")

        is_doctor = await blockchain_service.is_registered_doctor(
            wallet_data.wallet_address
        )

        if not is_doctor:
            raise HTTPException(
                status_code=403,
                detail="Wallet not registered as verified doctor. Contact admin.",
            )

        doctor_info = await blockchain_service.get_doctor_info(
            wallet_data.wallet_address
        )

        token = auth_service.create_access_token(
            data={
                "wallet_address": wallet_data.wallet_address,
                "role": "doctor",
                "license": doctor_info.get("license"),
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "role": "doctor",
            "wallet_address": wallet_data.wallet_address,
            "license": doctor_info.get("license"),
            "is_verified": doctor_info.get("is_active", False),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Doctor verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Patient Operations
# ============================================================================


@app.post("/api/patient/upload-report")
async def upload_medical_report(
    file: UploadFile = File(...),
    report_type: str = Form(...),
    report_date: str = Form(...),
    facility: str = Form(...),
    extracted_text: Optional[str] = Form(None),
    symptoms: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
):
    """
    Patient uploads medical report with extracted text
    Text is stored UNENCRYPTED in IPFS for doctor access
    Doctor can then approve to push to blockchain as medical record
    """
    try:
        if current_user.role != "patient":
            raise HTTPException(status_code=403, detail="Patients only")

        file_content = await file.read()
        if len(file_content) > settings.max_file_size_mb * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large")

        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in settings.allowed_file_types_list:
            raise HTTPException(status_code=400, detail="Invalid file type")

        logger.info(f"Processing upload for patient: {current_user.user_id}")

        # Step 1: Use extracted text from frontend (from ML service)
        # If not provided, extract it now
        if not extracted_text:
            extracted_text = await ai_service.extract_text_ocr(file_content, f".{file_extension}")
            logger.info("✅ OCR extraction completed")

        # Step 2: AI health analysis
        ai_insights_obj = await ai_service.analyze_health_data(extracted_text, report_type)
        ai_insights = ai_insights_obj.model_dump() if hasattr(ai_insights_obj, 'model_dump') else ai_insights_obj.dict()

        # Step 3: Prepare data for IPFS storage (UNENCRYPTED)
        # Store extracted text and metadata together
        text_data = {
            "extracted_text": extracted_text,
            "report_type": report_type,
            "report_date": report_date,
            "facility": facility,
            "symptoms": symptoms,
            "patient_id": current_user.user_id,
            "uploaded_at": str(__import__('datetime').datetime.utcnow().isoformat()),
        }
        
        import json
        text_json = json.dumps(text_data).encode('utf-8')

        # Step 4: Upload extracted text to IPFS (UNENCRYPTED)
        extracted_text_response = await ipfs_service.upload_to_pinata(
            text_json,
            filename=f"extracted_text_{report_type}.json",
            metadata={
                "patient_id": current_user.user_id,
                "report_type": report_type,
                "content_type": "extracted_text",
            },
        )
        extracted_text_cid = extracted_text_response.get("cid") if isinstance(extracted_text_response, dict) else extracted_text_response
        logger.info(f"✅ Extracted text uploaded to IPFS: {extracted_text_cid}")

        # Step 5: Encrypt and upload original file to IPFS
        patient_address = current_user.user_id
        encrypted_data = ipfs_service.encrypt_file(file_content, patient_address)

        file_response = await ipfs_service.upload_to_pinata(
            encrypted_data,
            filename=file.filename,
            metadata={
                "patient_address": patient_address,
                "report_type": report_type,
                "timestamp": report_date,
                "content_type": "encrypted_file",
            },
        )
        file_cid = file_response.get("cid") if isinstance(file_response, dict) else file_response
        logger.info(f"✅ Original file uploaded to IPFS: {file_cid}")

        # Step 6: Store in database (PENDING approval)
        report_record = await db_service.create_pending_report(
            patient_id=current_user.user_id,
            document_hash="PENDING_DOCTOR_APPROVAL",
            ipfs_cid=file_cid,  # Encrypted file
            extracted_text_cid=extracted_text_cid,  # Unencrypted extracted text
            report_type=report_type,
            facility=facility,
            report_date=report_date,
            symptoms=symptoms,
            extracted_text=extracted_text,  # Store in database too
            ai_summary=ai_insights.get("summary", "AI analysis completed"),
            risk_level=ai_insights.get("risk_level", "pending_analysis"),
            patient_email=current_user.email,
        )

        return {
            "success": True,
            "message": "Report uploaded successfully. Awaiting doctor approval.",
            "report_id": report_record["id"],
            "ipfs_cid": file_cid,  # Encrypted file
            "extracted_text_cid": extracted_text_cid,  # Unencrypted text (for doctor)
            "extracted_text_gateway_url": f"https://gateway.pinata.cloud/ipfs/{extracted_text_cid}",  # Doctor can access this
            "ai_insights": ai_insights,
            "status": "PENDING_DOCTOR_APPROVAL",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/patient/reports")
async def get_patient_reports(current_user: User = Depends(get_current_user)):
    """Get all reports for logged-in patient with IPFS gateway URLs"""
    try:
        if current_user.role != "patient":
            raise HTTPException(status_code=403, detail="Patients only")

        pending_reports = await db_service.get_pending_reports(current_user.user_id)
        
        # Add IPFS gateway URLs to each report
        for report in pending_reports:
            # Handle both old format (JSON string) and new format (plain CID)
            cid = report.get("ipfs_cid")
            if cid:
                # If it's a dict or JSON string, extract the CID
                if isinstance(cid, dict):
                    cid = cid.get("cid")
                elif isinstance(cid, str) and cid.startswith("{"):
                    try:
                        import json
                        cid = json.loads(cid).get("cid")
                    except:
                        pass  # Keep original if parsing fails
                
                report["ipfs_cid"] = cid
                report["ipfs_gateway_url"] = f"https://gateway.pinata.cloud/ipfs/{cid}"
        
        # ✅ CRITICAL: Use the SAME hardcoded address that's used during doctor approval
        # This ensures records can be found on blockchain
        patient_address = PATIENT_BLOCKCHAIN_ADDRESS
        logger.info(f"🔍 Fetching blockchain records for patient address: {patient_address}")
        
        blockchain_records = await blockchain_service.get_patient_records(patient_address)
        logger.info(f"📊 Blockchain query returned {len(blockchain_records)} verified records")

        # ✅ Enrich blockchain records with transaction hashes from database
        # Get ALL approved reports from database once (more efficient)
        try:
            all_approved = db_service.supabase.table("pending_reports").select(
                "blockchain_tx, document_hash, ipfs_cid, extracted_text"
            ).eq("status", "approved").execute()
            
            approved_reports = all_approved.data if all_approved.data else []
            logger.info(f"📊 Found {len(approved_reports)} approved reports in database")
        except Exception as e:
            logger.error(f"❌ Failed to query approved reports: {e}")
            approved_reports = []
        
        enriched_records = []
        for record in blockchain_records:
            try:
                # Normalize blockchain document hash (remove 0x prefix if present)
                doc_hash = record["document_hash"]
                doc_hash_normalized = doc_hash[2:] if doc_hash.startswith("0x") else doc_hash
                
                # Try to find matching report by document_hash
                matched_report = None
                for db_report in approved_reports:
                    db_hash = db_report.get("document_hash", "")
                    
                    # Normalize database hash (remove 0x prefix if present)
                    db_hash_normalized = db_hash[2:] if db_hash.startswith("0x") else db_hash
                    
                    # Match by normalized hash OR by IPFS CID (fallback for old records)
                    if db_hash_normalized == doc_hash_normalized or db_report.get("ipfs_cid") == record.get("ipfs_cid"):
                        matched_report = db_report
                        logger.info(f"✅ Matched blockchain record {doc_hash[:16]}... with database record")
                        break
                
                if matched_report:
                    # Add transaction hash and extracted text to record
                    tx_hash = matched_report.get("blockchain_tx")
                    if tx_hash:
                        record["tx_hash"] = tx_hash
                        record["polygonscan_url"] = f"https://amoy.polygonscan.com/tx/{tx_hash}"
                        logger.info(f"✅ Enriched with tx_hash: {tx_hash[:16]}...")
                    else:
                        logger.warning(f"⚠️ No blockchain_tx found for record {doc_hash[:16]}...")
                    
                    # Add extracted text if available
                    if matched_report.get("extracted_text"):
                        record["extracted_text"] = matched_report.get("extracted_text")
                else:
                    logger.warning(f"⚠️ No database match found for blockchain record {doc_hash[:16]}...")
            except Exception as e:
                logger.error(f"❌ Failed to enrich record: {e}")
            
            enriched_records.append(record)

        return {
            "pending_reports": pending_reports,
            "verified_reports": enriched_records,
            "total_pending": len(pending_reports),
            "total_verified": len(enriched_records),
        }

    except Exception as e:
        logger.error(f"Failed to fetch reports: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Doctor Operations
# ============================================================================


@app.get("/api/doctor/pending-approvals")
async def get_doctor_pending_approvals(current_user: User = Depends(get_current_user)):
    """Get all pending reports awaiting doctor approval with IPFS gateway URLs"""
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Doctors only")

        # Get all pending reports (no patient_id filter for doctors)
        pending_reports = await db_service.get_pending_reports()
        
        # Add IPFS gateway URLs and fetch patient info
        for report in pending_reports:
            # Handle both old format (JSON string) and new format (plain CID)
            cid = report.get("ipfs_cid")
            if cid:
                # If it's a dict or JSON string, extract the CID
                if isinstance(cid, dict):
                    cid = cid.get("cid")
                elif isinstance(cid, str) and cid.startswith("{"):
                    try:
                        import json
                        cid = json.loads(cid).get("cid")
                    except:
                        pass  # Keep original if parsing fails
                
                report["ipfs_cid"] = cid
                report["ipfs_gateway_url"] = f"https://gateway.pinata.cloud/ipfs/{cid}"
            
            # Fetch patient name from patients table
            try:
                patient = await db_service.supabase.table("patients").select("name, email").eq("id", report["patient_id"]).single().execute()
                if patient.data:
                    report["patient_name"] = patient.data.get("name")
                    report["patient_email"] = patient.data.get("email")
            except:
                report["patient_name"] = "Unknown"
                report["patient_email"] = ""

        return {
            "success": True,
            "pending_reports": pending_reports,
            "total": len(pending_reports),
        }

    except Exception as e:
        logger.error(f"Failed to fetch pending approvals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/doctor/stats")
async def get_doctor_stats(current_user: User = Depends(get_current_user)):
    """Get doctor dashboard statistics"""
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Doctors only")

        # Get pending approvals count
        pending_reports = await db_service.get_pending_reports()
        pending_count = len(pending_reports)

        # Get patients queued count (patients with pending reports)
        unique_patients = set()
        for report in pending_reports:
            if report.get("patient_id"):
                unique_patients.add(report["patient_id"])
        patients_queued = len(unique_patients)

        return {
            "success": True,
            "stats": {
                "pending_approvals": pending_count,
                "patients_queued": patients_queued
            }
        }

    except Exception as e:
        logger.error(f"Failed to fetch doctor stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/doctor/approve-report/{report_id}")
async def approve_report(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    """Doctor approves report - computes hash and returns data for blockchain transaction"""
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Doctors only")

        # Get report from database
        report = await db_service.get_report_by_id(report_id)
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if report["status"] != "pending":
            raise HTTPException(status_code=400, detail="Report already processed")

        # Fetch encrypted file from IPFS to compute hash
        ipfs_cid = report["ipfs_cid"]
        
        # Get file content from IPFS (we need this to compute the hash)
        # For now, we'll compute hash from the available data
        document_hash = blockchain_service.compute_hash(
            f"{report['patient_id']}{ipfs_cid}{report['report_type']}{report['report_date']}".encode()
        )
        
        logger.info(f"📝 Computed document hash: {document_hash}")

        # Return data needed for frontend to make blockchain transaction
        # Use the same hardcoded patient blockchain address as everywhere else
        return {
            "success": True,
            "message": "Report ready for blockchain approval",
            "report_id": report_id,
            "patient_id": report["patient_id"],
            "document_hash": document_hash,
            "ipfs_cid": ipfs_cid,
            "report_type": report["report_type"],
            "report_date": report["report_date"],
            # Frontend will use these to call smart contract
            "blockchain_data": {
                "patientAddress": PATIENT_BLOCKCHAIN_ADDRESS,  # Use blockchain address, not UUID
                "documentHash": document_hash,
                "ipfsCID": ipfs_cid,
                "reportType": report["report_type"],
                "issuingFacility": report.get("facility", "Unknown"),
                "reportDate": report.get("report_date", ""),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Approval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/doctor/confirm-approval")
async def confirm_approval(
    report_id: str = Form(...),
    tx_hash: str = Form(...),
    document_hash: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Confirm blockchain transaction and update database"""
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Doctors only")

        # Update report status in database
        success = await db_service.mark_report_approved(
            report_id=report_id,
            doctor_address=current_user.wallet_address or current_user.user_id,
            tx_hash=tx_hash,
            document_hash=document_hash
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update report status")

        return {
            "success": True,
            "message": "Report approved and recorded on blockchain",
            "tx_hash": tx_hash,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Confirmation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/patient/analyze-report")
async def analyze_report_proxy(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Proxy endpoint to call Ollama AI service for lab report analysis"""
    try:
        if current_user.role != "patient":
            raise HTTPException(status_code=403, detail="Patients only")
        
        import aiohttp
        import ssl
        
        OLLAMA_URL = "https://dizzied-unpropitiating-ute.ngrok-free.dev/api/analyze"
        
        file_content = await file.read()
        
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        form_data = aiohttp.FormData()
        form_data.add_field('file', file_content, filename=file.filename, content_type=file.content_type)
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                OLLAMA_URL,
                data=form_data,
                headers={'ngrok-skip-browser-warning': 'true'},
                ssl=ssl_context,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    error_text = await response.text()
                    logger.error(f"Ollama API error: {error_text}")
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"AI service error: {error_text}"
                    )
                    
    except aiohttp.ClientError as e:
        logger.error(f"Failed to connect to AI service: {e}")
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to AI service. Please check if the service is running."
        )
    except Exception as e:
        logger.error(f"Analysis proxy failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/patient/access-requests")
async def get_access_requests(current_user: User = Depends(get_current_user)):
    """Get pending access requests from doctors"""
    try:
        if current_user.role != "patient":
            raise HTTPException(status_code=403, detail="Patients only")

        patient_address = current_user.blockchain_address or current_user.user_id
        requests = await blockchain_service.get_pending_access_requests(patient_address)

        return {"access_requests": requests, "total": len(requests)}

    except Exception as e:
        logger.error(f"Failed to fetch access requests: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/patient/approve-access")
async def approve_doctor_access(
    approval: AccessApproval, current_user: User = Depends(get_current_user)
):
    """Patient approves doctor access request"""
    try:
        if current_user.role != "patient":
            raise HTTPException(status_code=403, detail="Patients only")

        patient_address = current_user.blockchain_address or current_user.user_id
        tx_hash = await blockchain_service.approve_access(
            patient_address=patient_address,
            doctor_address=approval.doctor_address,
        )

        await db_service.log_access_approval(
            patient_id=current_user.user_id,
            doctor_address=approval.doctor_address,
            tx_hash=tx_hash,
        )

        return {
            "success": True,
            "message": "Access granted to doctor",
            "transaction_hash": tx_hash,
            "doctor_address": approval.doctor_address,
        }

    except Exception as e:
        logger.error(f"Access approval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/patient/revoke-access")
async def revoke_doctor_access(
    approval: AccessApproval, current_user: User = Depends(get_current_user)
):
    """Patient revokes doctor access"""
    try:
        if current_user.role != "patient":
            raise HTTPException(status_code=403, detail="Patients only")

        patient_address = current_user.blockchain_address or current_user.user_id
        tx_hash = await blockchain_service.revoke_access(
            patient_address=patient_address,
            doctor_address=approval.doctor_address,
        )

        await db_service.log_access_revocation(
            patient_id=current_user.user_id,
            doctor_address=approval.doctor_address,
            tx_hash=tx_hash,
        )

        return {
            "success": True,
            "message": "Access revoked from doctor",
            "transaction_hash": tx_hash,
            "doctor_address": approval.doctor_address,
        }

    except Exception as e:
        logger.error(f"Access revocation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Doctor Operations
# ============================================================================


@app.post("/api/doctor/approve-report/{report_id}")
async def approve_medical_report(
    report_id: str, current_user: User = Depends(get_current_user)
):
    """
    Doctor approves patient report
    Returns data needed to create blockchain medical record
    """
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Doctors only")

        report = await db_service.get_report_by_id(report_id)

        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        # Compute hash for blockchain (from extracted text)
        import hashlib
        extracted_text = report.get("extracted_text", "")
        document_hash = hashlib.sha256(extracted_text.encode()).hexdigest()

        return {
            "success": True,
            "report_id": report_id,
            "document_hash": f"0x{document_hash}",  # Format as hex for blockchain
            "extracted_text_cid": report.get("extracted_text_cid"),  # Unencrypted text in IPFS
            "ipfs_cid": report.get("ipfs_cid"),  # Encrypted original file
            "report_type": report.get("report_type"),
            "facility": report.get("facility"),
            "patient_id": report.get("patient_id"),  # Database UUID
            "patient_address": PATIENT_BLOCKCHAIN_ADDRESS,  # Blockchain wallet address
            "report_date": report.get("report_date"),
            "issued_date": report.get("report_date"),
            "metadata": {
                "patient_id": report.get("patient_id"),
                "symptoms": report.get("symptoms"),
                "extracted_text": report.get("extracted_text"),
                "ai_summary": report.get("ai_summary"),
                "risk_level": report.get("risk_level"),
            },
            "message": "Ready to be pushed to blockchain as medical record",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Approval preparation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/doctor/confirm-approval/{report_id}")
async def confirm_report_approval(
    report_id: str,
    transaction_hash: str = Form(...),
    block_number: int = Form(...),
    current_user: User = Depends(get_current_user),
):
    """
    Confirm that doctor has approved report and submitted to blockchain
    Updates report status to APPROVED
    """
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Doctors only")

        report = await db_service.get_pending_report(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        # Verify transaction on blockchain
        tx_receipt = await blockchain_service.verify_transaction(transaction_hash)

        if not tx_receipt or tx_receipt.get("status") != 1:
            raise HTTPException(status_code=400, detail="Transaction failed on blockchain")

        # Compute document hash
        import hashlib
        extracted_text = report.get("extracted_text", "")
        document_hash = hashlib.sha256(extracted_text.encode()).hexdigest()

        # Update report status to APPROVED
        await db_service.mark_report_approved(
            report_id=report_id,
            doctor_address=current_user.wallet_address or "0x0",
            tx_hash=transaction_hash,
            block_number=block_number,
            document_hash=f"0x{document_hash}",
        )

        logger.info(f"✅ Report {report_id} approved and stored on blockchain with tx: {transaction_hash}")

        return {
            "success": True,
            "message": "Report approved and committed to blockchain",
            "report_id": report_id,
            "transaction_hash": transaction_hash,
            "block_number": block_number,
            "document_hash": f"0x{document_hash}",
            "extracted_text_cid": report.get("extracted_text_cid"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Confirmation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/doctor/reject-report/{report_id}")
async def reject_medical_report(
    report_id: str,
    reason: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    """Doctor rejects patient report"""
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Doctors only")

        await db_service.mark_report_rejected(
            report_id=report_id,
            doctor_address=current_user.wallet_address,
            reason=reason,
        )

        return {
            "success": True,
            "message": "Report rejected",
            "report_id": report_id,
            "reason": reason,
        }

    except Exception as e:
        logger.error(f"Rejection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/doctor/request-access")
async def request_patient_access(
    access_request: AccessRequest, current_user: User = Depends(get_current_user)
):
    """Doctor requests access to patient records"""
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Doctors only")

        return {
            "patient_address": access_request.patient_address,
            "purpose": access_request.purpose,
            "duration_days": access_request.duration_days,
            "doctor_address": current_user.wallet_address,
            "contract_address": settings.medical_system_contract,
            "message": "Call requestAccess() from frontend with doctor's wallet",
        }

    except Exception as e:
        logger.error(f"Access request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Verification & Public Endpoints
# ============================================================================


@app.post("/api/verify/document")
async def verify_document(file: UploadFile = File(...)):
    """Public endpoint to verify document authenticity"""
    try:
        file_content = await file.read()
        document_hash = blockchain_service.compute_hash(file_content)
        is_verified = await blockchain_service.verify_document(document_hash)

        if is_verified:
            record = await blockchain_service.get_record_by_hash(document_hash)
            return {
                "verified": True,
                "document_hash": document_hash,
                "record": record,
                "message": "✅ Document is verified on blockchain",
            }
        else:
            return {
                "verified": False,
                "document_hash": document_hash,
                "message": "❌ Document not found on blockchain",
            }

    except Exception as e:
        logger.error(f"Verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/verify/hash/{document_hash}")
async def verify_hash(document_hash: str):
    """Verify document by hash"""
    try:
        is_verified = await blockchain_service.verify_document(document_hash)

        if is_verified:
            record = await blockchain_service.get_record_by_hash(document_hash)
            return {
                "verified": True,
                "document_hash": document_hash,
                "record": record,
            }
        else:
            return {
                "verified": False,
                "document_hash": document_hash,
                "message": "Document not found",
            }

    except Exception as e:
        logger.error(f"Hash verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Organ Donor Registry Endpoints
# ============================================================================


@app.post("/api/organ-donor/register")
async def register_organ_donor(
    patient_id: str = Form(...),
    blood_type: str = Form(...),
    organ_type: str = Form(...),
    age: int = Form(...),
    tissue_type_hla: Optional[str] = Form(None),
    encrypted_medical_history: Optional[str] = Form(None),
    medical_certificate: UploadFile = File(...),
):
    """
    Register a patient as an organ donor
    
    - **patient_id**: Patient's Supabase UUID
    - **blood_type**: A+, A-, B+, B-, AB+, AB-, O+, O-
    - **organ_type**: Comma-separated organs (kidney, liver, heart, lung, pancreas, cornea)
    - **age**: Donor age (18-75)
    - **tissue_type_hla**: Optional HLA typing (e.g., A*02:01)
    - **encrypted_medical_history**: Optional encrypted medical history
    - **medical_certificate**: Medical clearance certificate file
    """
    try:
        logger.info(f"Registering organ donor: {patient_id}")

        # Check if already registered
        already_registered = await db_service.get_patient_donor_status(patient_id)
        if already_registered:
            raise HTTPException(
                status_code=400, detail="Patient already registered as organ donor"
            )

        # Validate blood type
        valid_blood_types = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        if blood_type not in valid_blood_types:
            raise HTTPException(status_code=400, detail="Invalid blood type")

        # Validate age
        if age < 18 or age > 75:
            raise HTTPException(status_code=400, detail="Age must be between 18 and 75")

        # Upload medical certificate to IPFS
        file_content = await medical_certificate.read()
        ipfs_result = await ipfs_service.upload_to_pinata(
            file_content, medical_certificate.filename or "medical_certificate.pdf"
        )

        if not ipfs_result.get("success"):
            raise HTTPException(
                status_code=500, detail="Failed to upload certificate to IPFS"
            )

        ipfs_cid = ipfs_result["cid"]  # Changed from ipfs_hash to cid

        # Register donor in database
        result = await db_service.register_organ_donor(
            patient_id=patient_id,
            blood_type=blood_type,
            organ_type=organ_type,
            age=age,
            tissue_type_hla=tissue_type_hla,
            encrypted_medical_history=encrypted_medical_history,
            ipfs_cid=ipfs_cid,
            is_active=True,
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to register organ donor"),
            )

        logger.info(f"✅ Organ donor registered successfully: {patient_id}")
        return {
            "success": True,
            "message": "Organ donor registered successfully",
            "data": {
                "patient_id": patient_id,
                "ipfs_cid": ipfs_cid,
                "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{ipfs_cid}",
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Organ donor registration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/organ-donor/search")
async def search_organ_donors(
    organ_type: str,
    blood_type: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    tissue_type_hla: Optional[str] = None,
    limit: int = 50,
):
    """
    Search for compatible organ donors
    
    - **organ_type**: Required - kidney, liver, heart, lung, pancreas, cornea
    - **blood_type**: Optional - A+, A-, B+, B-, AB+, AB-, O+, O-
    - **min_age**: Optional - Minimum donor age
    - **max_age**: Optional - Maximum donor age
    - **tissue_type_hla**: Optional - HLA tissue type for matching
    - **limit**: Maximum results (default 50)
    """
    try:

        logger.info(f"Doctor searching for organ donors: {organ_type}")

        # Search database
        donors = await db_service.search_organ_donors(
            organ_type=organ_type,
            blood_type=blood_type,
            min_age=min_age,
            max_age=max_age,
            tissue_type_hla=tissue_type_hla,
            limit=limit,
        )

        # Calculate compatibility scores
        enhanced_donors = []
        for donor in donors:
            compatibility_score = _calculate_compatibility_score(
                donor_blood_type=donor["blood_type"],
                recipient_blood_type=blood_type,
                donor_age=donor["age"],
                donor_hla=donor.get("tissue_type_hla"),
                recipient_hla=tissue_type_hla,
            )

            enhanced_donors.append(
                {
                    **donor,
                    "compatibility_score": round(compatibility_score, 2),
                    "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{donor['ipfs_cid']}",
                }
            )

        # Sort by compatibility score
        enhanced_donors.sort(key=lambda x: x["compatibility_score"], reverse=True)

        logger.info(f"✅ Found {len(enhanced_donors)} compatible donors")
        return {
            "success": True,
            "count": len(enhanced_donors),
            "donors": enhanced_donors,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Search organ donors failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/organ-donor/{patient_id}")
async def get_donor_details(
    patient_id: str
):
    """
    Get detailed information about a specific organ donor
    
    - **patient_id**: Donor's Supabase UUID
    """
    try:

        logger.info(f"Fetching donor details: {patient_id}")

        donor = await db_service.get_donor_by_id(patient_id)

        if not donor:
            raise HTTPException(status_code=404, detail="Donor not found")

        # Add IPFS URL
        donor["ipfs_url"] = f"https://gateway.pinata.cloud/ipfs/{donor['ipfs_cid']}"

        logger.info(f"✅ Retrieved donor details: {patient_id}")
        return {"success": True, "donor": donor}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get donor details failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/organ-donor/match")
async def create_organ_match(
    donor_patient_id: str = Form(...),
    recipient_patient_id: str = Form(...),
    organ_type: str = Form(...),
    compatibility_score: float = Form(...),
    matched_by: str = Form(...),
):
    """
    Create an organ match between donor and recipient
    
    - **donor_patient_id**: Donor's Supabase UUID
    - **recipient_patient_id**: Recipient's Supabase UUID
    - **organ_type**: Organ being matched
    - **compatibility_score**: Calculated compatibility score (0-100)
    - **matched_by**: Doctor's wallet address who created the match
    """
    try:
        logger.info(f"Creating organ match: {donor_patient_id} -> {recipient_patient_id}")

        # Create match in database
        result = await db_service.create_organ_match(
            donor_patient_id=donor_patient_id,
            recipient_patient_id=recipient_patient_id,
            organ_type=organ_type,
            compatibility_score=compatibility_score,
            match_details={
                "matched_by": matched_by,
                "organ_type": organ_type,
                "compatibility_score": compatibility_score,
            },
            matched_by=matched_by,
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to create organ match"),
            )

        logger.info(f"✅ Organ match created successfully")
        return {
            "success": True,
            "message": "Organ match created successfully",
            "match_id": result["data"]["id"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Create organ match failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _calculate_compatibility_score(
    donor_blood_type: str,
    recipient_blood_type: Optional[str],
    donor_age: int,
    donor_hla: Optional[str],
    recipient_hla: Optional[str],
) -> float:
    """Calculate compatibility score between donor and recipient (0-100)"""
    score = 0.0

    # Blood type compatibility (40 points)
    if recipient_blood_type:
        compatibility_map = {
            "A+": ["A+", "A-", "O+", "O-"],
            "A-": ["A-", "O-"],
            "B+": ["B+", "B-", "O+", "O-"],
            "B-": ["B-", "O-"],
            "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            "AB-": ["A-", "B-", "AB-", "O-"],
            "O+": ["O+", "O-"],
            "O-": ["O-"],
        }

        compatible_types = compatibility_map.get(recipient_blood_type, [])
        if donor_blood_type in compatible_types:
            score += 40.0
            # Perfect match bonus
            if donor_blood_type == recipient_blood_type:
                score += 10.0
    else:
        score += 40.0  # No recipient specified

    # Age factor (20 points) - prefer younger donors
    if donor_age <= 35:
        score += 20.0
    elif donor_age <= 50:
        score += 15.0
    elif donor_age <= 65:
        score += 10.0
    else:
        score += 5.0

    # HLA tissue match (30 points)
    if donor_hla and recipient_hla:
        # Simple string similarity for HLA matching
        if donor_hla == recipient_hla:
            score += 30.0
        elif donor_hla[:3] == recipient_hla[:3]:  # Partial match
            score += 15.0
    else:
        score += 15.0  # No HLA data available

    return min(score, 100.0)


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    logger.info(f"Starting MediBytes Backend on {settings.host}:{settings.port}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"CORS Origins: {settings.cors_origins_list}")

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
    )