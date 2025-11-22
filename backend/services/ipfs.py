"""
MediBytes Backend - IPFS Service
Handles Pinata integration for decentralized file storage
"""

from typing import Dict, Any, Optional, List
import aiohttp
import requests
import json
from datetime import datetime
import hashlib
from cryptography.fernet import Fernet
import base64

from config import settings


class IPFSService:
    """Service for IPFS operations via Pinata"""

    def __init__(self):
        self.pinata_api_key = settings.pinata_api_key
        self.pinata_secret_key = settings.pinata_secret_api_key
        self.pinata_jwt = settings.pinata_jwt
        self.pinata_gateway = settings.pinata_gateway

        self.headers = {
            "Authorization": f"Bearer {self.pinata_jwt}",
            "pinata_api_key": self.pinata_api_key,
            "pinata_secret_api_key": self.pinata_secret_key,
        }

    # ========================================================================
    # Connection Test
    # ========================================================================

    async def test_connection(self) -> bool:
        """Test Pinata connection"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://api.pinata.cloud/data/testAuthentication",
                    headers=self.headers,
                ) as response:
                    if response.status == 200:
                        print("✅ Pinata connection successful")
                        return True
                    else:
                        print(f"❌ Pinata connection failed: {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Pinata test failed: {e}")
            return False

    # ========================================================================
    # Encryption (for patient data privacy)
    # ========================================================================

    def _get_encryption_key(self, patient_address: str) -> bytes:
        """
        Generate encryption key from patient address
        In production, use more secure key derivation
        """
        # Hash patient address to create 32-byte key
        key_material = hashlib.sha256(
            f"{patient_address}{settings.master_encryption_key}".encode()
        ).digest()

        # Fernet requires base64-encoded 32-byte key
        return base64.urlsafe_b64encode(key_material)

    def encrypt_file(self, file_content: bytes, patient_address: str) -> bytes:
        """Encrypt file content for patient"""
        try:
            key = self._get_encryption_key(patient_address)
            cipher = Fernet(key)
            encrypted = cipher.encrypt(file_content)
            return encrypted
        except Exception as e:
            print(f"❌ Encryption failed: {e}")
            raise Exception(f"Encryption error: {str(e)}")

    def decrypt_file(self, encrypted_content: bytes, patient_address: str) -> bytes:
        """Decrypt file content for patient"""
        try:
            key = self._get_encryption_key(patient_address)
            cipher = Fernet(key)
            decrypted = cipher.decrypt(encrypted_content)
            return decrypted
        except Exception as e:
            print(f"❌ Decryption failed: {e}")
            raise Exception(f"Decryption error: {str(e)}")

    # ========================================================================
    # Upload to Pinata
    # ========================================================================

    async def upload_to_pinata(
        self, file_content: bytes, filename: str, metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Upload file to Pinata IPFS
        Returns CID and IPFS URL
        """
        try:
            # Prepare metadata
            pinata_metadata = {
                "name": filename,
                "keyvalues": metadata or {},
            }

            # Prepare file
            files = {
                "file": (filename, file_content),
                "pinataMetadata": (None, json.dumps(pinata_metadata)),
            }

            # Upload to Pinata
            response = requests.post(
                "https://api.pinata.cloud/pinning/pinFileToIPFS",
                headers={"Authorization": f"Bearer {self.pinata_jwt}"},
                files=files,
            )

            if response.status_code != 200:
                raise Exception(f"Pinata upload failed: {response.text}")

            result = response.json()
            cid = result["IpfsHash"]

            return {
                "success": True,
                "cid": cid,
                "ipfs_url": f"ipfs://{cid}",
                "gateway_url": f"{self.pinata_gateway}/ipfs/{cid}",
                "size": result.get("PinSize", 0),
                "timestamp": result.get("Timestamp", datetime.utcnow().isoformat()),
            }

        except Exception as e:
            print(f"❌ Pinata upload failed: {e}")
            raise Exception(f"IPFS upload error: {str(e)}")

    async def upload_json(
        self, json_data: Dict[str, Any], name: str = "metadata.json"
    ) -> Dict[str, Any]:
        """Upload JSON metadata to Pinata"""
        try:
            payload = {
                "pinataContent": json_data,
                "pinataMetadata": {"name": name},
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                    headers=self.headers,
                    json=payload,
                ) as response:
                    if response.status != 200:
                        text = await response.text()
                        raise Exception(f"JSON upload failed: {text}")

                    result = await response.json()
                    cid = result["IpfsHash"]

                    return {
                        "success": True,
                        "cid": cid,
                        "ipfs_url": f"ipfs://{cid}",
                        "gateway_url": f"{self.pinata_gateway}/ipfs/{cid}",
                    }

        except Exception as e:
            print(f"❌ JSON upload failed: {e}")
            raise Exception(f"JSON upload error: {str(e)}")

    # ========================================================================
    # Fetch from IPFS
    # ========================================================================

    async def fetch_from_ipfs(self, cid: str) -> bytes:
        """Fetch file from IPFS via Pinata gateway"""
        try:
            url = f"{self.pinata_gateway}/ipfs/{cid}"

            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        raise Exception(f"Failed to fetch: {response.status}")

                    content = await response.read()
                    return content

        except Exception as e:
            print(f"❌ IPFS fetch failed: {e}")
            raise Exception(f"IPFS fetch error: {str(e)}")

    async def fetch_json(self, cid: str) -> Dict[str, Any]:
        """Fetch JSON metadata from IPFS"""
        try:
            content = await self.fetch_from_ipfs(cid)
            return json.loads(content.decode("utf-8"))
        except Exception as e:
            print(f"❌ JSON fetch failed: {e}")
            raise Exception(f"JSON fetch error: {str(e)}")

    # ========================================================================
    # Pin Management
    # ========================================================================

    async def pin_by_cid(self, cid: str) -> bool:
        """Pin existing IPFS content"""
        try:
            payload = {"hashToPin": cid}

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.pinata.cloud/pinning/pinByHash",
                    headers=self.headers,
                    json=payload,
                ) as response:
                    return response.status == 200

        except Exception as e:
            print(f"❌ Pin failed: {e}")
            return False

    async def unpin(self, cid: str) -> bool:
        """Unpin content from Pinata"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.delete(
                    f"https://api.pinata.cloud/pinning/unpin/{cid}",
                    headers=self.headers,
                ) as response:
                    return response.status == 200

        except Exception as e:
            print(f"❌ Unpin failed: {e}")
            return False

    async def get_pinned_files(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get list of pinned files"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://api.pinata.cloud/data/pinList?status=pinned&pageLimit={limit}",
                    headers=self.headers,
                ) as response:
                    if response.status != 200:
                        return []

                    result = await response.json()
                    return result.get("rows", [])

        except Exception as e:
            print(f"❌ Get pinned files failed: {e}")
            return []

    # ========================================================================
    # Utility Functions
    # ========================================================================

    def calculate_file_hash(self, file_content: bytes) -> str:
        """Calculate SHA-256 hash of file"""
        return hashlib.sha256(file_content).hexdigest()

    def is_valid_cid(self, cid: str) -> bool:
        """Basic CID validation"""
        # CIDv0 starts with Qm and is 46 characters
        # CIDv1 starts with b and varies in length
        if cid.startswith("Qm") and len(cid) == 46:
            return True
        if cid.startswith("b"):
            return True
        return False
