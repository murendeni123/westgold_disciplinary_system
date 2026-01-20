-- Migration: Add class_teacher_of column to teachers table
-- This allows tracking which class a teacher is the primary class teacher for

ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS class_teacher_of INTEGER;

ALTER TABLE teachers
ADD CONSTRAINT fk_teachers_class_teacher_of 
FOREIGN KEY (class_teacher_of) 
REFERENCES classes(id) 
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_teachers_class_teacher_of ON teachers(class_teacher_of);
