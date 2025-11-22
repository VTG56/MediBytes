-- MediBytes Supabase Schema for Off-Chain Privacy-Preserving Data Storage
-- This stores sensitive metadata that should NOT be on public blockchain

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PATIENTS TABLE (User Management)
-- =====================================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    encrypted_name TEXT,  -- AES encrypted
    encrypted_email TEXT, -- AES encrypted  
    role TEXT CHECK (role IN ('patient', 'doctor')) NOT NULL DEFAULT 'patient',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patients_wallet ON patients(wallet_address);

-- =====================================================
-- 2. RECORD_METADATA (Off-chain record details)
-- =====================================================
CREATE TABLE record_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_wallet TEXT NOT NULL,
    record_id INTEGER NOT NULL,  -- On-chain record ID
    commitment_hash TEXT NOT NULL,  -- Matches blockchain
    original_hash TEXT NOT NULL,  -- NOT on blockchain
    salt TEXT NOT NULL,  -- NOT on blockchain
    ipfs_cid TEXT NOT NULL,
    encrypted_filename TEXT,  -- Original filename (encrypted)
    encrypted_description TEXT,  -- Encrypted description
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(patient_wallet, record_id)
);

CREATE INDEX idx_record_patient ON record_metadata(patient_wallet);
CREATE INDEX idx_record_commitment ON record_metadata(commitment_hash);

-- =====================================================
-- 3. ACCESS_LOGS (Detailed access history - OFF CHAIN)
-- =====================================================
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_wallet TEXT NOT NULL,
    doctor_wallet TEXT NOT NULL,
    record_id INTEGER,
    action TEXT CHECK (action IN ('view', 'download', 'grant', 'revoke')) NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_access_patient ON access_logs(patient_wallet);
CREATE INDEX idx_access_doctor ON access_logs(doctor_wallet);
CREATE INDEX idx_access_time ON access_logs(accessed_at);

-- =====================================================
-- 4. ORGAN_DONOR_DATA (Decrypted donor info for matching)
-- =====================================================
CREATE TABLE organ_donor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_wallet TEXT UNIQUE NOT NULL,
    encrypted_name TEXT,  -- AES encrypted
    age INTEGER,
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    organ_type TEXT,  -- kidney, liver, heart, lung, pancreas
    encrypted_medical_history TEXT,  -- AES encrypted
    tissue_type_hla TEXT,  -- For compatibility matching
    ipfs_cid TEXT NOT NULL,  -- Points to encrypted full data
    commitment_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_donor_wallet ON organ_donor_data(donor_wallet);
CREATE INDEX idx_donor_blood ON organ_donor_data(blood_type);
CREATE INDEX idx_donor_organ ON organ_donor_data(organ_type);
CREATE INDEX idx_donor_active ON organ_donor_data(is_active);

-- =====================================================
-- 5. ORGAN_RECIPIENT_DATA (Decrypted recipient info)
-- =====================================================
CREATE TABLE organ_recipient_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_wallet TEXT UNIQUE NOT NULL,
    encrypted_name TEXT,
    age INTEGER,
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    organ_needed TEXT,
    urgency_score INTEGER CHECK (urgency_score BETWEEN 1 AND 10),
    encrypted_medical_condition TEXT,
    tissue_type_hla TEXT,
    ipfs_cid TEXT NOT NULL,
    commitment_hash TEXT NOT NULL,
    wait_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipient_wallet ON organ_recipient_data(recipient_wallet);
CREATE INDEX idx_recipient_blood ON organ_recipient_data(blood_type);
CREATE INDEX idx_recipient_organ ON organ_recipient_data(organ_needed);
CREATE INDEX idx_recipient_urgency ON organ_recipient_data(urgency_score);
CREATE INDEX idx_recipient_active ON organ_recipient_data(is_active);

-- =====================================================
-- 6. ORGAN_MATCHES (Compatibility scores - ML generated)
-- =====================================================
CREATE TABLE organ_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_wallet TEXT NOT NULL,
    recipient_wallet TEXT NOT NULL,
    compatibility_score INTEGER CHECK (compatibility_score BETWEEN 0 AND 100),
    match_factors JSONB,  -- Detailed compatibility breakdown
    calculated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(donor_wallet, recipient_wallet)
);

CREATE INDEX idx_match_donor ON organ_matches(donor_wallet);
CREATE INDEX idx_match_recipient ON organ_matches(recipient_wallet);
CREATE INDEX idx_match_score ON organ_matches(compatibility_score DESC);

-- =====================================================
-- 7. ENCRYPTION_KEYS (Key management - HIGHLY SENSITIVE)
-- =====================================================
CREATE TABLE encryption_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    encrypted_master_key TEXT NOT NULL,  -- Encrypted with wallet signature
    key_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    last_rotated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keys_wallet ON encryption_keys(wallet_address);

-- =====================================================
-- 8. VERIFICATION_REQUESTS (QR scan verification logs)
-- =====================================================
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commitment_hash TEXT NOT NULL,
    verifier_ip TEXT,
    verification_result BOOLEAN,
    verified_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verify_commitment ON verification_requests(commitment_hash);
CREATE INDEX idx_verify_time ON verification_requests(verified_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organ_donor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE organ_recipient_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE organ_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

-- Patients can only see their own data
CREATE POLICY "Patients can view own data" ON patients
    FOR SELECT USING (wallet_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Patients can update own data" ON patients
    FOR UPDATE USING (wallet_address = auth.jwt() ->> 'wallet_address');

-- Record metadata policies
CREATE POLICY "Patients can view own records" ON record_metadata
    FOR SELECT USING (patient_wallet = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Patients can insert own records" ON record_metadata
    FOR INSERT WITH CHECK (patient_wallet = auth.jwt() ->> 'wallet_address');

-- Access logs (patients and authorized doctors can view)
CREATE POLICY "Users can view relevant access logs" ON access_logs
    FOR SELECT USING (
        patient_wallet = auth.jwt() ->> 'wallet_address' OR
        doctor_wallet = auth.jwt() ->> 'wallet_address'
    );

-- Organ data policies (doctors can view for matching)
CREATE POLICY "Donors can manage own data" ON organ_donor_data
    FOR ALL USING (donor_wallet = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Doctors can view organ data" ON organ_donor_data
    FOR SELECT USING (auth.jwt() ->> 'role' = 'doctor');

CREATE POLICY "Recipients can manage own data" ON organ_recipient_data
    FOR ALL USING (recipient_wallet = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Doctors can view recipient data" ON organ_recipient_data
    FOR SELECT USING (auth.jwt() ->> 'role' = 'doctor');

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organ_donor_updated_at BEFORE UPDATE ON organ_donor_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organ_recipient_updated_at BEFORE UPDATE ON organ_recipient_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment wait time for recipients (run daily)
CREATE OR REPLACE FUNCTION increment_wait_times()
RETURNS void AS $$
BEGIN
    UPDATE organ_recipient_data
    SET wait_time_days = wait_time_days + 1
    WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE QUERIES (for testing)
-- =====================================================

-- Get patient records with metadata
-- SELECT r.*, m.*
-- FROM record_metadata m
-- WHERE m.patient_wallet = '0x...';

-- Get compatibility matches for a recipient
-- SELECT 
--     om.*,
--     od.organ_type,
--     od.blood_type,
--     or.urgency_score
-- FROM organ_matches om
-- JOIN organ_donor_data od ON om.donor_wallet = od.donor_wallet
-- JOIN organ_recipient_data or ON om.recipient_wallet = or.recipient_wallet
-- WHERE om.recipient_wallet = '0x...'
-- ORDER BY om.compatibility_score DESC;

-- Get access history for patient
-- SELECT 
--     al.*,
--     p.encrypted_name as doctor_name
-- FROM access_logs al
-- JOIN patients p ON al.doctor_wallet = p.wallet_address
-- WHERE al.patient_wallet = '0x...'
-- ORDER BY al.accessed_at DESC;

COMMENT ON TABLE record_metadata IS 'Off-chain metadata for medical records - stores original hashes and salts NOT on blockchain';
COMMENT ON TABLE access_logs IS 'Detailed access logs - NOT stored on blockchain to prevent pattern analysis';
COMMENT ON TABLE organ_donor_data IS 'Decrypted donor information for ML matching algorithm';
COMMENT ON TABLE organ_recipient_data IS 'Decrypted recipient information for ML matching';
COMMENT ON TABLE organ_matches IS 'Pre-computed compatibility scores from ML service';
