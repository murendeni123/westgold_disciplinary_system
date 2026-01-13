-- Migration: Create user_profiles table for Supabase Auth integration
-- This table stores user profile/authorization data linked to Supabase Auth users
-- Run this in your Supabase SQL Editor

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,  -- Links to auth.users.id
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('super_admin', 'school_admin', 'teacher', 'parent')),
    full_name TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    phone TEXT,
    whatsapp_number TEXT,
    whatsapp_opt_in BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{"attendance": true, "incidents": true, "merits": true, "detentions": true, "email": true, "push": true}'::jsonb,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_school_id ON user_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, for direct Supabase client access)
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own profile
-- CREATE POLICY "Users can read own profile"
--     ON user_profiles FOR SELECT
--     USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile
-- CREATE POLICY "Users can update own profile"
--     ON user_profiles FOR UPDATE
--     USING (auth.uid() = id);

COMMENT ON TABLE user_profiles IS 'User profiles linked to Supabase Auth users. Contains authorization (role) and business data.';
COMMENT ON COLUMN user_profiles.id IS 'UUID from auth.users.id - primary identity';
COMMENT ON COLUMN user_profiles.role IS 'Authorization role: super_admin, school_admin, teacher, parent';
COMMENT ON COLUMN user_profiles.school_id IS 'Primary school association for multi-tenancy';
