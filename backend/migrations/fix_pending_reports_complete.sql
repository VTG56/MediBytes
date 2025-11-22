-- Complete Migration: Ensure pending_reports table has all required columns
-- Run this SQL in Supabase SQL Editor

-- Step 1: Add patient_id if it doesn't exist
-- (Note: If it fails, the column already exists)
ALTER TABLE pending_reports
ADD COLUMN patient_id UUID;

-- Step 2: Add extracted_text_cid if it doesn't exist
ALTER TABLE pending_reports
ADD COLUMN extracted_text_cid TEXT;

-- Step 3: Add extracted_text if it doesn't exist
ALTER TABLE pending_reports
ADD COLUMN extracted_text TEXT;

-- Step 4: Add block_number if it doesn't exist
ALTER TABLE pending_reports
ADD COLUMN block_number INTEGER;

-- Step 5: Make document_hash nullable (if not already)
ALTER TABLE pending_reports
ALTER COLUMN document_hash DROP NOT NULL;

-- Step 6: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pending_reports_patient_id 
ON pending_reports(patient_id);

CREATE INDEX IF NOT EXISTS idx_pending_reports_status 
ON pending_reports(status);

CREATE INDEX IF NOT EXISTS idx_pending_reports_extracted_text_cid 
ON pending_reports(extracted_text_cid);

-- Done!
-- You can verify by running:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'pending_reports';
