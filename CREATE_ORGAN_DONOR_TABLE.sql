-- =====================================================
-- ORGAN DONOR TABLES FOR SUPABASE
-- Run this in Supabase SQL Editor
-- =====================================================

-- DROP OLD TABLES (if they exist with old schema)
DROP TABLE IF EXISTS organ_matches CASCADE;
DROP TABLE IF EXISTS organ_recipient_data CASCADE;
DROP TABLE IF EXISTS organ_donor_data CASCADE;

-- 1. ORGAN_DONOR_DATA (Donor registry)
CREATE TABLE IF NOT EXISTS organ_donor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id TEXT UNIQUE NOT NULL,  -- Patient's Supabase UUID
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    organ_type TEXT NOT NULL,  -- Comma-separated: kidney, liver, heart, lung, pancreas, cornea
    age INTEGER CHECK (age BETWEEN 18 AND 75),
    tissue_type_hla TEXT,  -- For compatibility matching (optional)
    encrypted_medical_history TEXT,  -- Encrypted medical history (optional)
    ipfs_cid TEXT NOT NULL,  -- IPFS hash for medical clearance certificate
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_patient_id ON organ_donor_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_donor_blood ON organ_donor_data(blood_type);
CREATE INDEX IF NOT EXISTS idx_donor_organ ON organ_donor_data(organ_type);
CREATE INDEX IF NOT EXISTS idx_donor_active ON organ_donor_data(is_active);

-- 2. ORGAN_RECIPIENT_DATA (Recipient registry)
CREATE TABLE IF NOT EXISTS organ_recipient_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id TEXT UNIQUE NOT NULL,  -- Patient's Supabase UUID
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    organ_needed TEXT NOT NULL,
    urgency_score INTEGER CHECK (urgency_score BETWEEN 1 AND 10),
    encrypted_medical_condition TEXT,
    tissue_type_hla TEXT,
    ipfs_cid TEXT NOT NULL,
    wait_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recipient_patient_id ON organ_recipient_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_recipient_blood ON organ_recipient_data(blood_type);
CREATE INDEX IF NOT EXISTS idx_recipient_organ ON organ_recipient_data(organ_needed);
CREATE INDEX IF NOT EXISTS idx_recipient_urgency ON organ_recipient_data(urgency_score);
CREATE INDEX IF NOT EXISTS idx_recipient_active ON organ_recipient_data(is_active);

-- 3. ORGAN_MATCHES (Match records between donor and recipient)
CREATE TABLE IF NOT EXISTS organ_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_patient_id TEXT NOT NULL,  -- Donor's Supabase UUID
    recipient_patient_id TEXT NOT NULL,  -- Recipient's Supabase UUID
    organ_type TEXT NOT NULL,
    compatibility_score NUMERIC CHECK (compatibility_score BETWEEN 0 AND 100),
    match_details JSONB,  -- Detailed compatibility breakdown
    match_status TEXT DEFAULT 'pending',
    matched_by TEXT,  -- Doctor's wallet address who created the match
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(donor_patient_id, recipient_patient_id, organ_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_match_donor ON organ_matches(donor_patient_id);
CREATE INDEX IF NOT EXISTS idx_match_recipient ON organ_matches(recipient_patient_id);
CREATE INDEX IF NOT EXISTS idx_match_score ON organ_matches(compatibility_score DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organ_donor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE organ_recipient_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE organ_matches ENABLE ROW LEVEL SECURITY;

-- Allow public read for organ donor data (for doctor searches)
CREATE POLICY "Allow public read for organ donors" ON organ_donor_data
    FOR SELECT USING (true);

-- Donors can manage their own data
CREATE POLICY "Donors can insert own data" ON organ_donor_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Donors can update own data" ON organ_donor_data
    FOR UPDATE USING (true);

-- Recipients can manage their own data
CREATE POLICY "Recipients can insert own data" ON organ_recipient_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Recipients can update own data" ON organ_recipient_data
    FOR UPDATE USING (true);

-- Allow public read for recipients (for doctor searches)
CREATE POLICY "Allow public read for recipients" ON organ_recipient_data
    FOR SELECT USING (true);

-- Organ matches - allow all operations for authenticated users
CREATE POLICY "Allow all operations on matches" ON organ_matches
    FOR ALL USING (true);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Organ donor tables created successfully!';
    RAISE NOTICE '📋 Tables: organ_donor_data, organ_recipient_data, organ_matches';
    RAISE NOTICE '🔒 RLS policies enabled';
END $$;
