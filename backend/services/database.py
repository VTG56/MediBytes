"""
MediBytes Backend - Database Service
Handles Supabase database operations for medical records and access control
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from supabase import create_client, Client

from config import settings
from models import PendingReport, AccessPermission


class DatabaseService:
    """Service for database operations via Supabase"""

    def __init__(self):
        self.supabase: Client = create_client(
            settings.supabase_url, settings.supabase_key
        )

    # ========================================================================
    # Connection Test
    # ========================================================================

    async def test_connection(self) -> bool:
        """Test Supabase connection"""
        try:
            # Try a simple query
            self.supabase.table("patients").select("id").limit(1).execute()
            print("✅ Supabase connection successful")
            return True
        except Exception as e:
            print(f"❌ Supabase connection failed: {e}")
            return False

    # ========================================================================
    # Patient Management
    # ========================================================================

    async def ensure_patient_exists(self, patient_id: str, email: Optional[str] = None) -> Dict[str, Any]:
        """Ensure patient record exists, create if not"""
        try:
            # Check if patient exists
            result = self.supabase.table("patients").select("*").eq("id", patient_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            # Patient doesn't exist, create it
            # Extract name from email or use generic name
            name = email.split('@')[0] if email else f"Patient_{patient_id[:8]}"
            
            patient_data = {
                "id": patient_id,
                "name": name,
                "email": email or f"{patient_id}@temp.com",
                "role": "patient",
                "created_at": datetime.utcnow().isoformat(),
            }
            
            insert_result = self.supabase.table("patients").insert(patient_data).execute()
            
            if insert_result.data:
                print(f"✅ Created patient record: {patient_id}")
                return insert_result.data[0]
            else:
                raise Exception("Failed to create patient record")
                
        except Exception as e:
            print(f"⚠️ Error ensuring patient exists: {e}")
            raise

    # ========================================================================
    # Pending Reports (Doctor Approval Workflow)
    # ========================================================================

    async def create_pending_report(
        self,
        patient_id: str,
        document_hash: str,
        ipfs_cid: str,
        report_type: str,
        report_date: str,
        facility: str,
        extracted_text_cid: Optional[str] = None,
        extracted_text: Optional[str] = None,
        symptoms: Optional[str] = None,
        ai_summary: Optional[str] = None,
        risk_level: Optional[str] = None,
        patient_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create new pending report (awaiting doctor approval)"""
        try:
            # Ensure patient exists before creating report
            await self.ensure_patient_exists(patient_id, patient_email)
            
            report_data = {
                "patient_id": patient_id,  # This maps to the patient_id column
                "document_hash": document_hash,
                "ipfs_cid": ipfs_cid,
                "extracted_text_cid": extracted_text_cid,  # Unencrypted text in IPFS
                "extracted_text": extracted_text,  # Also store in database
                "report_type": report_type,
                "report_date": report_date,
                "facility": facility,
                "symptoms": symptoms,
                "ai_summary": ai_summary,
                "risk_level": risk_level,
                "extracted_text_cid": extracted_text_cid,
                "extracted_text": extracted_text,
                "status": "pending",
            }
            
            # Add optional fields if provided
            if extracted_text_cid:
                report_data["extracted_text_cid"] = extracted_text_cid
            if extracted_text:
                report_data["extracted_text"] = extracted_text

            result = self.supabase.table("pending_reports").insert(report_data).execute()

            if result.data:
                return result.data[0]
            else:
                raise Exception("Failed to create pending report")

        except Exception as e:
            print(f"❌ Create pending report failed: {e}")
            raise Exception(f"Database error: {str(e)}")

    async def get_pending_reports(
        self, patient_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get pending reports (optionally filtered by patient)"""
        try:
            query = self.supabase.table("pending_reports").select("*")

            if patient_id:
                query = query.eq("patient_id", patient_id)

            query = query.eq("status", "pending").order("created_at", desc=True)

            result = query.execute()
            return result.data if result.data else []

        except Exception as e:
            print(f"❌ Get pending reports failed: {e}")
            return []

    async def get_all_patient_reports(
        self, patient_id: str
    ) -> List[Dict[str, Any]]:
        """Get all patient reports including pending and approved"""
        try:
            query = (
                self.supabase.table("pending_reports")
                .select("*")
                .eq("patient_id", patient_id)
                .order("created_at", desc=True)
            )

            result = query.execute()
            return result.data if result.data else []

        except Exception as e:
            print(f"❌ Get all patient reports failed: {e}")
            return []

    async def get_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Get single pending report by ID"""
        try:
            result = (
                self.supabase.table("pending_reports")
                .select("*")
                .eq("id", report_id)
                .single()
                .execute()
            )

            return result.data if result.data else None

        except Exception as e:
            print(f"❌ Get report by ID failed: {e}")
            return None

    async def mark_report_approved(
        self, report_id: str, doctor_address: str, tx_hash: str, document_hash: str = None, block_number: int = None
    ) -> bool:
        """Mark report as approved and added to blockchain"""
        try:
            update_data = {
                "status": "approved",
                "approved_by": doctor_address,
                "approved_at": datetime.utcnow().isoformat(),
                "blockchain_tx": tx_hash,
            }
            
            # Add block_number if provided
            if block_number is not None:
                update_data["block_number"] = block_number
            
            # Update document_hash if provided
            if document_hash:
                update_data["document_hash"] = document_hash
                print(f"✅ Storing document_hash in database: {document_hash[:32]}...")

            result = (
                self.supabase.table("pending_reports")
                .update(update_data)
                .eq("id", report_id)
                .execute()
            )

            return len(result.data) > 0 if result.data else False

        except Exception as e:
            print(f"❌ Mark report approved failed: {e}")
            return False

    async def mark_report_rejected(
        self, report_id: str, doctor_address: str, reason: Optional[str] = None
    ) -> bool:
        """Mark report as rejected"""
        try:
            update_data = {
                "status": "rejected",
                "rejected_by": doctor_address,
                "rejected_at": datetime.utcnow().isoformat(),
                "rejection_reason": reason,
            }

            result = (
                self.supabase.table("pending_reports")
                .update(update_data)
                .eq("id", report_id)
                .execute()
            )

            return len(result.data) > 0 if result.data else False

        except Exception as e:
            print(f"❌ Mark report rejected failed: {e}")
            return False

    # ========================================================================
    # Access Control (Patient-Doctor Permissions)
    # ========================================================================

    async def create_access_request(
        self,
        patient_address: str,
        doctor_address: str,
        purpose: str,
        duration_days: int = 365,
    ) -> Dict[str, Any]:
        """Create new access request"""
        try:
            expires_at = (
                datetime.utcnow() + timedelta(days=duration_days)
            ).isoformat()

            request_data = {
                "patient_address": patient_address,
                "doctor_address": doctor_address,
                "purpose": purpose,
                "status": "pending",
                "expires_at": expires_at,
                "created_at": datetime.utcnow().isoformat(),
            }

            result = (
                self.supabase.table("access_permissions").insert(request_data).execute()
            )

            if result.data:
                return result.data[0]
            else:
                raise Exception("Failed to create access request")

        except Exception as e:
            print(f"❌ Create access request failed: {e}")
            raise Exception(f"Database error: {str(e)}")

    async def get_access_requests(
        self, patient_address: str
    ) -> List[Dict[str, Any]]:
        """Get all access requests for patient"""
        try:
            result = (
                self.supabase.table("access_permissions")
                .select("*")
                .eq("patient_address", patient_address)
                .order("created_at", desc=True)
                .execute()
            )

            return result.data if result.data else []

        except Exception as e:
            print(f"❌ Get access requests failed: {e}")
            return []

    async def approve_access_request(
        self, request_id: str, tx_hash: str
    ) -> bool:
        """Approve access request"""
        try:
            update_data = {
                "status": "approved",
                "approved_at": datetime.utcnow().isoformat(),
                "blockchain_tx": tx_hash,
            }

            result = (
                self.supabase.table("access_permissions")
                .update(update_data)
                .eq("id", request_id)
                .execute()
            )

            return len(result.data) > 0 if result.data else False

        except Exception as e:
            print(f"❌ Approve access request failed: {e}")
            return False

    async def revoke_access(
        self, patient_address: str, doctor_address: str, tx_hash: str
    ) -> bool:
        """Revoke doctor access"""
        try:
            update_data = {
                "status": "revoked",
                "revoked_at": datetime.utcnow().isoformat(),
                "blockchain_tx": tx_hash,
            }

            result = (
                self.supabase.table("access_permissions")
                .update(update_data)
                .eq("patient_address", patient_address)
                .eq("doctor_address", doctor_address)
                .eq("status", "approved")
                .execute()
            )

            return len(result.data) > 0 if result.data else False

        except Exception as e:
            print(f"❌ Revoke access failed: {e}")
            return False

    async def has_active_access(
        self, patient_address: str, doctor_address: str
    ) -> bool:
        """Check if doctor has active access to patient records"""
        try:
            result = (
                self.supabase.table("access_permissions")
                .select("id")
                .eq("patient_address", patient_address)
                .eq("doctor_address", doctor_address)
                .eq("status", "approved")
                .gt("expires_at", datetime.utcnow().isoformat())
                .execute()
            )

            return len(result.data) > 0 if result.data else False

        except Exception as e:
            print(f"❌ Check access failed: {e}")
            return False

    # ========================================================================
    # Patient Management
    # ========================================================================

    async def get_patient_by_id(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Get patient by ID"""
        try:
            result = (
                self.supabase.table("patients")
                .select("*")
                .eq("id", patient_id)
                .single()
                .execute()
            )

            return result.data if result.data else None

        except Exception as e:
            print(f"❌ Get patient failed: {e}")
            return None

    async def get_patient_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get patient by email"""
        try:
            result = (
                self.supabase.table("patients")
                .select("*")
                .eq("email", email)
                .single()
                .execute()
            )

            return result.data if result.data else None

        except Exception as e:
            print(f"❌ Get patient by email failed: {e}")
            return None

    async def update_patient_blockchain_address(
        self, patient_id: str, blockchain_address: str
    ) -> bool:
        """Update patient's blockchain address"""
        try:
            update_data = {"blockchain_address": blockchain_address}

            result = (
                self.supabase.table("patients")
                .update(update_data)
                .eq("id", patient_id)
                .execute()
            )

            return len(result.data) > 0 if result.data else False

        except Exception as e:
            print(f"❌ Update blockchain address failed: {e}")
            return False

    # ========================================================================
    # Doctor Management
    # ========================================================================

    async def get_doctor_by_wallet(
        self, wallet_address: str
    ) -> Optional[Dict[str, Any]]:
        """Get doctor by wallet address"""
        try:
            result = (
                self.supabase.table("doctors")
                .select("*")
                .eq("wallet_address", wallet_address.lower())
                .single()
                .execute()
            )

            return result.data if result.data else None

        except Exception as e:
            print(f"❌ Get doctor by wallet failed: {e}")
            return None

    async def create_or_update_doctor(
        self, wallet_address: str, name: str, license_number: str, specialization: str
    ) -> Dict[str, Any]:
        """Create or update doctor record"""
        try:
            doctor_data = {
                "wallet_address": wallet_address.lower(),
                "name": name,
                "license_number": license_number,
                "specialization": specialization,
                "last_login": datetime.utcnow().isoformat(),
            }

            # Try to get existing doctor
            existing = await self.get_doctor_by_wallet(wallet_address)

            if existing:
                # Update
                result = (
                    self.supabase.table("doctors")
                    .update(doctor_data)
                    .eq("wallet_address", wallet_address.lower())
                    .execute()
                )
            else:
                # Create
                result = self.supabase.table("doctors").insert(doctor_data).execute()

            if result.data:
                return result.data[0]
            else:
                raise Exception("Failed to create/update doctor")

        except Exception as e:
            print(f"❌ Create/update doctor failed: {e}")
            raise Exception(f"Database error: {str(e)}")

    # ========================================================================
    # Medical Records Lookup
    # ========================================================================

    async def get_approved_reports(self, patient_id: str) -> List[Dict[str, Any]]:
        """Get all approved reports for patient"""
        try:
            result = (
                self.supabase.table("pending_reports")
                .select("*")
                .eq("patient_id", patient_id)
                .eq("status", "approved")
                .order("report_date", desc=True)
                .execute()
            )

            return result.data if result.data else []

        except Exception as e:
            print(f"❌ Get approved reports failed: {e}")
            return []

    async def search_reports(
        self,
        patient_id: str,
        report_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Search reports with filters"""
        try:
            query = (
                self.supabase.table("pending_reports")
                .select("*")
                .eq("patient_id", patient_id)
                .eq("status", "approved")
            )

            if report_type:
                query = query.eq("report_type", report_type)

            if start_date:
                query = query.gte("report_date", start_date)

            if end_date:
                query = query.lte("report_date", end_date)

            result = query.order("report_date", desc=True).execute()

            return result.data if result.data else []

        except Exception as e:
            print(f"❌ Search reports failed: {e}")
            return []

    # ========================================================================
    # Organ Donor Registry Operations
    # ========================================================================

    async def register_organ_donor(
        self,
        patient_id: str,
        blood_type: str,
        organ_type: str,
        age: int,
        tissue_type_hla: Optional[str],
        encrypted_medical_history: Optional[str],
        ipfs_cid: str,
        is_active: bool = True,
    ) -> Dict[str, Any]:
        """Register a new organ donor in the database"""
        try:
            donor_data = {
                "patient_id": patient_id,
                "blood_type": blood_type,
                "organ_type": organ_type,
                "age": age,
                "tissue_type_hla": tissue_type_hla,
                "encrypted_medical_history": encrypted_medical_history,
                "ipfs_cid": ipfs_cid,
                "is_active": is_active,
                "created_at": datetime.utcnow().isoformat(),
            }

            result = self.supabase.table("organ_donor_data").insert(donor_data).execute()

            if result.data:
                print(f"✅ Organ donor registered: {patient_id}")
                return {"success": True, "data": result.data[0]}
            else:
                print(f"❌ Organ donor registration failed")
                return {"success": False, "error": "Database insert failed"}

        except Exception as e:
            print(f"❌ Register organ donor failed: {e}")
            return {"success": False, "error": str(e)}

    async def search_organ_donors(
        self,
        organ_type: str,
        blood_type: Optional[str] = None,
        min_age: Optional[int] = None,
        max_age: Optional[int] = None,
        tissue_type_hla: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Search for compatible organ donors with filters"""
        try:
            query = (
                self.supabase.table("organ_donor_data")
                .select("*")
                .eq("is_active", True)
                .like("organ_type", f"%{organ_type}%")
            )

            if blood_type:
                # Blood type compatibility logic
                compatible_types = self._get_compatible_blood_types(blood_type)
                query = query.in_("blood_type", compatible_types)

            if min_age:
                query = query.gte("age", min_age)

            if max_age:
                query = query.lte("age", max_age)

            if tissue_type_hla:
                query = query.eq("tissue_type_hla", tissue_type_hla)

            result = query.limit(limit).order("created_at", desc=True).execute()

            donors = result.data if result.data else []
            print(f"✅ Found {len(donors)} compatible donors")
            return donors

        except Exception as e:
            print(f"❌ Search organ donors failed: {e}")
            return []

    async def get_donor_by_id(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed donor information by patient ID"""
        try:
            result = (
                self.supabase.table("organ_donor_data")
                .select("*")
                .eq("patient_id", patient_id)
                .execute()
            )

            if result.data:
                print(f"✅ Retrieved donor: {patient_id}")
                return result.data[0]
            else:
                print(f"❌ Donor not found: {patient_id}")
                return None

        except Exception as e:
            print(f"❌ Get donor by id failed: {e}")
            return None

    async def create_organ_match(
        self,
        donor_patient_id: str,
        recipient_patient_id: str,
        organ_type: str,
        compatibility_score: float,
        match_details: Optional[Dict[str, Any]] = None,
        matched_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create an organ match record between donor and recipient"""
        try:
            match_data = {
                "donor_patient_id": donor_patient_id,
                "recipient_patient_id": recipient_patient_id,
                "organ_type": organ_type,
                "compatibility_score": compatibility_score,
                "match_details": match_details,
                "match_status": "pending",
                "matched_by": matched_by,
                "created_at": datetime.utcnow().isoformat(),
            }

            result = self.supabase.table("organ_matches").insert(match_data).execute()

            if result.data:
                print(f"✅ Organ match created: {donor_patient_id} -> {recipient_patient_id}")
                return {"success": True, "data": result.data[0]}
            else:
                print(f"❌ Organ match creation failed")
                return {"success": False, "error": "Database insert failed"}

        except Exception as e:
            print(f"❌ Create organ match failed: {e}")
            return {"success": False, "error": str(e)}

    async def get_patient_donor_status(self, patient_id: str) -> bool:
        """Check if patient is already registered as a donor"""
        try:
            result = (
                self.supabase.table("organ_donor_data")
                .select("patient_id")
                .eq("patient_id", patient_id)
                .execute()
            )

            return bool(result.data)

        except Exception as e:
            print(f"❌ Get patient donor status failed: {e}")
            return False

    def _get_compatible_blood_types(self, recipient_blood_type: str) -> List[str]:
        """Get compatible donor blood types for a recipient"""
        # Blood type compatibility matrix
        compatibility_map = {
            "A+": ["A+", "A-", "O+", "O-"],
            "A-": ["A-", "O-"],
            "B+": ["B+", "B-", "O+", "O-"],
            "B-": ["B-", "O-"],
            "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],  # Universal recipient
            "AB-": ["A-", "B-", "AB-", "O-"],
            "O+": ["O+", "O-"],
            "O-": ["O-"],  # Universal donor
        }

        return compatibility_map.get(recipient_blood_type, [recipient_blood_type])
