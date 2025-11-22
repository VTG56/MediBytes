from flask import Blueprint, request, jsonify
from doctr.io import DocumentFile
from doctr.models import ocr_predictor
import requests
import os
import tempfile
import json

analysis_bp = Blueprint('analysis', __name__)

# Load OCR model once at startup
print("Loading DocTR model...")
ocr_model = ocr_predictor(det_arch='db_resnet50', reco_arch='crnn_vgg16_bn', pretrained=True, assume_straight_pages=True)
print("DocTR ready!")

# External Ollama API (your ngrok URL)
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434/api/generate')


def extract_text(image_path):
    """Extract text from image or PDF using DocTR"""
    # Check file extension to use appropriate loader
    file_ext = image_path.lower().split('.')[-1]
    
    if file_ext == 'pdf':
        doc = DocumentFile.from_pdf(image_path)
    else:
        doc = DocumentFile.from_images(image_path)
    
    result = ocr_model(doc)
    
    lines = []
    for page in result.pages:
        for block in page.blocks:
            for line in block.lines:
                text = ' '.join([word.value for word in line.words])
                lines.append(text)
    
    return '\n'.join(lines)


@analysis_bp.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": "doctr"})


@analysis_bp.route('/ocr', methods=['POST'])
def ocr_only():
    """Extract text from image or PDF"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    # Preserve original file extension for DocTR to handle PDFs correctly
    filename = file.filename or 'document'
    file_ext = '.' + filename.split('.')[-1].lower() if '.' in filename else '.pdf'
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        file.save(tmp.name)
        try:
            text = extract_text(tmp.name)
            return jsonify({"text": text})
        finally:
            os.unlink(tmp.name)


@analysis_bp.route('/analyze', methods=['POST'])
def analyze():
    """OCR + AI Analysis with structured health insights"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    # Preserve original file extension for DocTR to handle PDFs correctly
    filename = file.filename or 'document'
    file_ext = '.' + filename.split('.')[-1].lower() if '.' in filename else '.pdf'
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        file.save(tmp.name)
        try:
            # Step 1: OCR
            extracted_text = extract_text(tmp.name)
            
            # Step 2: Send to Ollama
            response = requests.post(OLLAMA_URL, json={
                "model": "report_analysis_model",
                "prompt": f"""You are a doctor analyzing a lab report. Read the extracted text carefully and analyze ONLY the values present in it.

EXTRACTED LAB REPORT TEXT:
---
{extracted_text}
---

TASK:
1. Read the above text carefully
2. Extract ONLY the test values that are ACTUALLY present in the text
3. Do NOT make up or assume any values
4. For each value found, compare with standard medical reference ranges
5. Provide health advice based on the ACTUAL values found

Return JSON format:
{{
  "summary": "2-3 sentence overview of health based on ACTUAL values found in the report",
  "values": [
    {{"test": "ACTUAL test name from report", "value": "ACTUAL value from report", "unit": "unit from report", "reference": "standard reference range", "status": "HIGH or LOW or NORMAL"}}
  ],
  "concerns": "Explain any abnormal values found. If none, say all values are normal.",
  "positive": "Mention healthy/normal values found.",
  "diet_increase": "Foods to eat more based on results. Be specific with food names.",
  "diet_reduce": "Foods to reduce. Be specific.",
  "diet_avoid": "Foods to avoid completely. Be specific.",
  "lifestyle": "Exercise and lifestyle tips based on results.",
  "doctor_visit": "Should they see a doctor? How urgent? Which specialist?",
  "recommendations": "3-5 specific action items."
}}

IMPORTANT:
- ONLY include tests that are ACTUALLY in the extracted text above
- Do NOT copy example values - read the ACTUAL report
- If you cannot find a value in the text, do NOT include it
- Return ONLY valid JSON""",
                "stream": False
            }, timeout=120)
            
            ai_response = response.json().get('response', '{}')
            
            # Clean and parse JSON
            try:
                cleaned = ai_response.strip()
                if cleaned.startswith('```json'):
                    cleaned = cleaned[7:]
                if cleaned.startswith('```'):
                    cleaned = cleaned[3:]
                if cleaned.endswith('```'):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                
                parsed = json.loads(cleaned)
                
                return jsonify({
                    "extracted_text": extracted_text,
                    "analysis": parsed
                })
            except json.JSONDecodeError as e:
                print(f"JSON Parse Error: {e}")
                print(f"Response: {ai_response}")
                return jsonify({
                    "extracted_text": extracted_text,
                    "analysis": {
                        "summary": ai_response
                    }
                })
        finally:
            os.unlink(tmp.name)


@analysis_bp.route('/analyze-text', methods=['POST'])
def analyze_text():
    """Analyze manually entered lab values"""
    data = request.json
    lab_values = data.get('lab_values', '')
    
    if not lab_values:
        return jsonify({"error": "No values provided"}), 400
    
    response = requests.post(OLLAMA_URL, json={
        "model": "report_analysis_model",
        "prompt": f"""You are a doctor. Analyze ONLY the lab values provided below.

LAB VALUES:
---
{lab_values}
---

TASK:
1. Analyze ONLY the values given above
2. Do NOT make up any values
3. Compare with standard medical reference ranges

Return JSON:
{{
  "summary": "Overview based on the provided values only",
  "values": [
    {{"test": "test name", "value": "value", "unit": "unit", "reference": "range", "status": "HIGH/LOW/NORMAL"}}
  ],
  "concerns": "Abnormal values explanation",
  "positive": "Normal values explanation", 
  "diet_increase": "Specific foods to eat more",
  "diet_reduce": "Specific foods to reduce",
  "diet_avoid": "Specific foods to avoid",
  "lifestyle": "Exercise and lifestyle tips",
  "doctor_visit": "Doctor recommendation",
  "recommendations": "3-5 action items"
}}

ONLY include values that were actually provided. Return ONLY JSON.""",
        "stream": False
    }, timeout=60)
    
    ai_response = response.json().get('response', '{}')
    
    try:
        cleaned = ai_response.strip()
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]
        if cleaned.startswith('```'):
            cleaned = cleaned[3:]
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        parsed = json.loads(cleaned)
        return jsonify({"analysis": parsed})
    except json.JSONDecodeError:
        return jsonify({
            "analysis": {
                "summary": ai_response
            }
        })

