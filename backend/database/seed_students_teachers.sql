-- Seed 10 Students and 10 Teachers for School ID 1
-- This script adds sample students and teachers to the database

-- First, let's get or create a default class for school 1
-- Insert a default class if it doesn't exist
INSERT INTO classes (class_name, grade_level, school_id, created_at)
VALUES ('Grade 7A', 7, 1, CURRENT_TIMESTAMP);

-- Get the class_id (we'll use the first class for school 1)
-- For this script, we'll assume class_id = 1 exists or was just created

-- ============================================
-- INSERT 10 TEACHERS
-- ============================================

-- Teacher 1
INSERT INTO users (email, password, role, name, school_id, created_at)
VALUES ('teacher.smith@school.com', '$2a$10$YourHashedPasswordHere', 'teacher', 'John Smith', 1, CURRENT_TIMESTAMP);

INSERT INTO teachers (user_id, employee_id, phone, school_id, created_at)
SELECT id, 'T001', '555-0101', 1, CURRENT_TIMESTAMP
FROM users WHERE email = 'teacher.smith@school.com';

-- Teacher 2
INSERT INTO users (email, password, role, name, school_id, created_at)
VALUES ('teacher.johnson@school.com', '$2a$10$YourHashedPasswordHere', 'teacher', 'Sarah Johnson', 1, CURRENT_TIMESTAMP);

INSERT INTO teachers (user_id, employee_id, phone, school_id, created_at)
SELECT id, 'T002', '555-0102', 1, CURRENT_TIMESTAMP
FROM users WHERE email = 'teacher.johnson@school.com';

-- Teacher 3
INSERT INTO users (email, password, role, name, school_id, created_at)
VALUES ('teacher.williams@school.com', '$2a$10$YourHashedPasswordHere', 'teacher', 'Michael Williams', 1, CURRENT_TIMESTAMP);

INSERT INTO teachers (user_id, employee_id, phone, school_id, created_at)
SELECT id, 'T003', '555-0103', 1, CURRENT_TIMESTAMP
FROM users WHERE email = 'teacher.williams@school.com';

-- Teacher 4
INSERT INTO users (email, password, role, name, school_id, created_at)
VALUES ('teacher.brown@school.com', '$2a$10$YourHashedPasswordHere', 'teacher', 'Emily Brown', 1, CURRENT_TIMESTAMP);

INSERT INTO teachers (user_id, employee_id, phone, school_id, created_at)
SELECT id, 'T004', '555-0104', 1, CURRENT_TIMESTAMP
FROM users WHERE email = 'teacher.brown@school.com';

-- Teacher 5
INSERT INTO users (email, password, role, name, school_id, created_at)
VALUES ('teacher.jones@school.com', '$2a$10$YourHashedPasswordHere', 'teacher', 'David Jones', 1, CURRENT_TIMESTAMP);

INSERT INTO teachers (user_id, employee_id, phone, school_id, created_at)
SELECT id, 'T005', '555-0105', 1, CURRENT_TIMESTAMP
FROM users WHERE email = 'teacher.jones@school.com';

-- Teacher 6
INSERT INTO users (email, password, role, name, school_id, created_at)
VALUES ('teacher.garcia@school.com', '$2a$10$YourHashedPasswordHere', 'teacher', 'Maria Garcia', 1, CURRENT_TIMESTAMP);

INSERT INTO teachers (user_id, employee_id, phone, school_id, created_at)
SELECT id, 'T006', '555-0106', 1, CURRENT_TIMESTAMP
FROM users WHERE email = 'teacher.garcia@school.com';

-- Teacher 7
INSERT INTO users (email, password, role, name, school_id, created_at)
VALUES ('teacher.miller@school.com', '$2a$10$YourHashedPasswordHere', 'teacher', 'Robert Miller', 1, CURRENT_TIMESTAMP);

INSERT INTO teachers (user_id, employee_id, phone, school_id, created_at)
SELECT id, 'T007', '555-0107', 1, CURRENT_TIMESTAMP
FROM users WHERE email = 'teacher.miller@school.com';

-- Teacher 8
INSERT INTO users (email, password, role, name, school_id, created_at)
VALUES ('teacher.davis@school.com', '$2a$10$YourHashedPasswordHere', 'teacher', 'Jennifer Davis', 1, CURRENT_TIMESTAMP);

INSERT INTO teachers (user_id, employee_id, phone, school_id, created_at)
SELECT id, 'T008', '555-0108', 1, CURRENT_TIMESTAMP
FROM users WHERE email = 'teacher.davis@school.com';

-- Teacher 9
INSERT INTO users (email, password, role, name, school_id, created_at)
VALUES ('teacher.rodriguez@school.com', '$2a$10$YourHashedPasswordHere', 'teacher', 'Carlos Rodriguez', 1, CURRENT_TIMESTAMP);

INSERT INTO teachers (user_id, employee_id, phone, school_id, created_at)
SELECT id, 'T009', '555-0109', 1, CURRENT_TIMESTAMP
FROM users WHERE email = 'teacher.rodriguez@school.com';

-- Teacher 10
INSERT INTO users (email, password, role, name, school_id, created_at)
VALUES ('teacher.martinez@school.com', '$2a$10$YourHashedPasswordHere', 'teacher', 'Lisa Martinez', 1, CURRENT_TIMESTAMP);

INSERT INTO teachers (user_id, employee_id, phone, school_id, created_at)
SELECT id, 'T010', '555-0110', 1, CURRENT_TIMESTAMP
FROM users WHERE email = 'teacher.martinez@school.com';

-- ============================================
-- INSERT 10 STUDENTS
-- ============================================

-- Student 1
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES ('S2024001', 'James', 'Anderson', '2010-03-15', 1, 7, 'JAMES001', CURRENT_TIMESTAMP);

-- Student 2
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES ('S2024002', 'Emma', 'Taylor', '2010-05-22', 1, 7, 'EMMA002', CURRENT_TIMESTAMP);

-- Student 3
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES ('S2024003', 'Oliver', 'Thomas', '2010-07-08', 1, 7, 'OLIVER003', CURRENT_TIMESTAMP);

-- Student 4
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES ('S2024004', 'Sophia', 'Moore', '2010-09-12', 1, 7, 'SOPHIA004', CURRENT_TIMESTAMP);

-- Student 5
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES ('S2024005', 'William', 'Jackson', '2010-11-30', 1, 7, 'WILLIAM005', CURRENT_TIMESTAMP);

-- Student 6
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES ('S2024006', 'Ava', 'White', '2010-02-18', 1, 7, 'AVA006', CURRENT_TIMESTAMP);

-- Student 7
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES ('S2024007', 'Noah', 'Harris', '2010-04-25', 1, 7, 'NOAH007', CURRENT_TIMESTAMP);

-- Student 8
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES ('S2024008', 'Isabella', 'Martin', '2010-06-14', 1, 7, 'ISABELLA008', CURRENT_TIMESTAMP);

-- Student 9
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES ('S2024009', 'Liam', 'Thompson', '2010-08-09', 1, 7, 'LIAM009', CURRENT_TIMESTAMP);

-- Student 10
INSERT INTO students (student_id, first_name, last_name, date_of_birth, class_id, grade_level, parent_link_code, created_at)
VALUES ('S2024010', 'Mia', 'Garcia', '2010-10-21', 1, 7, 'MIA010', CURRENT_TIMESTAMP);

-- Verification queries
SELECT 'Teachers inserted:' as info, COUNT(*) as count FROM teachers WHERE school_id = 1;
SELECT 'Students inserted:' as info, COUNT(*) as count FROM students WHERE class_id = 1;
