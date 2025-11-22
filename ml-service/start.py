"""
MediBytes ML Service - Quick Start Script
Checks prerequisites and starts the Flask server
"""

import os
import sys
import subprocess
from pathlib import Path

def print_header(text):
    print("\n" + "="*50)
    print(f"  {text}")
    print("="*50 + "\n")

def check_python_version():
    """Ensure Python 3.8+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required")
        return False
    print(f"✅ Python {version.major}.{version.minor}")
    return True

def check_env_file():
    """Check if .env exists"""
    if not Path('.env').exists():
        print("❌ .env file not found")
        print("\n📝 Create .env file:")
        print("   1. Copy .env.example to .env")
        print("   2. Add Ollama ngrok URL")
        return False
    print("✅ .env file found")
    
    # Check for Ollama URL
    with open('.env', 'r') as f:
        content = f.read()
        if 'OLLAMA_URL=' not in content or 'your_ollama_url' in content:
            print("⚠️  Warning: OLLAMA_URL not configured in .env")
            print("   Add: OLLAMA_URL=https://your-teammate-ngrok.ngrok-free.app/api/generate")
    
    return True

def check_dependencies():
    """Check if requirements are installed"""
    try:
        import flask
        import doctr
        print("✅ Dependencies installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependencies: {e.name}")
        print("\n📦 Install with:")
        print("   pip install -r requirements.txt")
        return False

def main():
    print_header("MediBytes ML Service - Quick Start")
    
    # Change to ml-service directory
    os.chdir(Path(__file__).parent)
    
    # Run checks
    checks = [
        ("Python Version", check_python_version),
        ("Environment File", check_env_file),
        ("Dependencies", check_dependencies),
    ]
    
    all_passed = True
    for name, check_func in checks:
        if not check_func():
            all_passed = False
    
    if not all_passed:
        print("\n❌ Prerequisites not met. Please fix the issues above.\n")
        sys.exit(1)
    
    print("\n✅ All prerequisites met!\n")
    
    # Start server
    print_header("Starting ML Service")
    print("🚀 Flask server starting on http://0.0.0.0:5000")
    print("📄 API Documentation: See ML_INTEGRATION.md")
    print("\n   Press Ctrl+C to stop\n")
    
    try:
        from app import create_app
        app = create_app()
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped\n")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}\n")
        sys.exit(1)

if __name__ == '__main__':
    main()
