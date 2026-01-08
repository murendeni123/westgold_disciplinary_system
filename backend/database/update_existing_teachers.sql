-- Update existing teachers with sample data
-- This script assigns existing teachers to classes and creates related records

-- First, let's get the existing teacher user IDs
-- We'll assign them to classes in order

-- Update classes to assign existing teachers
-- This will assign the first 8 teachers found to the 8 classes
WITH teacher_list AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM users 
    WHERE role = 'teacher'
    LIMIT 8
)
UPDATE classes c
SET teacher_id = t.id
FROM (
    SELECT id, rn FROM teacher_list
) t
WHERE c.id = t.rn;

-- Ensure all existing teachers have teacher records
INSERT INTO teachers (user_id, employee_id, phone)
SELECT 
    u.id,
    'EMP' || LPAD(u.id::text, 4, '0'),
    '+27-' || (FLOOR(RANDOM() * 900000000 + 100000000))::text
FROM users u
WHERE u.role = 'teacher'
AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = u.id);

-- Update behaviour incidents to be logged by class teachers
UPDATE behaviour_incidents bi
SET teacher_id = c.teacher_id
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE bi.student_id = s.id 
AND c.teacher_id IS NOT NULL
AND bi.teacher_id = 1;

-- Update merits to be awarded by class teachers
UPDATE merits m
SET teacher_id = c.teacher_id
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE m.student_id = s.id 
AND c.teacher_id IS NOT NULL
AND m.teacher_id = 1;

-- Update attendance records to be marked by class teachers
UPDATE attendance a
SET teacher_id = c.teacher_id
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE a.student_id = s.id 
AND c.teacher_id IS NOT NULL
AND a.teacher_id = 1;

-- Add additional behaviour incidents from different teachers
WITH teacher_ids AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM users WHERE role = 'teacher' LIMIT 8
)
INSERT INTO behaviour_incidents (student_id, teacher_id, incident_date, incident_time, incident_type, description, severity, points, status)
SELECT 
    s.id,
    t.id,
    CURRENT_DATE,
    '10:30:00',
    CASE 
        WHEN s.id % 4 = 0 THEN 'Late to class'
        WHEN s.id % 4 = 1 THEN 'Disruptive behavior'
        WHEN s.id % 4 = 2 THEN 'Incomplete homework'
        ELSE 'Uniform violation'
    END,
    CASE 
        WHEN s.id % 4 = 0 THEN 'Arrived late without excuse'
        WHEN s.id % 4 = 1 THEN 'Talking during lesson'
        WHEN s.id % 4 = 2 THEN 'Missing assignment'
        ELSE 'Not wearing proper uniform'
    END,
    'low',
    CASE 
        WHEN s.id % 4 = 0 THEN 3
        WHEN s.id % 4 = 1 THEN 5
        WHEN s.id % 4 = 2 THEN 2
        ELSE 2
    END,
    'approved'
FROM students s
JOIN classes c ON s.class_id = c.id
JOIN teacher_ids t ON c.id = t.rn
WHERE s.id <= 8
AND NOT EXISTS (
    SELECT 1 FROM behaviour_incidents bi2 
    WHERE bi2.student_id = s.id 
    AND bi2.incident_date = CURRENT_DATE
);

-- Add merits from different teachers
WITH teacher_ids AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM users WHERE role = 'teacher' LIMIT 8
)
INSERT INTO merits (student_id, teacher_id, merit_date, merit_type, description, points)
SELECT 
    s.id,
    t.id,
    CURRENT_DATE,
    CASE 
        WHEN s.id % 5 = 0 THEN 'Academic Excellence'
        WHEN s.id % 5 = 1 THEN 'Helping Others'
        WHEN s.id % 5 = 2 THEN 'Leadership'
        WHEN s.id % 5 = 3 THEN 'Good Behavior'
        ELSE 'Perfect Attendance'
    END,
    CASE 
        WHEN s.id % 5 = 0 THEN 'Outstanding test performance'
        WHEN s.id % 5 = 1 THEN 'Helped classmate with work'
        WHEN s.id % 5 = 2 THEN 'Led group project effectively'
        WHEN s.id % 5 = 3 THEN 'Consistently respectful'
        ELSE 'Perfect attendance this week'
    END,
    CASE 
        WHEN s.id % 5 = 0 THEN 10
        WHEN s.id % 5 = 1 THEN 5
        WHEN s.id % 5 = 2 THEN 8
        WHEN s.id % 5 = 3 THEN 5
        ELSE 5
    END
FROM students s
JOIN classes c ON s.class_id = c.id
JOIN teacher_ids t ON c.id = t.rn
WHERE s.id <= 10
AND NOT EXISTS (
    SELECT 1 FROM merits m2 
    WHERE m2.student_id = s.id 
    AND m2.merit_date = CURRENT_DATE
);

-- Update detention sessions to have teachers on duty
WITH teacher_ids AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM users WHERE role = 'teacher' LIMIT 8
)
UPDATE detentions d
SET teacher_on_duty_id = t.id
FROM teacher_ids t
WHERE d.teacher_on_duty_id IS NULL
AND t.rn = 1;

-- Create timetable entries for existing teachers
WITH teacher_ids AS (
    SELECT u.id, c.id as class_id, c.class_name, ROW_NUMBER() OVER (ORDER BY u.id) as rn
    FROM users u
    JOIN classes c ON u.id = c.teacher_id
    WHERE u.role = 'teacher'
    LIMIT 8
)
INSERT INTO timetables (class_id, teacher_id, day_of_week, period_number, subject, start_time, end_time, room, academic_year)
SELECT 
    t.class_id,
    t.id,
    1, -- Monday
    CASE 
        WHEN t.rn % 4 = 1 THEN 1
        WHEN t.rn % 4 = 2 THEN 2
        WHEN t.rn % 4 = 3 THEN 3
        ELSE 4
    END,
    CASE 
        WHEN t.rn % 8 = 1 THEN 'Mathematics'
        WHEN t.rn % 8 = 2 THEN 'English'
        WHEN t.rn % 8 = 3 THEN 'Science'
        WHEN t.rn % 8 = 4 THEN 'History'
        WHEN t.rn % 8 = 5 THEN 'Physical Education'
        WHEN t.rn % 8 = 6 THEN 'Geography'
        WHEN t.rn % 8 = 7 THEN 'Art'
        ELSE 'Computer Science'
    END,
    CASE 
        WHEN t.rn % 4 = 1 THEN '08:00:00'
        WHEN t.rn % 4 = 2 THEN '09:00:00'
        WHEN t.rn % 4 = 3 THEN '10:30:00'
        ELSE '11:30:00'
    END,
    CASE 
        WHEN t.rn % 4 = 1 THEN '09:00:00'
        WHEN t.rn % 4 = 2 THEN '10:00:00'
        WHEN t.rn % 4 = 3 THEN '11:30:00'
        ELSE '12:30:00'
    END,
    'Room ' || (200 + t.rn)::text,
    '2025-2026'
FROM teacher_ids t
WHERE NOT EXISTS (
    SELECT 1 FROM timetables tt 
    WHERE tt.class_id = t.class_id 
    AND tt.teacher_id = t.id 
    AND tt.day_of_week = 1
);

-- Add a second period for each teacher
WITH teacher_ids AS (
    SELECT u.id, c.id as class_id, c.class_name, ROW_NUMBER() OVER (ORDER BY u.id) as rn
    FROM users u
    JOIN classes c ON u.id = c.teacher_id
    WHERE u.role = 'teacher'
    LIMIT 8
)
INSERT INTO timetables (class_id, teacher_id, day_of_week, period_number, subject, start_time, end_time, room, academic_year)
SELECT 
    t.class_id,
    t.id,
    2, -- Tuesday
    CASE 
        WHEN t.rn % 4 = 1 THEN 2
        WHEN t.rn % 4 = 2 THEN 3
        WHEN t.rn % 4 = 3 THEN 4
        ELSE 5
    END,
    CASE 
        WHEN t.rn % 8 = 1 THEN 'Mathematics'
        WHEN t.rn % 8 = 2 THEN 'English'
        WHEN t.rn % 8 = 3 THEN 'Science'
        WHEN t.rn % 8 = 4 THEN 'History'
        WHEN t.rn % 8 = 5 THEN 'Physical Education'
        WHEN t.rn % 8 = 6 THEN 'Geography'
        WHEN t.rn % 8 = 7 THEN 'Art'
        ELSE 'Computer Science'
    END,
    CASE 
        WHEN t.rn % 4 = 1 THEN '09:00:00'
        WHEN t.rn % 4 = 2 THEN '10:30:00'
        WHEN t.rn % 4 = 3 THEN '11:30:00'
        ELSE '13:00:00'
    END,
    CASE 
        WHEN t.rn % 4 = 1 THEN '10:00:00'
        WHEN t.rn % 4 = 2 THEN '11:30:00'
        WHEN t.rn % 4 = 3 THEN '12:30:00'
        ELSE '14:00:00'
    END,
    'Room ' || (200 + t.rn)::text,
    '2025-2026'
FROM teacher_ids t
WHERE NOT EXISTS (
    SELECT 1 FROM timetables tt 
    WHERE tt.class_id = t.class_id 
    AND tt.teacher_id = t.id 
    AND tt.day_of_week = 2
);

-- Verification queries
SELECT 'Existing teachers:' as info, COUNT(*) as count FROM users WHERE role = 'teacher';
SELECT 'Teacher records:' as info, COUNT(*) as count FROM teachers;
SELECT 'Classes with teachers assigned:' as info, COUNT(*) as count FROM classes WHERE teacher_id IS NOT NULL;
SELECT 'Behaviour incidents by teachers:' as info, COUNT(*) as count FROM behaviour_incidents WHERE teacher_id IN (SELECT id FROM users WHERE role = 'teacher');
SELECT 'Merits by teachers:' as info, COUNT(*) as count FROM merits WHERE teacher_id IN (SELECT id FROM users WHERE role = 'teacher');
SELECT 'Timetable entries:' as info, COUNT(*) as count FROM timetables;

-- Show teacher-class assignments
SELECT 
    u.name as teacher_name,
    u.email,
    t.employee_id,
    STRING_AGG(c.class_name, ', ') as assigned_classes
FROM users u
LEFT JOIN teachers t ON u.id = t.user_id
LEFT JOIN classes c ON u.id = c.teacher_id
WHERE u.role = 'teacher'
GROUP BY u.id, u.name, u.email, t.employee_id
ORDER BY u.name;
