-- Add school_id column to students table if it doesn't exist
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS directly
-- This will fail silently if the column already exists (which is fine)

-- For SQLite, we need to check if column exists first
-- If this fails, it means the column already exists, which is okay

-- Add school_id to students table
ALTER TABLE students ADD COLUMN school_id INTEGER REFERENCES schools(id);

-- Update existing students to have school_id = 1 (if any exist)
UPDATE students SET school_id = 1 WHERE school_id IS NULL;

-- Insert sample classes for school_id = 1
INSERT OR IGNORE INTO classes (id, class_name, grade_level, teacher_id, academic_year) VALUES
(1, '7A', '7', NULL, '2025-2026'),
(2, '7B', '7', NULL, '2025-2026'),
(3, '8A', '8', NULL, '2025-2026'),
(4, '8B', '8', NULL, '2025-2026'),
(5, '9A', '9', NULL, '2025-2026'),
(6, '9B', '9', NULL, '2025-2026'),
(7, '10A', '10', NULL, '2025-2026'),
(8, '10B', '10', NULL, '2025-2026');

-- Insert 15 sample students for school_id = 1 with diverse, realistic data
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, school_id, parent_link_code) VALUES
-- Grade 7 Students
('STU2026001', 'Liam', 'Johnson', '2012-03-15', 1, '7', 1, 'LNK-7A-001'),
('STU2026002', 'Emma', 'Williams', '2012-05-22', 1, '7', 1, 'LNK-7A-002'),
('STU2026003', 'Noah', 'Brown', '2012-07-08', 2, '7', 1, 'LNK-7B-003'),
('STU2026004', 'Olivia', 'Jones', '2012-09-14', 2, '7', 1, 'LNK-7B-004'),

-- Grade 8 Students
('STU2026005', 'Ava', 'Garcia', '2011-01-20', 3, '8', 1, 'LNK-8A-005'),
('STU2026006', 'Ethan', 'Martinez', '2011-04-11', 3, '8', 1, 'LNK-8A-006'),
('STU2026007', 'Sophia', 'Rodriguez', '2011-06-25', 4, '8', 1, 'LNK-8B-007'),
('STU2026008', 'Mason', 'Hernandez', '2011-08-30', 4, '8', 1, 'LNK-8B-008'),

-- Grade 9 Students
('STU2026009', 'Isabella', 'Lopez', '2010-02-17', 5, '9', 1, 'LNK-9A-009'),
('STU2026010', 'James', 'Gonzalez', '2010-05-03', 5, '9', 1, 'LNK-9A-010'),
('STU2026011', 'Mia', 'Wilson', '2010-07-19', 6, '9', 1, 'LNK-9B-011'),
('STU2026012', 'Benjamin', 'Anderson', '2010-10-28', 6, '9', 1, 'LNK-9B-012'),

-- Grade 10 Students
('STU2026013', 'Charlotte', 'Thomas', '2009-03-09', 7, '10', 1, 'LNK-10A-013'),
('STU2026014', 'Lucas', 'Taylor', '2009-06-15', 7, '10', 1, 'LNK-10A-014'),
('STU2026015', 'Amelia', 'Moore', '2009-09-21', 8, '10', 1, 'LNK-10B-015');

-- Insert sample attendance records (mix of present, absent, late)
INSERT INTO attendance (student_id, class_id, attendance_date, period, status, teacher_id, notes) VALUES
-- Recent attendance for student 1
(1, 1, '2026-01-06', 'Period 1', 'present', 1, NULL),
(1, 1, '2026-01-06', 'Period 2', 'present', 1, NULL),
(1, 1, '2026-01-07', 'Period 1', 'late', 1, 'Arrived 10 minutes late'),

-- Recent attendance for student 2
(2, 1, '2026-01-06', 'Period 1', 'present', 1, NULL),
(2, 1, '2026-01-07', 'Period 1', 'absent', 1, 'Sick'),

-- Recent attendance for student 3
(3, 2, '2026-01-06', 'Period 1', 'present', 1, NULL),
(3, 2, '2026-01-07', 'Period 1', 'present', 1, NULL),

-- Recent attendance for student 5
(5, 3, '2026-01-06', 'Period 1', 'present', 1, NULL),
(5, 3, '2026-01-07', 'Period 1', 'late', 1, 'Arrived 5 minutes late'),

-- Recent attendance for student 9
(9, 5, '2026-01-06', 'Period 1', 'present', 1, NULL),
(9, 5, '2026-01-07', 'Period 1', 'present', 1, NULL);

-- Insert sample behaviour incidents
INSERT INTO behaviour_incidents (student_id, teacher_id, incident_date, incident_time, incident_type, description, severity, points, status) VALUES
(1, 1, '2026-01-06', '10:30:00', 'Disruptive behavior', 'Talking during class despite warnings', 'low', 5, 'approved'),
(3, 1, '2026-01-05', '14:15:00', 'Late to class', 'Arrived 15 minutes late without excuse', 'low', 3, 'approved'),
(5, 1, '2026-01-04', '09:00:00', 'Incomplete homework', 'Did not complete math assignment', 'low', 2, 'approved'),
(7, 1, '2026-01-06', '11:45:00', 'Disrespect to staff', 'Argued with teacher about grade', 'medium', 10, 'pending'),
(9, 1, '2026-01-03', '13:20:00', 'Fighting', 'Physical altercation in hallway', 'high', 20, 'approved'),
(11, 1, '2026-01-07', '10:00:00', 'Uniform violation', 'Not wearing proper uniform', 'low', 2, 'approved');

-- Insert sample merits (positive behavior)
INSERT INTO merits (student_id, teacher_id, merit_date, merit_type, description, points) VALUES
(2, 1, '2026-01-06', 'Academic Excellence', 'Scored 100% on math test', 10),
(4, 1, '2026-01-05', 'Helping Others', 'Helped classmate understand difficult concept', 5),
(6, 1, '2026-01-06', 'Leadership', 'Led group project effectively', 8),
(8, 1, '2026-01-04', 'Perfect Attendance', 'Perfect attendance for the month', 5),
(10, 1, '2026-01-07', 'Good Behavior', 'Consistently respectful and attentive', 5),
(12, 1, '2026-01-06', 'Academic Excellence', 'Outstanding science project', 10),
(14, 1, '2026-01-05', 'Community Service', 'Volunteered for school cleanup', 8),
(15, 1, '2026-01-06', 'Sports Achievement', 'Won first place in athletics', 10);

-- Insert sample detention sessions
INSERT INTO detentions (detention_date, detention_time, duration, location, teacher_on_duty_id, status, notes) VALUES
('2026-01-10', '15:00:00', 60, 'Room 101', 1, 'scheduled', 'Regular Friday detention'),
('2026-01-17', '15:00:00', 60, 'Room 101', NULL, 'scheduled', 'Next week detention');

-- Insert detention assignments (linking students to detention sessions)
INSERT INTO detention_assignments (detention_id, student_id, incident_id, reason, status) VALUES
(1, 1, 1, 'Accumulated behaviour incidents', 'assigned'),
(1, 9, 5, 'Fighting incident - automatic detention', 'assigned');

-- Verify the data was inserted
SELECT 'Students inserted:' as info, COUNT(*) as count FROM students WHERE school_id = 1;
SELECT 'Classes created:' as info, COUNT(*) as count FROM classes;
SELECT 'Attendance records:' as info, COUNT(*) as count FROM attendance;
SELECT 'Behaviour incidents:' as info, COUNT(*) as count FROM behaviour_incidents;
SELECT 'Merits awarded:' as info, COUNT(*) as count FROM merits;
SELECT 'Detentions scheduled:' as info, COUNT(*) as count FROM detentions;
SELECT 'Detention assignments:' as info, COUNT(*) as count FROM detention_assignments;
