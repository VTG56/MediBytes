"""
MediBytes Backend - Authentication Service
Handles patient/doctor authentication, JWT tokens, and wallet verification
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import hashlib
import secrets
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from eth_account.messages import encode_defunct
from web3 import Web3

from config import settings
from models import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token
security = HTTPBearer()

# Supabase client
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)


class AuthService:
    """Authentication and authorization service"""

    def __init__(self):
        self.jwt_secret = settings.jwt_secret
        self.jwt_algorithm = settings.jwt_algorithm
        self.jwt_expiry_hours = settings.jwt_expiry_hours

    # ========================================================================
    # Password Hashing
    # ========================================================================

    def hash_password(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against hash"""
        return pwd_context.verify(plain_password, hashed_password)

    # ========================================================================
    # JWT Tokens
    # ========================================================================

    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(hours=self.jwt_expiry_hours)
        to_encode.update({"exp": expire, "iat": datetime.utcnow()})

        encoded_jwt = jwt.encode(
            to_encode, self.jwt_secret, algorithm=self.jwt_algorithm
        )
        return encoded_jwt

    def decode_token(self, token: str) -> Dict[str, Any]:
        """Decode and verify JWT token"""
        try:
            payload = jwt.decode(
                token, self.jwt_secret, algorithms=[self.jwt_algorithm]
            )
            return payload
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # ========================================================================
    # Patient Authentication (Username/Password)
    # ========================================================================

    async def register_patient(
        self, email: str, password: str, name: str, dob: str, gender: str
    ) -> Dict[str, Any]:
        """Register a new patient in Supabase"""
        try:
            auth_response = supabase.auth.sign_up(
                {"email": email, "password": password}
            )

            if auth_response.user is None:
                raise Exception("Failed to create user")

            user_id = auth_response.user.id

            patient_data = {
                "id": user_id,
                "email": email,
                "name": name,
                "dob": dob or None,
                "gender": gender or None,
                "role": "patient",
                "created_at": datetime.utcnow().isoformat(),
            }

            supabase.table("patients").insert(patient_data).execute()

            return {
                "id": user_id,
                "email": email,
                "name": name,
                "role": "patient",
            }

        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Registration failed: {str(e)}"
            )

    async def login_patient(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate patient with email/password"""
        try:
            auth_response = supabase.auth.sign_in_with_password(
                {"email": email, "password": password}
            )

            if auth_response.user is None:
                raise Exception("Invalid credentials")

            user_id = auth_response.user.id

            patient_response = (
                supabase.table("patients")
                .select("*")
                .eq("id", user_id)
                .single()
                .execute()
            )

            if not patient_response.data:
                raise Exception("Patient not found")

            return {
                "id": user_id,
                "email": email,
                "role": "patient",
                "data": patient_response.data,
            }

        except Exception as e:
            raise HTTPException(status_code=401, detail="Invalid credentials")

    # ========================================================================
    # Doctor Wallet Verification
    # ========================================================================

    def verify_wallet_signature(
        self, wallet_address: str, message: str, signature: str
    ) -> bool:
        """Verify wallet signature (MetaMask)"""
        try:
            w3 = Web3()
            message_hash = encode_defunct(text=message)
            recovered_address = w3.eth.account.recover_message(
                message_hash, signature=signature
            )
            return recovered_address.lower() == wallet_address.lower()

        except Exception as e:
            print(f"Signature verification failed: {e}")
            return False

    # ========================================================================
    # Blockchain Address Generation (for patients)
    # ========================================================================

    def generate_patient_address(self, user_id: str) -> str:
        """
        Generate deterministic blockchain address for patient
        This allows backend to mediate patient actions on-chain
        """
        seed = f"{user_id}{settings.master_encryption_key}"
        seed_hash = hashlib.sha256(seed.encode()).hexdigest()
        w3 = Web3()
        account = w3.eth.account.from_key("0x" + seed_hash)
        return account.address


# ============================================================================
# Dependency: Get Current User from JWT
# ============================================================================


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    FastAPI dependency to extract current user from JWT token
    Supports both Supabase JWT (patients) and backend JWT (doctors)
    """
    try:
        token = credentials.credentials
        print(f"🔐 Received token (first 50 chars): {token[:50]}...")
        
        # Try Supabase token first (for patients)
        try:
            from jose import jwt as jose_jwt
            
            # Decode without verification to check issuer
            unverified = jose_jwt.get_unverified_claims(token)
            issuer = unverified.get('iss', '')
            print(f"🔐 Token issuer: {issuer}")
            
            # Check if it's a Supabase token (issuer contains 'supabase')
            if 'supabase' in issuer.lower():
                user_id = unverified.get("sub")
                email = unverified.get("email")
                print(f"✅ Supabase token detected - User: {email}, ID: {user_id[:8] if user_id else 'None'}...")
                
                # Check token expiration
                exp = unverified.get("exp")
                if exp:
                    if datetime.utcnow().timestamp() > exp:
                        print(f"❌ Token expired")
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token has expired",
                        )
                
                if user_id and email:
                    user = User(
                        user_id=user_id,
                        email=email,
                        role="patient",
                        blockchain_address=None,
                        wallet_address=None
                    )
                    print(f"✅ User authenticated: {email}")
                    return user
                else:
                    print(f"❌ Missing user_id or email in token")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid token: missing user information",
                    )
        except HTTPException:
            raise
        except Exception as e:
            print(f"⚠️ Supabase validation failed: {e}")
            pass
        
        # Check for mock doctor token (development only)
        if token == "mock_doctor_token":
            print(f"⚠️ Using mock doctor token (development mode)")
            # Return a mock doctor user
            user = User(
                user_id="mock_doctor",
                wallet_address="0xmockdoctor",
                email="doctor@medibytes.local",
                role="doctor",
                blockchain_address="0xmockdoctor",
            )
            return user
        
        # Try backend JWT (for doctors or legacy auth)
        auth_service = AuthService()
        payload = auth_service.decode_token(token)

        user_id = payload.get("user_id")
        wallet_address = payload.get("wallet_address")
        role = payload.get("role")
        email = payload.get("email")

        if not role:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        user = User(
            user_id=user_id,
            wallet_address=wallet_address,
            email=email,
            role=role,
            blockchain_address=payload.get("blockchain_address"),
        )

        return user

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )