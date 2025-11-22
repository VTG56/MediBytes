"""
Run database migration to allow NULL document_hash in pending_reports
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client
from config import settings

def run_migration():
    """Execute migration to allow NULL document_hash"""
    try:
        # Initialize Supabase client
        supabase = create_client(settings.supabase_url, settings.supabase_key)
        
        # Execute migration SQL
        migration_sql = """
        ALTER TABLE pending_reports 
        ALTER COLUMN document_hash DROP NOT NULL;
        """
        
        # Supabase doesn't support direct SQL execution through Python client
        # You need to run this in Supabase SQL Editor
        print("⚠️  Please run this SQL in Supabase SQL Editor:")
        print("=" * 60)
        print(migration_sql)
        print("=" * 60)
        print("\n1. Go to https://supabase.com/dashboard")
        print("2. Select your project: medibytes")
        print("3. Go to SQL Editor")
        print("4. Paste and run the SQL above")
        print("\nOR run via psql if you have direct database access")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run_migration()
