-- Migration: Add Supabase Auth support
-- This migration adds columns to link Supabase Auth users with local users table

-- Add supabase_user_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_user_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);

-- Add auth_provider column to track how user signed up
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Add last_sign_in column
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sign_in TIMESTAMP;
