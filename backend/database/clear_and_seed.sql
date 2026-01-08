-- Clear existing students and reseed with 10 new students for School 1

-- Delete existing students
DELETE FROM students;

-- Reset the sequence (PostgreSQL)
ALTER SEQUENCE students_id_seq RESTART WITH 1;

-- Ensure we have a class for school 1
INSERT INTO classes (class_name, grade_level, school_id, created_at)
VALUES ('Grade 7A', 7, 1, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert 10 new students
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES 
('S2024001', 'James', 'Anderson', '2010-03-15', 1, 7, 'JAMES001', CURRENT_TIMESTAMP),
('S2024002', 'Emma', 'Taylor', '2010-05-22', 1, 7, 'EMMA002', CURRENT_TIMESTAMP),
('S2024003', 'Oliver', 'Thomas', '2010-07-08', 1, 7, 'OLIVER003', CURRENT_TIMESTAMP),
('S2024004', 'Sophia', 'Moore', '2010-09-12', 1, 7, 'SOPHIA004', CURRENT_TIMESTAMP),
('S2024005', 'William', 'Jackson', '2010-11-30', 1, 7, 'WILLIAM005', CURRENT_TIMESTAMP),
('S2024006', 'Ava', 'White', '2010-02-18', 1, 7, 'AVA006', CURRENT_TIMESTAMP),
('S2024007', 'Noah', 'Harris', '2010-04-25', 1, 7, 'NOAH007', CURRENT_TIMESTAMP),
('S2024008', 'Isabella', 'Martin', '2010-06-14', 1, 7, 'ISABELLA008', CURRENT_TIMESTAMP),
('S2024009', 'Liam', 'Thompson', '2010-08-09', 1, 7, 'LIAM009', CURRENT_TIMESTAMP),
('S2024010', 'Mia', 'Garcia', '2010-10-21', 1, 7, 'MIA010', CURRENT_TIMESTAMP);

-- Verification
SELECT COUNT(*) as total_students FROM students;
SELECT student_id, first_name, last_name, parent_link_code FROM students ORDER BY student_id;
