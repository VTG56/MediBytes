import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    ML_MODELS_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml_models')
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # OCR Configuration
    OCR_LANGUAGES = ['en']
    OCR_GPU = True
    
    # Health metrics reference ranges
    REFERENCE_RANGES = {
        'hemoglobin': {'min': 12.0, 'max': 16.0, 'unit': 'g/dL'},
        'glucose': {'min': 70, 'max': 100, 'unit': 'mg/dL'},
        'cholesterol': {'min': 0, 'max': 200, 'unit': 'mg/dL'},
        'blood_pressure_systolic': {'min': 90, 'max': 120, 'unit': 'mmHg'},
        'blood_pressure_diastolic': {'min': 60, 'max': 80, 'unit': 'mmHg'},
    }
    
    # Organ matching weights
    COMPATIBILITY_WEIGHTS = {
        'blood_type': 0.4,
        'tissue_match': 0.3,
        'age_compatibility': 0.2,
        'urgency': 0.1,
    }
