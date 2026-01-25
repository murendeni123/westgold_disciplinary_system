-- =====================================================
-- SEED PREDEFINED SUBJECTS CATALOGUE
-- =====================================================
-- Adds standard South African curriculum subjects
-- These are available system-wide for schools to select
-- =====================================================

-- Add unique constraint on code if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subjects_code_key'
    ) THEN
        ALTER TABLE subjects ADD CONSTRAINT subjects_code_key UNIQUE (code);
    END IF;
END $$;

-- Insert predefined subjects (only if they don't exist)
-- Using INSERT with ON CONFLICT for schemas with unique constraint
-- Or checking existence first for schemas without constraint
DO $$
BEGIN
    -- Afrikaans
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'AFR') THEN
        INSERT INTO subjects (name, code, description, is_active) VALUES ('Afrikaans', 'AFR', 'Afrikaans language and literature', true);
    END IF;
    
    -- English
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'ENG') THEN
        INSERT INTO subjects (name, code, description, is_active) VALUES ('English', 'ENG', 'English language and literature', true);
    END IF;
    
    -- Mathematics
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'MAT') THEN
        INSERT INTO subjects (name, code, description, is_active) VALUES ('Mathematics', 'MAT', 'Mathematics', true);
    END IF;
    
    -- Natural Sciences
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'NS') THEN
        INSERT INTO subjects (name, code, description, is_active) VALUES ('Natural Sciences', 'NS', 'Natural Sciences', true);
    END IF;
    
    -- Social Sciences
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'SS') THEN
        INSERT INTO subjects (name, code, description, is_active) VALUES ('Social Sciences', 'SS', 'Social Sciences', true);
    END IF;
    
    -- Life Orientation
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'LO') THEN
        INSERT INTO subjects (name, code, description, is_active) VALUES ('Life Orientation', 'LO', 'Life Orientation', true);
    END IF;
    
    -- Economic & Management Sciences
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'EMS') THEN
        INSERT INTO subjects (name, code, description, is_active) VALUES ('Economic & Management Sciences', 'EMS', 'Economic & Management Sciences', true);
    END IF;
    
    -- Technology
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'TECH') THEN
        INSERT INTO subjects (name, code, description, is_active) VALUES ('Technology', 'TECH', 'Technology', true);
    END IF;
    
    -- Creative Arts
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'CA') THEN
        INSERT INTO subjects (name, code, description, is_active) VALUES ('Creative Arts', 'CA', 'Creative Arts', true);
    END IF;
END $$;

-- Verify the subjects were added
SELECT code, name FROM subjects WHERE code IN ('AFR', 'ENG', 'MAT', 'NS', 'SS', 'LO', 'EMS', 'TECH', 'CA') ORDER BY code;
