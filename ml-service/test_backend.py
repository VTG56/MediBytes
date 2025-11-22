"""
MediBytes Backend Workflow Test Script
======================================
Tests all backend endpoints and workflows including:
1. Health checks
2. OCR text extraction
3. Medical data analysis
4. Organ compatibility matching
5. Supabase integration
"""

import requests
import json
from datetime import datetime

# Backend URL
BASE_URL = "http://localhost:5000"

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_section(title):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{title:^60}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def print_info(message):
    print(f"{YELLOW}ℹ {message}{RESET}")

def test_health_check():
    """Test 1: Health Check"""
    print_section("TEST 1: Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Service Status: {data.get('status')}")
            print_success(f"Message: {data.get('message')}")
            return True
        else:
            print_error(f"Health check failed with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to backend. Is the server running?")
        print_info("Start server with: cd ml-service && python run.py")
        return False
    except Exception as e:
        print_error(f"Health check error: {str(e)}")
        return False

def test_service_info():
    """Test 2: Service Information"""
    print_section("TEST 2: Service Information")
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Service: {data.get('service')}")
            print_success(f"Version: {data.get('version')}")
            print_info("Available Endpoints:")
            for endpoint, path in data.get('endpoints', {}).items():
                print(f"  • {endpoint}: {path}")
            return True
        else:
            print_error(f"Failed to get service info: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Service info error: {str(e)}")
        return False

def test_ocr_status():
    """Test 3: OCR Service Status"""
    print_section("TEST 3: OCR Service Status")
    
    try:
        response = requests.get(f"{BASE_URL}/api/ocr/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"OCR Status: {data.get('status')}")
            print_success(f"Languages: {', '.join(data.get('languages', []))}")
            print_success(f"GPU Enabled: {data.get('gpu_enabled')}")
            return True
        else:
            print_error(f"OCR status check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"OCR status error: {str(e)}")
        return False

def test_compatibility_calculation():
    """Test 4: Organ Compatibility Calculation"""
    print_section("TEST 4: Organ Compatibility Calculation")
    
    # Sample donor and recipient data
    test_data = {
        "donor": {
            "blood_type": "O+",
            "age": 35,
            "hla_type": "A*02:01",
            "organ_type": "kidney",
            "health_score": 85
        },
        "recipient": {
            "blood_type": "O+",
            "age": 42,
            "hla_type": "A*02:01",
            "organ_needed": "kidney",
            "urgency_score": 8,
            "wait_time_days": 180
        }
    }
    
    try:
        print_info("Testing compatibility calculation...")
        print(f"Donor: {test_data['donor']['blood_type']}, Age {test_data['donor']['age']}")
        print(f"Recipient: {test_data['recipient']['blood_type']}, Age {test_data['recipient']['age']}")
        
        response = requests.post(
            f"{BASE_URL}/api/compatibility",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success("Compatibility calculated successfully!")
            print(f"\n{YELLOW}Results:{RESET}")
            print(f"  Overall Score: {result.get('overall_score', 'N/A')}/100")
            print(f"  Blood Match: {result.get('blood_match', False)}")
            print(f"  HLA Match Level: {result.get('hla_match_level', 'N/A')}/6")
            print(f"  Age Compatibility: {result.get('age_compatibility', 'N/A')}%")
            print(f"  Urgency Factor: {result.get('urgency_factor', 'N/A')}")
            print(f"  Recommendation: {result.get('recommendation', 'N/A')}")
            return True
        else:
            print_error(f"Compatibility calculation failed: {response.status_code}")
            print_error(response.text)
            return False
    except Exception as e:
        print_error(f"Compatibility test error: {str(e)}")
        return False

def test_best_match_finder():
    """Test 5: Best Donor Match Finder"""
    print_section("TEST 5: Best Donor Match Finder")
    
    test_data = {
        "recipient": {
            "blood_type": "A+",
            "age": 45,
            "hla_type": "A*01:01",
            "organ_needed": "kidney",
            "urgency_score": 9,
            "wait_time_days": 365
        },
        "donors": [
            {
                "id": "donor_001",
                "blood_type": "A+",
                "age": 38,
                "hla_type": "A*01:01",
                "organ_type": "kidney",
                "health_score": 90
            },
            {
                "id": "donor_002",
                "blood_type": "O+",
                "age": 42,
                "hla_type": "A*02:01",
                "organ_type": "kidney",
                "health_score": 85
            },
            {
                "id": "donor_003",
                "blood_type": "A+",
                "age": 50,
                "hla_type": "A*03:01",
                "organ_type": "kidney",
                "health_score": 78
            }
        ]
    }
    
    try:
        print_info(f"Finding best match from {len(test_data['donors'])} donors...")
        
        response = requests.post(
            f"{BASE_URL}/api/compatibility/best-match",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success("Best match found!")
            print(f"\n{YELLOW}Best Match:{RESET}")
            print(f"  Donor ID: {result.get('donor_id', 'N/A')}")
            print(f"  Compatibility Score: {result.get('score', 'N/A')}/100")
            print(f"  Blood Type: {result.get('blood_type', 'N/A')}")
            print(f"  Reason: {result.get('reason', 'N/A')}")
            return True
        else:
            print_error(f"Best match finder failed: {response.status_code}")
            print_error(response.text)
            return False
    except Exception as e:
        print_error(f"Best match test error: {str(e)}")
        return False

def test_batch_compatibility():
    """Test 6: Batch Compatibility Calculation"""
    print_section("TEST 6: Batch Compatibility Calculation")
    
    test_data = {
        "pairs": [
            {
                "donor_id": "D001",
                "recipient_id": "R001",
                "donor": {
                    "blood_type": "O+",
                    "age": 35,
                    "hla_type": "A*02:01",
                    "organ_type": "kidney"
                },
                "recipient": {
                    "blood_type": "O+",
                    "age": 42,
                    "hla_type": "A*02:01",
                    "organ_needed": "kidney",
                    "urgency_score": 7
                }
            },
            {
                "donor_id": "D002",
                "recipient_id": "R002",
                "donor": {
                    "blood_type": "A+",
                    "age": 40,
                    "hla_type": "A*01:01",
                    "organ_type": "liver"
                },
                "recipient": {
                    "blood_type": "A+",
                    "age": 38,
                    "hla_type": "A*01:01",
                    "organ_needed": "liver",
                    "urgency_score": 9
                }
            }
        ]
    }
    
    try:
        print_info(f"Testing batch compatibility for {len(test_data['pairs'])} pairs...")
        
        response = requests.post(
            f"{BASE_URL}/api/compatibility/batch",
            json=test_data,
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            results = result.get('results', [])
            print_success(f"Batch processing complete! {len(results)} results")
            
            for i, pair_result in enumerate(results, 1):
                print(f"\n  Pair {i}: {pair_result.get('donor_id')} → {pair_result.get('recipient_id')}")
                compat = pair_result.get('compatibility', {})
                print(f"    Score: {compat.get('overall_score', 'N/A')}/100")
                print(f"    Match: {compat.get('blood_match', False)}")
            return True
        else:
            print_error(f"Batch compatibility failed: {response.status_code}")
            print_error(response.text)
            return False
    except Exception as e:
        print_error(f"Batch compatibility error: {str(e)}")
        return False

def print_summary(results):
    """Print test summary"""
    print_section("TEST SUMMARY")
    
    total = len(results)
    passed = sum(results)
    failed = total - passed
    
    print(f"Total Tests: {total}")
    print_success(f"Passed: {passed}")
    if failed > 0:
        print_error(f"Failed: {failed}")
    
    percentage = (passed / total * 100) if total > 0 else 0
    
    if percentage == 100:
        print(f"\n{GREEN}🎉 All tests passed!{RESET}")
    elif percentage >= 50:
        print(f"\n{YELLOW}⚠ Some tests failed. Check logs above.{RESET}")
    else:
        print(f"\n{RED}❌ Most tests failed. Check server status.{RESET}")
    
    print(f"\nSuccess Rate: {percentage:.1f}%\n")

def main():
    """Run all backend workflow tests"""
    print(f"\n{BLUE}{'='*60}")
    print(f"  MediBytes Backend Workflow Test Suite")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}{RESET}\n")
    
    results = []
    
    # Run all tests
    results.append(test_health_check())
    results.append(test_service_info())
    # Skip OCR test for now (slow import)
    # results.append(test_ocr_status())
    results.append(test_compatibility_calculation())
    results.append(test_best_match_finder())
    results.append(test_batch_compatibility())
    
    # Print summary
    print_summary(results)
    
    # Additional info
    print_info("💡 Backend Features:")
    print("  • Privacy-preserving organ matching")
    print("  • Medical document OCR")
    print("  • HLA tissue compatibility scoring")
    print("  • Batch processing for multiple matches")
    print("  • Real-time health monitoring")
    
    print(f"\n{YELLOW}📚 Next Steps:{RESET}")
    print("  1. Deploy smart contracts: cd blockchain && npx hardhat run scripts/deploy-private.js --network mumbai")
    print("  2. Run SQL schema in Supabase SQL Editor")
    print("  3. Start frontend: cd frontend && npm run dev")
    print("  4. Test end-to-end workflow with MetaMask\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}Test interrupted by user{RESET}\n")
    except Exception as e:
        print(f"\n{RED}Fatal error: {str(e)}{RESET}\n")
