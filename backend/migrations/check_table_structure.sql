-- Run this in Supabase SQL Editor to see pending_reports table structure

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pending_reports'
ORDER BY ordinal_position;
