-- Seed 10 students for School 1
-- This script adds 10 new students with unique IDs

-- First, check and insert class if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM classes WHERE id = 1) THEN
        INSERT INTO classes (class_name, grade_level, school_id, created_at)
        VALUES ('Grade 7A', 7, 1, CURRENT_TIMESTAMP);
    END IF;
END $$;

-- Insert 10 new students (only if they don't already exist)
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
SELECT 'S2024001', 'James', 'Anderson', '2010-03-15', 1, 7, 'JAMES001', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_id = 'S2024001');

INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
SELECT 'S2024002', 'Emma', 'Taylor', '2010-05-22', 1, 7, 'EMMA002', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_id = 'S2024002');

INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
SELECT 'S2024003', 'Oliver', 'Thomas', '2010-07-08', 1, 7, 'OLIVER003', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_id = 'S2024003');

INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
SELECT 'S2024004', 'Sophia', 'Moore', '2010-09-12', 1, 7, 'SOPHIA004', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_id = 'S2024004');

INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
SELECT 'S2024005', 'William', 'Jackson', '2010-11-30', 1, 7, 'WILLIAM005', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_id = 'S2024005');

INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
SELECT 'S2024006', 'Ava', 'White', '2010-02-18', 1, 7, 'AVA006', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_id = 'S2024006');

INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
SELECT 'S2024007', 'Noah', 'Harris', '2010-04-25', 1, 7, 'NOAH007', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_id = 'S2024007');

INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
SELECT 'S2024008', 'Isabella', 'Martin', '2010-06-14', 1, 7, 'ISABELLA008', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_id = 'S2024008');

INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
SELECT 'S2024009', 'Liam', 'Thompson', '2010-08-09', 1, 7, 'LIAM009', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_id = 'S2024009');

INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
SELECT 'S2024010', 'Mia', 'Garcia', '2010-10-21', 1, 7, 'MIA010', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_id = 'S2024010');

-- Verification
SELECT student_id, first_name, last_name, grade_level, parent_link_code, class_id 
FROM students 
WHERE student_id LIKE 'S2024%'
ORDER BY student_id;
