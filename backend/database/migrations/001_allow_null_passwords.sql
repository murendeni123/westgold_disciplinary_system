-- Allow NULL passwords for OAuth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add columns for Supabase integration if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_user_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sign_in TIMESTAMP;
