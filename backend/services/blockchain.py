"""
MediBytes Backend - Blockchain Service
Handles Web3 interactions with MedicalRecordSystem smart contract
"""

from typing import Dict, Any, List, Optional
from web3 import Web3
from eth_account import Account
from datetime import datetime
import json
import hashlib
import logging

from config import settings

logger = logging.getLogger(__name__)


class BlockchainService:
    """Service for blockchain interactions"""

    def __init__(self):
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(settings.blockchain_rpc_url))

        # Add PoA middleware for Polygon (newer Web3.py versions)
        try:
            from web3.middleware import ExtraDataToPOAMiddleware
            self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        except ImportError:
            # Fallback for older versions
            try:
                from web3.middleware import geth_poa_middleware
                self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
            except:
                pass  # Skip if middleware not available

        # Load admin account (backend wallet for patient operations)
        self.admin_account = Account.from_key(settings.admin_private_key)

        # Load smart contract
        with open("contracts/MedicalRecordSystem.json", "r") as f:
            contract_json = json.load(f)
            self.contract_abi = contract_json["abi"]

        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(settings.medical_record_contract_address),
            abi=self.contract_abi,
        )

        print(f"✅ Blockchain connected: {self.w3.is_connected()}")
        print(f"📝 Contract: {settings.medical_record_contract_address}")
        print(f"🔐 Admin wallet: {self.admin_account.address}")

    # ========================================================================
    # Connection & Validation
    # ========================================================================

    def is_connected(self) -> bool:
        """Check if connected to blockchain"""
        return self.w3.is_connected()

    def get_balance(self, address: str) -> float:
        """Get wallet balance in MATIC"""
        balance_wei = self.w3.eth.get_balance(address)
        return self.w3.from_wei(balance_wei, "ether")

    def compute_hash(self, data: bytes) -> str:
        """
        Compute SHA256 hash of data for blockchain storage
        Returns hex string with 0x prefix (bytes32 format)
        """
        hash_bytes = hashlib.sha256(data).digest()
        return "0x" + hash_bytes.hex()

    # ========================================================================
    # Patient Operations (Admin Wallet Mediated)
    # ========================================================================

    async def register_patient(self, patient_address: str) -> Dict[str, Any]:
        """Register patient on blockchain (called by backend)"""
        try:
            # Check if already registered
            is_registered = self.contract.functions.patientAddresses(
                patient_address
            ).call()
            if is_registered:
                return {
                    "success": True,
                    "message": "Patient already registered",
                    "address": patient_address,
                }

            # Build transaction
            tx = self.contract.functions.registerPatient(
                Web3.to_checksum_address(patient_address)
            ).build_transaction(
                {
                    "from": self.admin_account.address,
                    "nonce": self.w3.eth.get_transaction_count(
                        self.admin_account.address
                    ),
                    "gas": 200000,
                    "gasPrice": self.w3.eth.gas_price,
                }
            )

            # Sign and send
            signed_tx = self.w3.eth.account.sign_transaction(
                tx, self.admin_account.key
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return {
                "success": receipt["status"] == 1,
                "tx_hash": tx_hash.hex(),
                "block": receipt["blockNumber"],
                "address": patient_address,
            }

        except Exception as e:
            print(f"❌ Register patient failed: {e}")
            raise Exception(f"Blockchain error: {str(e)}")

    async def add_medical_record(
        self,
        patient_address: str,
        document_hash: str,
        ipfs_cid: str,
        report_type: str,
        metadata_cid: str,
    ) -> Dict[str, Any]:
        """Add medical record to blockchain (admin wallet)"""
        try:
            # Build transaction
            tx = self.contract.functions.addMedicalRecord(
                Web3.to_checksum_address(patient_address),
                document_hash,
                ipfs_cid,
                report_type,
                metadata_cid,
            ).build_transaction(
                {
                    "from": self.admin_account.address,
                    "nonce": self.w3.eth.get_transaction_count(
                        self.admin_account.address
                    ),
                    "gas": 300000,
                    "gasPrice": self.w3.eth.gas_price,
                }
            )

            # Sign and send
            signed_tx = self.w3.eth.account.sign_transaction(
                tx, self.admin_account.key
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return {
                "success": receipt["status"] == 1,
                "tx_hash": tx_hash.hex(),
                "block": receipt["blockNumber"],
            }

        except Exception as e:
            print(f"❌ Add medical record failed: {e}")
            raise Exception(f"Blockchain error: {str(e)}")

    # ========================================================================
    # Doctor Operations (Read-only or return data for signing)
    # ========================================================================

    async def is_registered_doctor(self, doctor_address: str) -> bool:
        """Check if address is registered doctor"""
        try:
            return self.contract.functions.doctorAddresses(doctor_address).call()
        except Exception as e:
            print(f"❌ Check doctor failed: {e}")
            return False

    async def get_doctor_info(self, doctor_address: str) -> Optional[Dict[str, Any]]:
        """Get doctor information"""
        try:
            doctor = self.contract.functions.getDoctorInfo(doctor_address).call()

            return {
                "wallet_address": doctor[0],
                "name": doctor[1],
                "license_number": doctor[2],
                "specialization": doctor[3],
                "active": doctor[4],
            }

        except Exception as e:
            print(f"❌ Get doctor info failed: {e}")
            return None

    # ========================================================================
    # Access Control (Admin wallet for patients)
    # ========================================================================

    async def approve_access(
        self, patient_address: str, doctor_address: str, duration_days: int = 365
    ) -> Dict[str, Any]:
        """Approve doctor access (admin wallet)"""
        try:
            tx = self.contract.functions.approveAccess(
                Web3.to_checksum_address(doctor_address), duration_days
            ).build_transaction(
                {
                    "from": Web3.to_checksum_address(patient_address),
                    "nonce": self.w3.eth.get_transaction_count(patient_address),
                    "gas": 200000,
                    "gasPrice": self.w3.eth.gas_price,
                }
            )

            # For patient operations, we sign with admin wallet
            # (In production, patient's derived key would be used)
            signed_tx = self.w3.eth.account.sign_transaction(
                tx, self.admin_account.key
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return {
                "success": receipt["status"] == 1,
                "tx_hash": tx_hash.hex(),
                "block": receipt["blockNumber"],
            }

        except Exception as e:
            print(f"❌ Approve access failed: {e}")
            raise Exception(f"Blockchain error: {str(e)}")

    async def revoke_access(
        self, patient_address: str, doctor_address: str
    ) -> Dict[str, Any]:
        """Revoke doctor access (admin wallet)"""
        try:
            tx = self.contract.functions.revokeAccess(
                Web3.to_checksum_address(doctor_address)
            ).build_transaction(
                {
                    "from": Web3.to_checksum_address(patient_address),
                    "nonce": self.w3.eth.get_transaction_count(patient_address),
                    "gas": 200000,
                    "gasPrice": self.w3.eth.gas_price,
                }
            )

            signed_tx = self.w3.eth.account.sign_transaction(
                tx, self.admin_account.key
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return {
                "success": receipt["status"] == 1,
                "tx_hash": tx_hash.hex(),
                "block": receipt["blockNumber"],
            }

        except Exception as e:
            print(f"❌ Revoke access failed: {e}")
            raise Exception(f"Blockchain error: {str(e)}")

    async def has_access(self, patient_address: str, doctor_address: str) -> bool:
        """Check if doctor has access to patient records"""
        try:
            return self.contract.functions.hasAccess(
                patient_address, doctor_address
            ).call()
        except Exception as e:
            print(f"❌ Check access failed: {e}")
            return False

    # ========================================================================
    # Verification
    # ========================================================================

    async def verify_document(self, document_hash: str) -> Optional[Dict[str, Any]]:
        """Verify document exists on blockchain"""
        try:
            record = self.contract.functions.verifyDocument(document_hash).call()

            if record[1] == "":  # ipfsCID is empty
                return None

            return {
                "document_hash": record[0],
                "ipfs_cid": record[1],
                "patient_address": record[2],
                "timestamp": record[3],
                "report_type": record[4],
                "issued_by": record[5],
                "is_valid": record[6],
                "metadata_cid": record[7] if len(record) > 7 else "",
            }

        except Exception as e:
            print(f"❌ Verify document failed: {e}")
            return None

    async def get_patient_records(self, patient_address: str) -> List[Dict[str, Any]]:
        """Get all medical records for patient from blockchain"""
        try:
            logger.info(f"🔍 Fetching blockchain records for patient: {patient_address}")
            
            # Convert to checksum address
            try:
                checksum_address = Web3.to_checksum_address(patient_address)
                logger.info(f"✅ Checksum address: {checksum_address}")
            except Exception as e:
                logger.error(f"❌ Invalid address format: {patient_address}, error: {e}")
                return []
            
            # Step 1: Get all document hashes for the patient
            try:
                document_hashes = self.contract.functions.getPatientRecords(
                    checksum_address
                ).call()
                logger.info(f"📋 Found {len(document_hashes)} document hashes for patient {checksum_address}")
            except Exception as e:
                logger.error(f"❌ Failed to call getPatientRecords: {e}")
                return []
            
            if not document_hashes:
                logger.info("ℹ️ No blockchain records found for this patient")
                return []
            
            # Step 2: Fetch details for each record
            records = []
            for idx, doc_hash in enumerate(document_hashes):
                try:
                    logger.info(f"📄 Fetching details for record {idx + 1}/{len(document_hashes)}: {doc_hash.hex()}")
                    
                    # ✅ CRITICAL FIX: Call from admin account to bypass access control
                    # getRecordDetails returns: (ipfsCID, reportType, issuingFacility, patient, issuedBy, issuedDate, approvedAt, isDoctorVerified, metadata)
                    details = self.contract.functions.getRecordDetails(doc_hash).call({
                        'from': self.admin_account.address  # ✅ Use admin wallet as msg.sender
                    })
                    
                    record = {
                        "document_hash": doc_hash.hex(),
                        "ipfs_cid": details[0],
                        "report_type": details[1],
                        "issuing_facility": details[2],
                        "patient_address": details[3],
                        "issued_by": details[4],
                        "issued_date": details[5],
                        "approved_at": details[6],
                        "is_doctor_verified": details[7],
                        "metadata": details[8],
                        "ipfs_gateway_url": f"https://gateway.pinata.cloud/ipfs/{details[0]}"
                    }
                    
                    records.append(record)
                    logger.info(f"✅ Record {idx + 1} fetched: {details[1]} from {details[2]}")
                    
                except Exception as e:
                    logger.error(f"❌ Failed to fetch details for hash {doc_hash.hex()}: {e}")
                    import traceback
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    continue
            
            logger.info(f"🎉 Successfully fetched {len(records)} complete records from blockchain")
            return records

        except Exception as e:
            logger.error(f"❌ Get patient records failed: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []

    # ========================================================================
    # Transaction Utilities
    # ========================================================================

    def get_transaction_receipt(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Get transaction receipt"""
        try:
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            return {
                "block_number": receipt["blockNumber"],
                "gas_used": receipt["gasUsed"],
                "status": receipt["status"],
            }
        except Exception as e:
            print(f"❌ Get receipt failed: {e}")
            return None

    def build_transaction_for_frontend(
        self, function_call, from_address: str
    ) -> Dict[str, Any]:
        """
        Build unsigned transaction for frontend to sign
        Used for doctor operations that require MetaMask signature
        """
        try:
            tx = function_call.build_transaction(
                {
                    "from": Web3.to_checksum_address(from_address),
                    "nonce": self.w3.eth.get_transaction_count(from_address),
                    "gas": 300000,
                    "gasPrice": self.w3.eth.gas_price,
                }
            )

            return {
                "to": tx["to"],
                "data": tx["data"],
                "gas": tx["gas"],
                "gasPrice": tx["gasPrice"],
                "nonce": tx["nonce"],
                "chainId": settings.chain_id,
            }

        except Exception as e:
            print(f"❌ Build transaction failed: {e}")
            raise Exception(f"Transaction build error: {str(e)}")
