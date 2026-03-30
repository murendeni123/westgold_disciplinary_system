-- Migration: Add Grade Head fields and permissions system
-- Date: 2026-03-30
-- Description: Adds has_class field to teachers table for hybrid grade head support

-- Add has_class field to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS has_class BOOLEAN DEFAULT TRUE;

-- Update existing teachers to have has_class = true if they have an assigned class
UPDATE teachers t
SET has_class = TRUE
WHERE EXISTS (
  SELECT 1 FROM classes c WHERE c.teacher_id = t.id
);

-- Update grade heads without classes to has_class = false
UPDATE teachers
SET has_class = FALSE
WHERE is_grade_head = TRUE 
  AND NOT EXISTS (
    SELECT 1 FROM classes c WHERE c.teacher_id = teachers.id
  );

-- Create index for faster grade head queries
CREATE INDEX IF NOT EXISTS idx_teachers_grade_head ON teachers(is_grade_head, grade_head_for) WHERE is_grade_head = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN teachers.has_class IS 'Indicates if teacher has an assigned class. Used for hybrid grade head roles (teacher + grade head vs grade head only)';
COMMENT ON COLUMN teachers.is_grade_head IS 'Indicates if teacher is assigned as a grade head';
COMMENT ON COLUMN teachers.grade_head_for IS 'The grade level this teacher is head of (e.g., 8, 9, 10)';
