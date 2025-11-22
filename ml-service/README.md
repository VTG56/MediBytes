# MediBytes ML Service

AI-powered medical report analysis service with OCR and LLM integration.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env and add Ollama URL

# 3. Start service
python start.py
```

Server runs on `http://localhost:5000`

## Features

✅ **OCR Text Extraction** - Extract text from medical reports using DocTR  
✅ **AI Analysis** - Get medical insights using Ollama LLM  
✅ **Risk Detection** - Automatically flag abnormal lab values  
✅ **CORS Enabled** - Ready for frontend integration  

## API Endpoints

### Health Check
```bash
GET /api/health
```

### OCR Only
```bash
POST /api/ocr
Content-Type: multipart/form-data
Body: file=<image>
```

### Full Analysis (OCR + AI)
```bash
POST /api/analyze
Content-Type: multipart/form-data
Body: file=<lab_report_image>
```

Returns:
```json
{
  "extracted_text": "...",
  "analysis": {
    "values": [...],
    "summary": "...",
    "recommendations": [...]
  }
}
```

### Analyze Text (Manual Input)
```bash
POST /api/analyze-text
Content-Type: application/json
Body: {"lab_values": "Hemoglobin: 12.5 g/dL\nGlucose: 95 mg/dL"}
```

## Configuration

File: `.env`

```bash
# Ollama AI endpoint (teammate's ngrok URL)
OLLAMA_URL=https://dizzied-unpropitiating-ute.ngrok-free.dev/api/generate

# Flask server
PORT=5000
HOST=0.0.0.0
FLASK_DEBUG=True

# CORS (frontend URLs)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional: Supabase (for drug data queries)
SUPABASE_URL=https://tcjvnyxtbowpxnmtqkpi.supabase.co
SUPABASE_ANON_KEY=your_key_here
```

## Dependencies

- **DocTR** - OCR engine
- **Flask** - Web framework
- **Flask-CORS** - Cross-origin requests
- **Pillow** - Image processing
- **Requests** - HTTP client for Ollama

Install all:
```bash
pip install -r requirements.txt
```

## Deployment

### Local Development
```bash
python start.py
# Access at http://localhost:5000
```

### Remote Access (ngrok)
```bash
# Terminal 1: Start Flask
python start.py

# Terminal 2: Expose with ngrok
ngrok http 5000

# Update frontend .env with ngrok URL
VITE_ML_API_URL=https://your-ml-service.ngrok-free.app
```

## Architecture

```
┌─────────────┐
│  Frontend   │
│   (React)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ ML Service  │
│   (Flask)   │
└──────┬──────┘
       │
       ├─────▶ DocTR (OCR)
       │
       └─────▶ Ollama (AI Analysis)
```

## Testing

```bash
# Health check
curl http://localhost:5000/api/health

# OCR test
curl -X POST -F "file=@sample_report.jpg" http://localhost:5000/api/ocr

# Full analysis
curl -X POST -F "file=@sample_report.jpg" http://localhost:5000/api/analyze
```

## Troubleshooting

**Import Error: No module named 'doctr'**
```bash
pip install python-doctr[torch]
```

**CORS Error from Frontend**
- Add frontend URL to `CORS_ORIGINS` in `.env`

**Ollama Timeout**
- Check Ollama ngrok URL is accessible
- Increase timeout in `app/routes/analysis.py` (line 74)

**OCR Quality Issues**
- Use high-resolution images
- Ensure good contrast and lighting
- Supported formats: JPG, PNG, PDF

## Documentation

📄 Full integration guide: `../ML_INTEGRATION.md`

## License

MIT
