-- Complete pending_reports table schema
-- This creates the table if it doesn't exist, or adds missing columns

-- First, check if table exists and create it if not
CREATE TABLE IF NOT EXISTS pending_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL,
    document_hash VARCHAR DEFAULT 'PENDING_DOCTOR_APPROVAL',
    ipfs_cid VARCHAR NOT NULL,
    extracted_text_cid VARCHAR,
    extracted_text TEXT,
    report_type VARCHAR NOT NULL,
    report_date DATE,
    facility VARCHAR,
    symptoms TEXT,
    ai_summary TEXT,
    risk_level VARCHAR,
    status VARCHAR DEFAULT 'pending',
    approved_by VARCHAR,
    approved_at TIMESTAMP,
    rejected_by VARCHAR,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    blockchain_tx VARCHAR,
    block_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE pending_reports ADD COLUMN IF NOT EXISTS patient_id UUID;
ALTER TABLE pending_reports ADD COLUMN IF NOT EXISTS extracted_text_cid VARCHAR;
ALTER TABLE pending_reports ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE pending_reports ADD COLUMN IF NOT EXISTS block_number INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_reports_patient_id ON pending_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_pending_reports_status ON pending_reports(status);
CREATE INDEX IF NOT EXISTS idx_pending_reports_extracted_text_cid ON pending_reports(extracted_text_cid);
CREATE INDEX IF NOT EXISTS idx_pending_reports_created_at ON pending_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_reports_status_patient ON pending_reports(status, patient_id);
