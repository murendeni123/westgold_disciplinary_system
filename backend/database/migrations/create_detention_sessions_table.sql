-- Migration: Create detention_sessions table for actual detention session scheduling
-- The existing 'detentions' table is for detention types/rules, not sessions

-- Create detention_sessions table
CREATE TABLE IF NOT EXISTS school_default.detention_sessions (
    id SERIAL PRIMARY KEY,
    detention_date DATE NOT NULL,
    detention_time TIME NOT NULL,
    end_time TIME,
    duration INTEGER DEFAULT 60,
    location TEXT,
    teacher_on_duty_id INTEGER,
    max_capacity INTEGER DEFAULT 20,
    current_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_on_duty_id) REFERENCES school_default.teachers(id) ON DELETE SET NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_detention_sessions_date ON school_default.detention_sessions(detention_date);
CREATE INDEX IF NOT EXISTS idx_detention_sessions_status ON school_default.detention_sessions(status);
CREATE INDEX IF NOT EXISTS idx_detention_sessions_teacher ON school_default.detention_sessions(teacher_on_duty_id);

-- Update detention_assignments to reference detention_sessions instead of detentions
-- First, check if the foreign key exists and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'school_default' 
        AND table_name = 'detention_assignments' 
        AND constraint_name = 'detention_assignments_detention_id_fkey'
    ) THEN
        ALTER TABLE school_default.detention_assignments 
        DROP CONSTRAINT detention_assignments_detention_id_fkey;
    END IF;
END $$;

-- Add new foreign key to detention_sessions
ALTER TABLE school_default.detention_assignments 
ADD CONSTRAINT detention_assignments_detention_id_fkey 
FOREIGN KEY (detention_id) REFERENCES school_default.detention_sessions(id) ON DELETE CASCADE;

-- Insert some sample detention sessions for testing
INSERT INTO school_default.detention_sessions 
    (detention_date, detention_time, end_time, duration, location, max_capacity, status, notes)
VALUES 
    (CURRENT_DATE + INTERVAL '3 days', '15:00:00', '16:00:00', 60, 'Room 101', 20, 'scheduled', 'Regular Friday detention'),
    (CURRENT_DATE + INTERVAL '10 days', '15:00:00', '16:00:00', 60, 'Room 101', 20, 'scheduled', 'Next week detention session')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'detention_sessions table created successfully';
END $$;
