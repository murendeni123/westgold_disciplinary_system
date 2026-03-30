-- Migration: Add Grade Head fields to teachers table
-- Date: 2026-03-30
-- Description: Adds is_grade_head, grade_head_for, and has_class fields

-- Add is_grade_head column
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS is_grade_head BOOLEAN DEFAULT FALSE;

-- Add grade_head_for column
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS grade_head_for VARCHAR(10);

-- Add has_class column
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS has_class BOOLEAN DEFAULT TRUE;

-- Update existing teachers to have has_class = true if they have an assigned class
UPDATE public.teachers t
SET has_class = TRUE
WHERE EXISTS (
  SELECT 1 FROM public.classes c WHERE c.teacher_id = t.id
);

-- Update grade heads without classes to has_class = false
UPDATE public.teachers
SET has_class = FALSE
WHERE is_grade_head = TRUE 
  AND NOT EXISTS (
    SELECT 1 FROM public.classes c WHERE c.teacher_id = public.teachers.id
  );

-- Create index for faster grade head queries
CREATE INDEX IF NOT EXISTS idx_teachers_grade_head 
ON public.teachers(is_grade_head, grade_head_for) 
WHERE is_grade_head = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN public.teachers.has_class IS 'Indicates if teacher has an assigned class. Used for hybrid grade head roles (teacher + grade head vs grade head only)';
COMMENT ON COLUMN public.teachers.is_grade_head IS 'Indicates if teacher is assigned as a grade head';
COMMENT ON COLUMN public.teachers.grade_head_for IS 'The grade level this teacher is head of (e.g., 8, 9, 10)';
