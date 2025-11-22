"""
MediBytes Backend - Quick Start Script
Checks dependencies and starts the server
"""

import sys
import subprocess
import os
from pathlib import Path


def check_python_version():
    """Check Python version"""
    if sys.version_info < (3, 10):
        print("❌ Python 3.10+ required")
        print(f"   Current: {sys.version}")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}")
    return True


def check_tesseract():
    """Check if Tesseract is installed"""
    # Check common Windows installation path first
    tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if os.path.exists(tesseract_path):
        print(f"✅ Tesseract OCR found at: {tesseract_path}")
        return True
    
    # Try running tesseract command (if in PATH)
    try:
        result = subprocess.run(
            ["tesseract", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version = result.stdout.split('\n')[0]
            print(f"✅ Tesseract OCR installed: {version}")
            return True
    except FileNotFoundError:
        pass
    except Exception as e:
        pass
    
    # If neither worked, Tesseract is not found
    print("❌ Tesseract OCR not found")
    print("   Install from: https://github.com/UB-Mannheim/tesseract/wiki")
    print("   ⚠️  If already installed, restart PowerShell or add to PATH")
    return False


def check_env_file():
    """Check if .env file exists"""
    if Path(".env").exists():
        print("✅ .env file found")
        return True
    else:
        print("❌ .env file not found")
        print("   Copy .env.example to .env and configure")
        return False


def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            check=True
        )
        print("✅ Dependencies installed")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        return False


def start_server():
    """Start FastAPI server"""
    print("\n🚀 Starting MediBytes Backend...")
    print("   API: http://localhost:8000")
    print("   Docs: http://localhost:8000/docs")
    print("\n   Press Ctrl+C to stop\n")
    
    try:
        subprocess.run(
            [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
            check=True
        )
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Server failed to start: {e}")


def main():
    """Main startup routine"""
    print("=" * 50)
    print("  MediBytes Backend - Quick Start")
    print("=" * 50)
    print()
    
    # Check prerequisites
    checks = [
        ("Python Version", check_python_version()),
        ("Tesseract OCR", check_tesseract()),
        (".env Configuration", check_env_file()),
    ]
    
    failed = [name for name, result in checks if not result]
    
    if failed:
        print("\n❌ Prerequisites not met:")
        for name in failed:
            print(f"   - {name}")
        print("\nPlease fix the issues above and try again.")
        sys.exit(1)
    
    print("\n✅ All prerequisites met!")
    
    # Ask to install dependencies
    response = input("\nInstall/update dependencies? (y/n): ").lower()
    if response == 'y':
        if not install_dependencies():
            sys.exit(1)
    
    # Start server
    start_server()


if __name__ == "__main__":
    main()
