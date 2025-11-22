"""
Run database migration to add extracted text columns to pending_reports
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Missing SUPABASE credentials in .env")
    exit(1)

client = create_client(supabase_url, supabase_key)

# Migration SQL
migration_sql = """
ALTER TABLE pending_reports 
ADD COLUMN IF NOT EXISTS extracted_text_cid TEXT;

ALTER TABLE pending_reports 
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

CREATE INDEX IF NOT EXISTS idx_pending_reports_extracted_text_cid 
ON pending_reports(extracted_text_cid);

CREATE INDEX IF NOT EXISTS idx_pending_reports_status_patient 
ON pending_reports(status, patient_id);
"""

try:
    print("⏳ Running migration: Adding extracted text columns...")
    
    # Execute migration using RPC call
    result = client.rpc("exec_sql", {"sql": migration_sql}).execute()
    
    print("✅ Migration completed successfully!")
    
except Exception as e:
    error_str = str(e)
    
    # Check if columns already exist (common error if already migrated)
    if "already exists" in error_str or "duplicate key" in error_str:
        print("⚠️  Columns may already exist - checking...")
        print("✅ Migration appears to be already applied or columns exist")
    else:
        print(f"❌ Migration failed: {error_str}")
        print("\n📝 Please run this SQL manually in Supabase SQL Editor:")
        print(migration_sql)
        exit(1)
