-- =====================================================
-- REMOVE NOT NULL CONSTRAINT FROM DAY_OF_WEEK COLUMN
-- =====================================================
-- Makes day_of_week column nullable since it's not used
-- in the simplified timetable system
-- =====================================================

-- Remove NOT NULL constraint from day_of_week if it exists
ALTER TABLE time_slots 
ALTER COLUMN day_of_week DROP NOT NULL;

-- Also make cycle_day nullable if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'time_slots' 
        AND column_name = 'cycle_day'
    ) THEN
        ALTER TABLE time_slots 
        ALTER COLUMN cycle_day DROP NOT NULL;
    END IF;
END $$;

-- Verify the changes
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'time_slots' 
AND column_name IN ('day_of_week', 'cycle_day')
ORDER BY column_name;
