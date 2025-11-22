-- Migration: Add extracted text columns to pending_reports table
-- Created: 2025-11-22
-- Purpose: Store unencrypted extracted text IPFS hash and text content

-- Add missing columns if they don't exist
ALTER TABLE pending_reports ADD COLUMN IF NOT EXISTS patient_id UUID;
ALTER TABLE pending_reports ADD COLUMN IF NOT EXISTS extracted_text_cid VARCHAR;
ALTER TABLE pending_reports ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE pending_reports ADD COLUMN IF NOT EXISTS block_number INTEGER;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_reports_patient_id ON pending_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_pending_reports_status ON pending_reports(status);
CREATE INDEX IF NOT EXISTS idx_pending_reports_extracted_text_cid ON pending_reports(extracted_text_cid);
CREATE INDEX IF NOT EXISTS idx_pending_reports_created_at ON pending_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_reports_status_patient ON pending_reports(status, patient_id);

-- Add comment to document the columns
COMMENT ON COLUMN pending_reports.extracted_text_cid IS 'IPFS hash of unencrypted extracted text - doctors can read from IPFS gateway';
COMMENT ON COLUMN pending_reports.extracted_text IS 'Extracted text content stored in database for quick access without IPFS fetch';
