"""
Simplified Analysis Routes - Direct proxy to Ollama OCR API
No local OCR processing needed
"""
from flask import Blueprint, request, jsonify
import requests
import os

analysis_bp = Blueprint('analysis', __name__)

# External Ollama API with OCR (your teammate's ngrok URL)
OLLAMA_URL = os.getenv('OLLAMA_URL', 'https://dizzied-unpropitiating-ute.ngrok-free.dev/api/generate')


@analysis_bp.route('/health', methods=['GET'])
def health():
    """Check service health"""
    return jsonify({"status": "ok", "service": "ml-proxy"})


@analysis_bp.route('/analyze', methods=['POST'])
def analyze():
    """
    Forward file to Ollama API for OCR + AI Analysis
    The Ollama service handles both OCR and analysis
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    try:
        # Forward file directly to Ollama API
        # Note: Update this if your Ollama API expects multipart/form-data
        files = {'file': (file.filename, file.stream, file.content_type)}
        
        response = requests.post(
            OLLAMA_URL.replace('/api/generate', '/api/ocr-analyze'),  # Adjust endpoint as needed
            files=files,
            timeout=120
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Ollama API error", "details": response.text}), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timeout. Ollama service is slow or unavailable."}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Cannot connect to Ollama service. Check if ngrok URL is correct."}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@analysis_bp.route('/analyze-text', methods=['POST'])
def analyze_text():
    """Analyze manually entered lab values"""
    data = request.json
    lab_values = data.get('lab_values', '')
    
    if not lab_values:
        return jsonify({"error": "No values provided"}), 400
    
    try:
        response = requests.post(OLLAMA_URL, json={
            "model": "report_analysis_model",
            "prompt": f"""Analyze these lab results and return a JSON response:

{lab_values}

Return ONLY valid JSON in this exact format:
{{
  "values": [
    {{"test": "Test Name", "value": "X", "unit": "unit", "reference": "range", "status": "HIGH/LOW/NORMAL", "risk": true/false}}
  ],
  "summary": "Brief overall health summary",
  "recommendations": ["recommendation 1", "recommendation 2"]
}}

Set "risk": true for any value that is LOW or HIGH. Set "risk": false for NORMAL values.
Return ONLY the JSON, no other text.""",
            "stream": False
        }, timeout=60)
        
        if response.status_code == 200:
            ai_response = response.json().get('response', '{}')
            
            try:
                import json
                parsed = json.loads(ai_response)
                return jsonify({"analysis": parsed})
            except:
                return jsonify({"analysis": ai_response})
        else:
            return jsonify({"error": "Ollama API error"}), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
