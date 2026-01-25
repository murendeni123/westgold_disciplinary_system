-- =====================================================
-- REFACTOR TIME SLOTS - REMOVE DAY-SPECIFIC SCHEDULING
-- =====================================================
-- Time slots now represent period definitions that apply to all weekdays
-- No more day_of_week field - periods apply Mon-Fri by default
-- =====================================================

-- Drop the old unique constraint that includes day_of_week
ALTER TABLE time_slots DROP CONSTRAINT IF EXISTS time_slots_template_id_day_of_week_cycle_day_period_number_key;

-- Drop the day_of_week column
ALTER TABLE time_slots DROP COLUMN IF EXISTS day_of_week;

-- Drop the cycle_day column (simplifying to fixed weekly only for now)
ALTER TABLE time_slots DROP COLUMN IF EXISTS cycle_day;

-- Add new columns for better period management
ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS slot_type VARCHAR(20) DEFAULT 'lesson' CHECK (slot_type IN ('lesson', 'break'));
ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS applies_to_days VARCHAR(50) DEFAULT 'Mon-Fri';
ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing is_break to slot_type
UPDATE time_slots SET slot_type = 'break' WHERE is_break = true;
UPDATE time_slots SET slot_type = 'lesson' WHERE is_break = false OR is_break IS NULL;

-- Drop the old is_break column
ALTER TABLE time_slots DROP COLUMN IF EXISTS is_break;

-- Add new unique constraint (template_id + period_number must be unique)
ALTER TABLE time_slots ADD CONSTRAINT time_slots_template_period_unique 
    UNIQUE(template_id, period_number);

-- Update indexes
DROP INDEX IF EXISTS idx_time_slots_day;
CREATE INDEX IF NOT EXISTS idx_time_slots_active ON time_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_time_slots_type ON time_slots(slot_type);

-- Add comment
COMMENT ON TABLE time_slots IS 'Period definitions that apply to all weekdays (Mon-Fri) by default';
COMMENT ON COLUMN time_slots.period_number IS 'Sequential order of periods (1, 2, 3, etc.)';
COMMENT ON COLUMN time_slots.slot_type IS 'Type of period: lesson or break';
COMMENT ON COLUMN time_slots.applies_to_days IS 'Which days this slot applies to (default: Mon-Fri)';
