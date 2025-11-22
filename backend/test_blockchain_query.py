"""
Test script to verify blockchain record fetching
"""
import asyncio
import sys
from services.blockchain import BlockchainService
from config import settings

PATIENT_BLOCKCHAIN_ADDRESS = "0xBeDdBdED049f68D005723d4077314Afe0d5D326f"

async def test_blockchain_query():
    print("=" * 60)
    print("🧪 Testing Blockchain Record Fetch")
    print("=" * 60)
    
    # Initialize blockchain service
    print("\n1️⃣ Initializing blockchain service...")
    blockchain = BlockchainService()
    
    print(f"   ✅ Connected: {blockchain.w3.is_connected()}")
    print(f"   📝 Contract: {blockchain.contract.address}")
    
    # Test with hardcoded patient address
    print(f"\n2️⃣ Querying records for patient: {PATIENT_BLOCKCHAIN_ADDRESS}")
    
    try:
        records = await blockchain.get_patient_records(PATIENT_BLOCKCHAIN_ADDRESS)
        
        print(f"\n3️⃣ Query Results:")
        print(f"   📊 Total records found: {len(records)}")
        
        if records:
            print("\n4️⃣ Record Details:")
            for idx, record in enumerate(records, 1):
                print(f"\n   📄 Record #{idx}:")
                print(f"      - Report Type: {record.get('report_type')}")
                print(f"      - IPFS CID: {record.get('ipfs_cid')}")
                print(f"      - Facility: {record.get('issuing_facility')}")
                print(f"      - Issued Date: {record.get('issued_date')}")
                print(f"      - Approved At: {record.get('approved_at')}")
                print(f"      - Doctor Verified: {record.get('is_doctor_verified')}")
                print(f"      - Document Hash: {record.get('document_hash')}")
                print(f"      - IPFS Gateway: {record.get('ipfs_gateway_url')}")
        else:
            print("\n   ⚠️ No records found on blockchain")
            print(f"   💡 Make sure a doctor has approved at least one report for this address")
            
    except Exception as e:
        print(f"\n   ❌ Error: {e}")
        import traceback
        print(f"\n   Traceback:\n{traceback.format_exc()}")
    
    print("\n" + "=" * 60)
    print("✅ Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_blockchain_query())
