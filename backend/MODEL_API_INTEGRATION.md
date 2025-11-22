# AI Model API Integration Guide

## Overview
This document explains how to integrate your medical image analysis model with the MediBytes backend.

## API Endpoint Contract

### Request Format

**Endpoint**: `POST /analyze` (or your preferred endpoint)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY (optional)
```

**Request Body**:
```json
{
  "image": "base64_encoded_image_data",
  "report_type": "xray|mri|ct_scan|blood_test|lab_test|other",
  "filename": "original_filename.jpg"
}
```

### Response Format

**Success Response** (HTTP 200):
```json
{
  "summary": "Brief text summary of findings (1-2 sentences)",
  "risk_level": "low|medium|high",
  "findings": [
    "Finding 1: Description",
    "Finding 2: Description",
    "Finding 3: Description"
  ],
  "confidence": 0.95,
  "raw_data": {
    "any": "additional",
    "model": "specific",
    "data": "here"
  }
}
```

**Error Response** (HTTP 4xx/5xx):
```json
{
  "error": "Error message description"
}
```

## Configuration

Set your model API endpoint in `.env`:
```bash
MODEL_API_URL=http://your-model-server:5000/analyze
MODEL_API_KEY=your_optional_api_key
```

## Example Implementation (Flask)

```python
from flask import Flask, request, jsonify
import base64
from PIL import Image
import io

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze_image():
    try:
        data = request.json
        
        # Decode base64 image
        image_data = base64.b64decode(data['image'])
        image = Image.open(io.BytesIO(image_data))
        
        # Run your model analysis
        results = your_model.predict(image)
        
        # Format response
        return jsonify({
            "summary": results['summary'],
            "risk_level": results['risk'],  # low/medium/high
            "findings": results['findings_list'],
            "confidence": results['confidence_score']
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## What Happens to Your Analysis

1. **Upload**: Patient uploads medical image
2. **Your Model**: Image sent to your API for analysis
3. **IPFS Storage**: Your analysis results stored on IPFS as JSON
4. **Doctor Review**: Doctor sees your AI analysis alongside original image
5. **Blockchain**: Doctor approves → Analysis hash recorded on blockchain

## Data Flow

```
Patient Upload
    ↓
Your Model API (/analyze)
    ↓
AI Analysis JSON
    ↓
IPFS Storage (Pinata)
    ↓
Doctor Dashboard (View Analysis)
    ↓
Doctor Approval (MetaMask Transaction)
    ↓
Blockchain Record (Polygon)
```

## Testing Your Integration

### Test Request:
```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "report_type": "xray",
    "filename": "test.jpg"
  }'
```

### Expected Response:
```json
{
  "summary": "Normal chest X-ray with no acute findings",
  "risk_level": "low",
  "findings": [
    "Clear lung fields bilaterally",
    "Normal cardiac silhouette",
    "No pleural effusion"
  ],
  "confidence": 0.92
}
```

## Fallback Behavior

If your model API is unavailable, the system automatically returns:
```json
{
  "success": false,
  "summary": "AI analysis pending. Manual review required.",
  "risk_level": "medium",
  "findings": ["Automated analysis unavailable", "Manual doctor review required"],
  "confidence": 0.0
}
```

## Questions?

Contact: MediBytes Development Team
File: `backend/services/model.py` contains the integration code
