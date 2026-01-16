-- Migration: Add Platform Admin Features
-- Date: 2026-01-14
-- Description: Adds missing columns and tables for school onboarding, analytics, and branding

-- Add school_code column to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS school_code TEXT UNIQUE;

-- Add additional school fields for onboarding
ALTER TABLE schools
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Add last_login column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Create activity_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    school_id INTEGER,
    user_id INTEGER,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_school_id ON activity_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Create school_branding table
CREATE TABLE IF NOT EXISTS school_branding (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL UNIQUE,
    primary_color TEXT DEFAULT '#3B82F6',
    secondary_color TEXT DEFAULT '#8B5CF6',
    logo_url TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Create school_branding_history table for versioning
CREATE TABLE IF NOT EXISTS school_branding_history (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    primary_color TEXT,
    secondary_color TEXT,
    logo_url TEXT,
    updated_at TIMESTAMP,
    updated_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Create index for branding history
CREATE INDEX IF NOT EXISTS idx_branding_history_school_id ON school_branding_history(school_id);

-- Create subscription_plans table if not exists
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    max_students INTEGER,
    max_teachers INTEGER,
    features JSONB,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create school_subscriptions table if not exists
CREATE TABLE IF NOT EXISTS school_subscriptions (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'trial', 'expired', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

-- Create platform_users table for platform admins
CREATE TABLE IF NOT EXISTS platform_users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Update schools status to include 'trial'
ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_status_check;
ALTER TABLE schools ADD CONSTRAINT schools_status_check 
    CHECK(status IN ('active', 'inactive', 'suspended', 'trial'));

-- Insert a default subscription plan if none exist
INSERT INTO subscription_plans (name, description, price, max_students, max_teachers, features, is_active)
SELECT 'Basic Plan', 'Basic subscription for small schools', 99.99, 500, 50, '["Basic Support", "Core Features"]'::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans LIMIT 1);

-- Add comment for documentation
COMMENT ON TABLE activity_logs IS 'Tracks all user actions for analytics and audit purposes';
COMMENT ON TABLE school_branding IS 'Stores current branding configuration for each school';
COMMENT ON TABLE school_branding_history IS 'Version history of branding changes';
