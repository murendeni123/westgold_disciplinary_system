-- =====================================================
-- CLEANUP DUPLICATE TIME SLOTS
-- =====================================================
-- Remove duplicate periods that were created when periods were day-specific
-- Keep only unique periods per template
-- =====================================================

-- Delete duplicate time slots, keeping only the first occurrence of each period_number per template
DELETE FROM time_slots
WHERE id NOT IN (
    SELECT MIN(id)
    FROM time_slots
    GROUP BY template_id, period_number
);

-- Verify the cleanup
SELECT 
    template_id,
    COUNT(*) as total_periods,
    COUNT(DISTINCT period_number) as unique_periods
FROM time_slots
GROUP BY template_id;
