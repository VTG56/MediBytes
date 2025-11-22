"""
MediBytes Backend - Configuration Settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Server
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    environment: str = os.getenv("ENVIRONMENT", "development")

    # Database (Supabase)
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # JWT
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expiry_hours: int = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

    # Blockchain
    blockchain_rpc_url: str = os.getenv(
        "BLOCKCHAIN_RPC_URL", "https://rpc-amoy.polygon.technology"
    )
    chain_id: int = int(os.getenv("CHAIN_ID", "80002"))

    # Smart Contracts
    medical_record_contract_address: str = os.getenv(
        "MEDICAL_RECORD_CONTRACT_ADDRESS",
        "0x745d52A59140ec1A6dEeeE38687256f8e3533845",
    )
    ehr_storage_contract: str = os.getenv("EHR_STORAGE_CONTRACT", "")
    access_control_contract: str = os.getenv("ACCESS_CONTROL_CONTRACT", "")
    organ_registry_contract: str = os.getenv("ORGAN_REGISTRY_CONTRACT", "")

    # Admin Wallet
    admin_private_key: str = os.getenv("ADMIN_PRIVATE_KEY", "")
    admin_wallet_address: str = os.getenv(
        "ADMIN_WALLET_ADDRESS", "0xEB1Dd2bc587B1C0801be9b14987AAf93897f4c30"
    )

    # IPFS (Pinata)
    pinata_api_key: str = os.getenv("PINATA_API_KEY", "")
    pinata_secret_api_key: str = os.getenv("PINATA_SECRET_API_KEY", "")
    pinata_jwt: str = os.getenv("PINATA_JWT", "")
    pinata_gateway: str = os.getenv(
        "PINATA_GATEWAY", "https://gateway.pinata.cloud"
    )

    # AI Services
    model_api_url: str = os.getenv("MODEL_API_URL", "http://localhost:5000/analyze")
    model_api_key: str = os.getenv("MODEL_API_KEY", "")

    # Encryption
    master_encryption_key: str = os.getenv("MASTER_ENCRYPTION_KEY", "")

    # CORS
    cors_origins: str = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    )

    # File Upload
    max_file_size_mb: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    allowed_file_types: str = os.getenv(
        "ALLOWED_FILE_TYPES", "pdf,jpg,jpeg,png,dicom"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def allowed_file_types_list(self) -> List[str]:
        """Get allowed file types as list"""
        return [ft.strip() for ft in self.allowed_file_types.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"


# Global settings instance
settings = Settings()
