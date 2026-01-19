-- Migration: Add parent_link_code column to students table
-- This column is used for parents to link their children using a unique code

-- Add parent_link_code column if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_link_code TEXT;

-- Create unique index on parent_link_code for faster lookups and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_parent_link_code ON students(parent_link_code) WHERE parent_link_code IS NOT NULL;

-- Generate link codes for existing students that don't have one
-- Format: 8 character uppercase alphanumeric code
UPDATE students 
SET parent_link_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8))
WHERE parent_link_code IS NULL;

COMMENT ON COLUMN students.parent_link_code IS 'Unique code for parents to link their children (e.g., LINK0001)';
