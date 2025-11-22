-- Migration: Allow NULL for document_hash in pending_reports
-- Reason: Patient uploads don't compute hash until doctor approval
-- Date: 2025-11-22

-- Make document_hash nullable
ALTER TABLE pending_reports 
ALTER COLUMN document_hash DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN pending_reports.document_hash IS 
'Document hash computed during doctor approval. NULL until then.';
