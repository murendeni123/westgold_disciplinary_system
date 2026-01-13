-- Migration: Migrate existing users from legacy users table to user_profiles
-- Run this AFTER creating users in Supabase Auth with matching emails
-- This script maps legacy integer IDs to Supabase UUIDs

-- Step 1: For each user in the legacy users table, you need to:
-- 1. Create the user in Supabase Auth (Dashboard > Authentication > Users > Add User)
-- 2. Copy the UUID from Supabase Auth
-- 3. Insert into user_profiles with that UUID

-- Example migration for a single user:
-- INSERT INTO user_profiles (id, email, role, full_name, school_id)
-- VALUES (
--     'paste-supabase-uuid-here',  -- UUID from Supabase Auth
--     'user@email.com',
--     'parent',  -- Map: 'admin' -> 'school_admin', 'teacher' -> 'teacher', 'parent' -> 'parent'
--     'User Name',
--     1  -- school_id
-- );

-- View existing legacy users to migrate:
-- SELECT id, email, role, name, school_id FROM users;

-- Role mapping reference:
-- Legacy 'admin'   -> New 'school_admin'
-- Legacy 'teacher' -> New 'teacher'  
-- Legacy 'parent'  -> New 'parent'

-- After migration, update foreign keys in domain tables:
-- UPDATE students SET parent_user_id = 'supabase-uuid' WHERE parent_id = legacy_integer_id;

-- Add parent_user_id column to students table for UUID reference
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_user_id UUID;

-- Add teacher_user_id column to teachers table for UUID reference  
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS teacher_user_id UUID;

-- Create index for the new UUID columns
CREATE INDEX IF NOT EXISTS idx_students_parent_user_id ON students(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_user_id ON teachers(teacher_user_id);
