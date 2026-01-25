-- Migration: Add teacher_on_duty_id column to detentions table
-- This ensures the detentions table has the correct schema

-- Add teacher_on_duty_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'school_default' 
        AND table_name = 'detentions' 
        AND column_name = 'teacher_on_duty_id'
    ) THEN
        ALTER TABLE school_default.detentions 
        ADD COLUMN teacher_on_duty_id INTEGER;
        
        RAISE NOTICE 'Added teacher_on_duty_id column to detentions table';
    ELSE
        RAISE NOTICE 'teacher_on_duty_id column already exists';
    END IF;
END $$;

-- Add max_capacity column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'school_default' 
        AND table_name = 'detentions' 
        AND column_name = 'max_capacity'
    ) THEN
        ALTER TABLE school_default.detentions 
        ADD COLUMN max_capacity INTEGER DEFAULT 20;
        
        RAISE NOTICE 'Added max_capacity column to detentions table';
    ELSE
        RAISE NOTICE 'max_capacity column already exists';
    END IF;
END $$;

-- Add end_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'school_default' 
        AND table_name = 'detentions' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE school_default.detentions 
        ADD COLUMN end_time TIME;
        
        RAISE NOTICE 'Added end_time column to detentions table';
    ELSE
        RAISE NOTICE 'end_time column already exists';
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'school_default' 
        AND table_name = 'detentions' 
        AND constraint_name = 'detentions_teacher_on_duty_id_fkey'
    ) THEN
        ALTER TABLE school_default.detentions 
        ADD CONSTRAINT detentions_teacher_on_duty_id_fkey 
        FOREIGN KEY (teacher_on_duty_id) REFERENCES school_default.teachers(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint for teacher_on_duty_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;
