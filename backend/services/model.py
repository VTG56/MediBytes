"""
MediBytes Backend - AI Model Service
Handles calling external AI model API for medical image analysis
"""

import httpx
from typing import Dict, Any, Optional
import base64
from config import settings


class ModelService:
    """Service for AI model interactions"""

    def __init__(self):
        # Your friend's model API endpoint (configure this)
        self.model_api_url = getattr(settings, 'model_api_url', 'http://localhost:5000/analyze')
        self.model_api_key = getattr(settings, 'model_api_key', None)
        
    async def analyze_medical_image(
        self, 
        image_data: bytes, 
        report_type: str,
        filename: str
    ) -> Dict[str, Any]:
        """
        Send medical image to AI model for analysis
        
        Args:
            image_data: Raw image bytes
            report_type: Type of medical report (xray, mri, ct_scan, etc.)
            filename: Original filename
            
        Returns:
            Dict with analysis results including:
            - summary: Text summary of findings
            - risk_level: low/medium/high
            - findings: List of specific findings
            - confidence: Model confidence score
        """
        try:
            # Encode image as base64 for API transmission
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Prepare request payload
            payload = {
                "image": image_base64,
                "report_type": report_type,
                "filename": filename
            }
            
            # Add API key if configured
            headers = {}
            if self.model_api_key:
                headers["Authorization"] = f"Bearer {self.model_api_key}"
            
            # Call model API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.model_api_url,
                    json=payload,
                    headers=headers
                )
                
                response.raise_for_status()
                result = response.json()
                
            # Return structured analysis for lab tests
            return {
                "success": True,
                "summary": result.get("summary", "Overview based on the provided values only"),
                "values": result.get("values", []),
                "concerns": result.get("concerns", "No abnormal values detected"),
                "positive": result.get("positive", "All values within normal range"),
                "diet_increase": result.get("diet_increase", "Maintain balanced diet"),
                "diet_reduce": result.get("diet_reduce", "Limit processed foods"),
                "diet_avoid": result.get("diet_avoid", "Avoid excessive sugar and salt"),
                "lifestyle": result.get("lifestyle", "Regular exercise and adequate sleep"),
                "doctor_visit": result.get("doctor_visit", "Consult doctor if symptoms persist"),
                "recommendations": result.get("recommendations", [
                    "Follow prescribed treatment plan",
                    "Monitor symptoms regularly",
                    "Maintain healthy lifestyle"
                ]),
                "report_type": report_type,
                "raw_response": result
            }
            
        except httpx.HTTPError as e:
            print(f"❌ Model API error: {e}")
            # Return fallback analysis if model fails
            return self._get_fallback_analysis(report_type)
        except Exception as e:
            print(f"❌ Unexpected error in model analysis: {e}")
            return self._get_fallback_analysis(report_type)
    
    def _get_fallback_analysis(self, report_type: str) -> Dict[str, Any]:
        """
        Fallback analysis when model API is unavailable
        """
        return {
            "success": False,
            "summary": f"AI analysis pending for {report_type}. Manual review required.",
            "values": [],
            "concerns": "Automated analysis unavailable - Manual doctor review required",
            "positive": "Manual review needed to assess results",
            "diet_increase": "Maintain balanced diet with fruits and vegetables",
            "diet_reduce": "Limit processed foods and sugary drinks",
            "diet_avoid": "Avoid excessive salt, sugar, and unhealthy fats",
            "lifestyle": "Regular exercise (30 mins daily), adequate sleep (7-8 hours), stress management",
            "doctor_visit": "Consult your doctor for personalized medical advice",
            "recommendations": [
                "Schedule appointment with your doctor",
                "Maintain healthy lifestyle habits",
                "Keep track of any symptoms"
            ],
            "report_type": report_type,
            "note": "Model API unavailable - fallback response"
        }


# Global service instance
model_service = ModelService()
