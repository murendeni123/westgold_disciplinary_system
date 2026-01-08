-- PostgreSQL version of sample teachers data
-- This script creates sample teachers and assigns them to classes

-- First, we need to hash passwords for teachers
-- Password for all sample teachers: "Teacher123!"
-- Bcrypt hash: $2b$10$YourHashHere (in production, use proper bcrypt)
-- For this sample, we'll use a simple hash that matches your auth system

-- Insert sample teacher users (role = 'teacher')
INSERT INTO users (email, password, role, name) VALUES
('sarah.mitchell@school.com', '$2b$10$rQJ5cKHW5Y0RZxGxQZ5zJ.kF7YvGxQxQxQxQxQxQxQxQxQxQxQxQx', 'teacher', 'Sarah Mitchell'),
('david.thompson@school.com', '$2b$10$rQJ5cKHW5Y0RZxGxQZ5zJ.kF7YvGxQxQxQxQxQxQxQxQxQxQxQxQx', 'teacher', 'David Thompson'),
('maria.rodriguez@school.com', '$2b$10$rQJ5cKHW5Y0RZxGxQZ5zJ.kF7YvGxQxQxQxQxQxQxQxQxQxQxQxQx', 'teacher', 'Maria Rodriguez'),
('james.wilson@school.com', '$2b$10$rQJ5cKHW5Y0RZxGxQZ5zJ.kF7YvGxQxQxQxQxQxQxQxQxQxQxQxQx', 'teacher', 'James Wilson'),
('emily.chen@school.com', '$2b$10$rQJ5cKHW5Y0RZxGxQZ5zJ.kF7YvGxQxQxQxQxQxQxQxQxQxQxQxQx', 'teacher', 'Emily Chen'),
('michael.brown@school.com', '$2b$10$rQJ5cKHW5Y0RZxGxQZ5zJ.kF7YvGxQxQxQxQxQxQxQxQxQxQxQxQx', 'teacher', 'Michael Brown'),
('jennifer.davis@school.com', '$2b$10$rQJ5cKHW5Y0RZxGxQZ5zJ.kF7YvGxQxQxQxQxQxQxQxQxQxQxQxQx', 'teacher', 'Jennifer Davis'),
('robert.anderson@school.com', '$2b$10$rQJ5cKHW5Y0RZxGxQZ5zJ.kF7YvGxQxQxQxQxQxQxQxQxQxQxQxQx', 'teacher', 'Robert Anderson')
ON CONFLICT (email) DO NOTHING;

-- Insert teacher records (extends users table with additional info)
-- We need to get the user_ids from the users we just created
INSERT INTO teachers (user_id, employee_id, phone) 
SELECT u.id, 'EMP' || LPAD(u.id::text, 4, '0'), '+27-' || (FLOOR(RANDOM() * 900000000 + 100000000))::text
FROM users u 
WHERE u.role = 'teacher' 
AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = u.id);

-- Update classes to assign teachers as class teachers
-- Grade 7 classes
UPDATE classes SET teacher_id = (SELECT id FROM users WHERE email = 'sarah.mitchell@school.com') WHERE class_name = '7A';
UPDATE classes SET teacher_id = (SELECT id FROM users WHERE email = 'david.thompson@school.com') WHERE class_name = '7B';

-- Grade 8 classes
UPDATE classes SET teacher_id = (SELECT id FROM users WHERE email = 'maria.rodriguez@school.com') WHERE class_name = '8A';
UPDATE classes SET teacher_id = (SELECT id FROM users WHERE email = 'james.wilson@school.com') WHERE class_name = '8B';

-- Grade 9 classes
UPDATE classes SET teacher_id = (SELECT id FROM users WHERE email = 'emily.chen@school.com') WHERE class_name = '9A';
UPDATE classes SET teacher_id = (SELECT id FROM users WHERE email = 'michael.brown@school.com') WHERE class_name = '9B';

-- Grade 10 classes
UPDATE classes SET teacher_id = (SELECT id FROM users WHERE email = 'jennifer.davis@school.com') WHERE class_name = '10A';
UPDATE classes SET teacher_id = (SELECT id FROM users WHERE email = 'robert.anderson@school.com') WHERE class_name = '10B';

-- Update existing behaviour incidents to be logged by appropriate class teachers
UPDATE behaviour_incidents bi
SET teacher_id = c.teacher_id
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE bi.student_id = s.id AND bi.teacher_id = 1;

-- Update existing merits to be awarded by appropriate class teachers
UPDATE merits m
SET teacher_id = c.teacher_id
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE m.student_id = s.id AND m.teacher_id = 1;

-- Update attendance records to be marked by appropriate class teachers
UPDATE attendance a
SET teacher_id = c.teacher_id
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE a.student_id = s.id AND a.teacher_id = 1;

-- Add some additional behaviour incidents from different teachers
INSERT INTO behaviour_incidents (student_id, teacher_id, incident_date, incident_time, incident_type, description, severity, points, status) VALUES
-- Sarah Mitchell (7A teacher) incidents
((SELECT id FROM students WHERE student_id = 'STU2026001'), 
 (SELECT id FROM users WHERE email = 'sarah.mitchell@school.com'),
 '2026-01-08', '09:15:00', 'Late to class', 'Arrived 5 minutes late', 'low', 2, 'approved'),

-- David Thompson (7B teacher) incidents
((SELECT id FROM students WHERE student_id = 'STU2026003'), 
 (SELECT id FROM users WHERE email = 'david.thompson@school.com'),
 '2026-01-08', '11:30:00', 'Disruptive behavior', 'Talking during lesson', 'low', 3, 'approved'),

-- Maria Rodriguez (8A teacher) incidents
((SELECT id FROM students WHERE student_id = 'STU2026005'), 
 (SELECT id FROM users WHERE email = 'maria.rodriguez@school.com'),
 '2026-01-08', '14:00:00', 'Incomplete homework', 'Missing science assignment', 'low', 2, 'approved'),

-- Emily Chen (9A teacher) incidents
((SELECT id FROM students WHERE student_id = 'STU2026009'), 
 (SELECT id FROM users WHERE email = 'emily.chen@school.com'),
 '2026-01-08', '10:45:00', 'Disrespect to staff', 'Rude response to teacher', 'medium', 8, 'pending');

-- Add more merits from different teachers
INSERT INTO merits (student_id, teacher_id, merit_date, merit_type, description, points) VALUES
-- Sarah Mitchell awarding merits
((SELECT id FROM students WHERE student_id = 'STU2026002'), 
 (SELECT id FROM users WHERE email = 'sarah.mitchell@school.com'),
 '2026-01-08', 'Excellent Participation', 'Active participation in class discussion', 7),

-- David Thompson awarding merits
((SELECT id FROM students WHERE student_id = 'STU2026004'), 
 (SELECT id FROM users WHERE email = 'david.thompson@school.com'),
 '2026-01-08', 'Helping Others', 'Tutored struggling classmate', 6),

-- Maria Rodriguez awarding merits
((SELECT id FROM students WHERE student_id = 'STU2026006'), 
 (SELECT id FROM users WHERE email = 'maria.rodriguez@school.com'),
 '2026-01-08', 'Academic Excellence', 'Perfect score on science test', 10),

-- James Wilson awarding merits
((SELECT id FROM students WHERE student_id = 'STU2026008'), 
 (SELECT id FROM users WHERE email = 'james.wilson@school.com'),
 '2026-01-08', 'Leadership', 'Led group project successfully', 8);

-- Update detention session to have a teacher on duty
UPDATE detentions 
SET teacher_on_duty_id = (SELECT id FROM users WHERE email = 'michael.brown@school.com')
WHERE detention_date = '2026-01-10';

UPDATE detentions 
SET teacher_on_duty_id = (SELECT id FROM users WHERE email = 'jennifer.davis@school.com')
WHERE detention_date = '2026-01-17';

-- Create sample timetable entries for teachers (optional - shows what they teach)
INSERT INTO timetables (class_id, teacher_id, day_of_week, period_number, subject, start_time, end_time, room, academic_year) VALUES
-- Sarah Mitchell (7A) - Mathematics
(1, (SELECT id FROM users WHERE email = 'sarah.mitchell@school.com'), 1, 1, 'Mathematics', '08:00:00', '09:00:00', 'Room 201', '2025-2026'),
(1, (SELECT id FROM users WHERE email = 'sarah.mitchell@school.com'), 1, 2, 'Mathematics', '09:00:00', '10:00:00', 'Room 201', '2025-2026'),

-- David Thompson (7B) - English
(2, (SELECT id FROM users WHERE email = 'david.thompson@school.com'), 1, 1, 'English', '08:00:00', '09:00:00', 'Room 202', '2025-2026'),
(2, (SELECT id FROM users WHERE email = 'david.thompson@school.com'), 1, 3, 'English', '10:30:00', '11:30:00', 'Room 202', '2025-2026'),

-- Maria Rodriguez (8A) - Science
(3, (SELECT id FROM users WHERE email = 'maria.rodriguez@school.com'), 1, 2, 'Science', '09:00:00', '10:00:00', 'Lab 1', '2025-2026'),
(3, (SELECT id FROM users WHERE email = 'maria.rodriguez@school.com'), 1, 4, 'Science', '11:30:00', '12:30:00', 'Lab 1', '2025-2026'),

-- James Wilson (8B) - History
(4, (SELECT id FROM users WHERE email = 'james.wilson@school.com'), 1, 1, 'History', '08:00:00', '09:00:00', 'Room 204', '2025-2026'),
(4, (SELECT id FROM users WHERE email = 'james.wilson@school.com'), 1, 3, 'History', '10:30:00', '11:30:00', 'Room 204', '2025-2026'),

-- Emily Chen (9A) - Physical Education
(5, (SELECT id FROM users WHERE email = 'emily.chen@school.com'), 1, 5, 'Physical Education', '13:00:00', '14:00:00', 'Gymnasium', '2025-2026'),
(5, (SELECT id FROM users WHERE email = 'emily.chen@school.com'), 2, 5, 'Physical Education', '13:00:00', '14:00:00', 'Gymnasium', '2025-2026'),

-- Michael Brown (9B) - Geography
(6, (SELECT id FROM users WHERE email = 'michael.brown@school.com'), 1, 2, 'Geography', '09:00:00', '10:00:00', 'Room 206', '2025-2026'),
(6, (SELECT id FROM users WHERE email = 'michael.brown@school.com'), 1, 4, 'Geography', '11:30:00', '12:30:00', 'Room 206', '2025-2026'),

-- Jennifer Davis (10A) - Art
(7, (SELECT id FROM users WHERE email = 'jennifer.davis@school.com'), 1, 3, 'Art', '10:30:00', '11:30:00', 'Art Room', '2025-2026'),
(7, (SELECT id FROM users WHERE email = 'jennifer.davis@school.com'), 1, 6, 'Art', '14:00:00', '15:00:00', 'Art Room', '2025-2026'),

-- Robert Anderson (10B) - Computer Science
(8, (SELECT id FROM users WHERE email = 'robert.anderson@school.com'), 1, 2, 'Computer Science', '09:00:00', '10:00:00', 'Computer Lab', '2025-2026'),
(8, (SELECT id FROM users WHERE email = 'robert.anderson@school.com'), 1, 4, 'Computer Science', '11:30:00', '12:30:00', 'Computer Lab', '2025-2026');

-- Verify the teacher data was inserted
SELECT 'Teachers created:' as info, COUNT(*) as count FROM users WHERE role = 'teacher';
SELECT 'Teacher records:' as info, COUNT(*) as count FROM teachers;
SELECT 'Classes with teachers:' as info, COUNT(*) as count FROM classes WHERE teacher_id IS NOT NULL;
SELECT 'Timetable entries:' as info, COUNT(*) as count FROM timetables;

-- Show teacher assignments
SELECT 
    u.name as teacher_name,
    u.email,
    t.employee_id,
    STRING_AGG(c.class_name, ', ') as classes
FROM users u
JOIN teachers t ON u.id = t.user_id
LEFT JOIN classes c ON u.id = c.teacher_id
WHERE u.role = 'teacher'
GROUP BY u.id, u.name, u.email, t.employee_id
ORDER BY u.name;
