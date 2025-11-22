"""
MediBytes Backend - AI Analysis Service
Handles OCR extraction (AI analysis integrated by separate team)
"""

from typing import Dict, Any, List, Optional
import io
from datetime import datetime
import re
import pytesseract
from PIL import Image
import pdf2image
import os

from config import settings
from models import LabValue, AIInsights

# Configure Tesseract path for Windows
if os.name == 'nt':  # Windows
    tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path


class AIService:
    """Service for AI-powered medical analysis"""

    def __init__(self):
        # AI analysis will be integrated by teammate
        self.ai_enabled = False

    # ========================================================================
    # OCR - Extract Text from Medical Documents
    # ========================================================================

    async def extract_text_ocr(
        self, file_content: bytes, file_extension: str
    ) -> str:
        """
        Extract text from medical documents using OCR
        Supports: PDF, PNG, JPG, JPEG
        """
        try:
            extracted_text = ""

            # Handle PDF files
            if file_extension.lower() == ".pdf":
                # Convert PDF to images
                images = pdf2image.convert_from_bytes(file_content)

                # OCR each page
                for i, image in enumerate(images):
                    page_text = pytesseract.image_to_string(image)
                    extracted_text += f"\n--- Page {i+1} ---\n{page_text}"

            # Handle image files
            elif file_extension.lower() in [".png", ".jpg", ".jpeg"]:
                image = Image.open(io.BytesIO(file_content))
                extracted_text = pytesseract.image_to_string(image)

            else:
                raise Exception(f"Unsupported file type: {file_extension}")

            return extracted_text.strip()

        except Exception as e:
            print(f"❌ OCR extraction failed: {e}")
            return f"OCR Error: {str(e)}"

    # ========================================================================
    # OpenAI Analysis - Health Insights
    # ========================================================================

    async def analyze_health_data(
        self, extracted_text: str, report_type: str
    ) -> AIInsights:
        """
        Analyze medical report using AI
        PLACEHOLDER - AI analysis will be integrated by teammate
        Returns health insights, risk assessment, and recommendations
        """
        try:
            # TODO: Integrate AI analysis here (handled by teammate)
            # This is a placeholder implementation
            
            # Basic keyword-based analysis (temporary)
            risk_level = "low"
            abnormal_keywords = ["abnormal", "high", "low", "elevated", "critical"]
            
            if any(keyword in extracted_text.lower() for keyword in abnormal_keywords):
                risk_level = "medium"
            
            return AIInsights(
                risk_level=risk_level,
                summary=f"OCR text extracted successfully. AI analysis pending integration.",
                recommendations=[
                    "Medical report uploaded successfully",
                    "Awaiting doctor verification",
                    "AI-powered insights will be available after integration"
                ],
                abnormal_values=[],
                risk_factors=[],
                follow_up_needed=False,
            )

        except Exception as e:
            print(f"❌ AI analysis failed: {e}")
            return AIInsights(
                risk_level="unknown",
                summary="AI analysis unavailable",
                recommendations=["Please consult with a healthcare provider"],
                abnormal_values=[],
                risk_factors=[],
                follow_up_needed=True,
            )

    def _create_analysis_prompt(self, text: str, report_type: str) -> str:
        """Create analysis prompt for OpenAI"""
        return f"""
Analyze the following {report_type} medical report and provide:

1. **Risk Level**: LOW, MEDIUM, HIGH, or CRITICAL
2. **Summary**: Brief overview (2-3 sentences)
3. **Key Findings**: List important observations
4. **Abnormal Values**: Extract lab values outside normal range
5. **Risk Factors**: Identify potential health risks
6. **Recommendations**: Actionable health advice (3-5 points)
7. **Follow-up Needed**: YES or NO

Medical Report Text:
{text[:4000]}  

Provide your analysis in this format:

RISK_LEVEL: [level]
SUMMARY: [summary text]
ABNORMAL_VALUES:
- [parameter]: [value] [unit] (Normal: [range])
RISK_FACTORS:
- [risk factor 1]
- [risk factor 2]
RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]
FOLLOW_UP: [YES/NO]
"""

    def _parse_ai_response(self, response_text: str) -> AIInsights:
        """Parse structured response from OpenAI"""
        try:
            # Extract risk level
            risk_match = re.search(r"RISK_LEVEL:\s*(\w+)", response_text, re.IGNORECASE)
            risk_level = risk_match.group(1).lower() if risk_match else "unknown"

            # Extract summary
            summary_match = re.search(
                r"SUMMARY:\s*(.+?)(?=ABNORMAL_VALUES|RISK_FACTORS|RECOMMENDATIONS|$)",
                response_text,
                re.IGNORECASE | re.DOTALL,
            )
            summary = summary_match.group(1).strip() if summary_match else ""

            # Extract abnormal values
            abnormal_section = re.search(
                r"ABNORMAL_VALUES:\s*(.+?)(?=RISK_FACTORS|RECOMMENDATIONS|FOLLOW_UP|$)",
                response_text,
                re.IGNORECASE | re.DOTALL,
            )
            abnormal_values = []
            if abnormal_section:
                lines = abnormal_section.group(1).strip().split("\n")
                for line in lines:
                    if line.strip().startswith("-"):
                        abnormal_values.append(line.strip()[1:].strip())

            # Extract risk factors
            risk_section = re.search(
                r"RISK_FACTORS:\s*(.+?)(?=RECOMMENDATIONS|FOLLOW_UP|$)",
                response_text,
                re.IGNORECASE | re.DOTALL,
            )
            risk_factors = []
            if risk_section:
                lines = risk_section.group(1).strip().split("\n")
                for line in lines:
                    if line.strip().startswith("-"):
                        risk_factors.append(line.strip()[1:].strip())

            # Extract recommendations
            rec_section = re.search(
                r"RECOMMENDATIONS:\s*(.+?)(?=FOLLOW_UP|$)",
                response_text,
                re.IGNORECASE | re.DOTALL,
            )
            recommendations = []
            if rec_section:
                lines = rec_section.group(1).strip().split("\n")
                for line in lines:
                    if line.strip().startswith("-"):
                        recommendations.append(line.strip()[1:].strip())

            # Extract follow-up
            followup_match = re.search(
                r"FOLLOW_UP:\s*(YES|NO)", response_text, re.IGNORECASE
            )
            follow_up_needed = (
                followup_match.group(1).upper() == "YES" if followup_match else True
            )

            return AIInsights(
                risk_level=risk_level,
                summary=summary,
                recommendations=recommendations,
                abnormal_values=abnormal_values,
                risk_factors=risk_factors,
                follow_up_needed=follow_up_needed,
            )

        except Exception as e:
            print(f"❌ Parse AI response failed: {e}")
            return AIInsights(
                risk_level="unknown",
                summary="Unable to parse analysis",
                recommendations=["Consult healthcare provider"],
                abnormal_values=[],
                risk_factors=[],
                follow_up_needed=True,
            )

    # ========================================================================
    # Lab Value Parsing (from OCR text)
    # ========================================================================

    def parse_lab_values(self, text: str) -> List[LabValue]:
        """
        Parse lab values from OCR text
        Looks for patterns like: "Hemoglobin: 12.5 g/dL (Normal: 13-17)"
        """
        lab_values = []

        # Common patterns for lab results
        patterns = [
            # Pattern: Parameter: Value Unit (Normal: Range)
            r"(\w+(?:\s+\w+)*)\s*:\s*([\d.]+)\s*(\w+/?%?)\s*\(Normal:\s*([\d.-]+)\)",
            # Pattern: Parameter Value Unit Normal Range
            r"(\w+(?:\s+\w+)*)\s+([\d.]+)\s+(\w+/?%?)\s+([\d.-]+)",
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                parameter = match.group(1).strip()
                value = match.group(2).strip()
                unit = match.group(3).strip()
                normal_range = match.group(4).strip()

                # Determine status (simplified logic)
                status = "normal"
                try:
                    val_float = float(value)
                    if "-" in normal_range:
                        low, high = map(float, normal_range.split("-"))
                        if val_float < low:
                            status = "low"
                        elif val_float > high:
                            status = "high"
                except:
                    status = "unknown"

                lab_values.append(
                    LabValue(
                        parameter=parameter,
                        value=value,
                        unit=unit,
                        normal_range=normal_range,
                        status=status,
                    )
                )

        return lab_values

    # ========================================================================
    # Symptom Analysis
    # ========================================================================

    async def analyze_symptoms(self, symptoms: str) -> Dict[str, Any]:
        """
        Analyze patient symptoms using AI
        PLACEHOLDER - To be integrated by teammate
        """
        try:
            # TODO: Integrate AI symptom analysis
            return {
                "analysis": "Symptom analysis pending AI integration. Please consult with a healthcare provider.",
                "success": True,
                "placeholder": True
            }

        except Exception as e:
            print(f"❌ Symptom analysis failed: {e}")
            return {"success": False, "error": str(e)}

    # ========================================================================
    # Drug Interaction Check
    # ========================================================================

    async def check_drug_interactions(self, medications: List[str]) -> Dict[str, Any]:
        """
        Check for drug interactions
        PLACEHOLDER - To be integrated by teammate
        """
        try:
            meds_text = ", ".join(medications)
            
            # TODO: Integrate AI drug interaction analysis
            return {
                "analysis": f"Drug interaction check for {meds_text} pending AI integration. Please consult with a pharmacist or healthcare provider.",
                "success": True,
                "placeholder": True
            }

        except Exception as e:
            print(f"❌ Drug interaction check failed: {e}")
            return {"success": False, "error": str(e)}
