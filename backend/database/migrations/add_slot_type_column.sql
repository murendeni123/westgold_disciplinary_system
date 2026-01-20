-- =====================================================
-- ADD SLOT_TYPE COLUMN TO TIME_SLOTS TABLE
-- =====================================================
-- Adds slot_type column to differentiate between lessons and breaks
-- =====================================================

-- Add slot_type column if it doesn't exist
ALTER TABLE time_slots 
ADD COLUMN IF NOT EXISTS slot_type VARCHAR(20) DEFAULT 'lesson';

-- Add check constraint to ensure valid values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'time_slots_slot_type_check'
    ) THEN
        ALTER TABLE time_slots 
        ADD CONSTRAINT time_slots_slot_type_check 
        CHECK (slot_type IN ('lesson', 'break'));
    END IF;
END $$;

-- Update existing records to 'lesson' if NULL
UPDATE time_slots 
SET slot_type = 'lesson' 
WHERE slot_type IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'time_slots' 
AND column_name = 'slot_type';
