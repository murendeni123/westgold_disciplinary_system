-- Add school_id to existing teachers
-- This script updates all existing teachers to have school_id = 1 (default school)

-- Update users table - set school_id for all teachers
UPDATE users 
SET school_id = 1 
WHERE role = 'teacher' 
AND school_id IS NULL;

-- Update teachers table - set school_id for all teacher records
UPDATE teachers 
SET school_id = 1 
WHERE school_id IS NULL;

-- Verify the updates
SELECT 'Teachers with school_id in users table:' as info, COUNT(*) as count 
FROM users 
WHERE role = 'teacher' AND school_id IS NOT NULL;

SELECT 'Teachers with school_id in teachers table:' as info, COUNT(*) as count 
FROM teachers 
WHERE school_id IS NOT NULL;

-- Show teacher-school assignments
SELECT 
    u.id,
    u.name as teacher_name,
    u.email,
    u.school_id as user_school_id,
    t.school_id as teacher_school_id,
    s.name as school_name
FROM users u
LEFT JOIN teachers t ON u.id = t.user_id
LEFT JOIN schools s ON u.school_id = s.id
WHERE u.role = 'teacher'
ORDER BY u.name;
