-- ============================================================================
-- MULTI-TENANT POSITIVE DISCIPLINE SYSTEM - SCHEMA-PER-SCHOOL ARCHITECTURE
-- ============================================================================
-- This schema implements complete data isolation using PostgreSQL schemas.
-- Each school gets its own schema with all tables, ensuring zero data leakage.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PUBLIC SCHEMA: Shared Tables (Cross-School Data)
-- ============================================================================

-- Platform Users (Super Admins who manage the entire platform)
CREATE TABLE IF NOT EXISTS public.platform_users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'platform_admin' CHECK(role IN ('platform_admin', 'support')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schools Registry (Master list of all schools)
CREATE TABLE IF NOT EXISTS public.schools (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    subdomain TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'South Africa',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended', 'trial')),
    schema_name TEXT NOT NULL UNIQUE,
    max_students INTEGER DEFAULT 1000,
    max_teachers INTEGER DEFAULT 100,
    subscription_tier TEXT DEFAULT 'basic' CHECK(subscription_tier IN ('trial', 'basic', 'premium', 'enterprise')),
    trial_ends_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (All users across all schools - authentication layer)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'parent')),
    primary_school_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone TEXT,
    last_login TIMESTAMP,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_school_id) REFERENCES public.schools(id) ON DELETE SET NULL
);

-- User-School Linking (For parents with kids in multiple schools)
CREATE TABLE IF NOT EXISTS public.user_schools (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    school_id INTEGER NOT NULL,
    role_in_school TEXT CHECK(role_in_school IN ('admin', 'teacher', 'parent')),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE,
    UNIQUE(user_id, school_id)
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    currency TEXT DEFAULT 'ZAR',
    max_students INTEGER,
    max_teachers INTEGER,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- School Subscriptions
CREATE TABLE IF NOT EXISTS public.school_subscriptions (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'yearly')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled', 'suspended')),
    auto_renew BOOLEAN DEFAULT true,
    payment_reference TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
);

-- Platform Audit Logs
CREATE TABLE IF NOT EXISTS public.platform_logs (
    id SERIAL PRIMARY KEY,
    action_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    user_id INTEGER,
    platform_user_id INTEGER,
    school_id INTEGER,
    ip_address INET,
    user_agent TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL,
    FOREIGN KEY (platform_user_id) REFERENCES public.platform_users(id) ON DELETE SET NULL
);

-- Email Queue (For async email sending)
CREATE TABLE IF NOT EXISTS public.email_queue (
    id SERIAL PRIMARY KEY,
    to_email TEXT NOT NULL,
    to_name TEXT,
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    template_name TEXT,
    template_data JSONB,
    school_id INTEGER,
    priority INTEGER DEFAULT 5,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL
);

-- Push Notification Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_type TEXT,
    device_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    UNIQUE(user_id, endpoint)
);

-- Import History (Track bulk imports across all schools)
CREATE TABLE IF NOT EXISTS public.import_history (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    import_type TEXT NOT NULL CHECK(import_type IN ('students', 'teachers', 'classes', 'incidents', 'merits', 'attendance')),
    file_name TEXT,
    file_size INTEGER,
    total_rows INTEGER,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    skipped_rows INTEGER DEFAULT 0,
    status TEXT DEFAULT 'processing' CHECK(status IN ('processing', 'completed', 'failed', 'cancelled')),
    error_log JSONB,
    warnings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Session Management (For token invalidation)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    device_info TEXT,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for public schema
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_primary_school ON public.users(primary_school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_user_schools_user ON public.user_schools(user_id);
CREATE INDEX IF NOT EXISTS idx_user_schools_school ON public.user_schools(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_code ON public.schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_subdomain ON public.schools(subdomain);
CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_schema ON public.schools(schema_name);
CREATE INDEX IF NOT EXISTS idx_platform_logs_school ON public.platform_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_platform_logs_created ON public.platform_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_platform_logs_action ON public.platform_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_import_history_school ON public.import_history(school_id);
CREATE INDEX IF NOT EXISTS idx_import_history_status ON public.import_history(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON public.email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(token_hash);

-- ============================================================================
-- SEED DATA: Default Subscription Plans
-- ============================================================================

INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, max_students, max_teachers, features, is_active)
VALUES 
    ('Trial', '30-day free trial with limited features', 0.00, 0.00, 100, 10, 
     '{"support": "email", "customization": false, "analytics": "basic", "bulk_import": true, "api_access": false}', true),
    ('Basic', 'For small schools up to 500 students', 499.00, 4990.00, 500, 50, 
     '{"support": "email", "customization": true, "analytics": "standard", "bulk_import": true, "api_access": false}', true),
    ('Premium', 'For medium schools up to 1500 students', 999.00, 9990.00, 1500, 150, 
     '{"support": "priority", "customization": true, "analytics": "advanced", "bulk_import": true, "api_access": true}', true),
    ('Enterprise', 'For large schools with unlimited features', 1999.00, 19990.00, 5000, 500, 
     '{"support": "24/7", "customization": true, "analytics": "advanced", "bulk_import": true, "api_access": true, "dedicated_support": true}', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FUNCTIONS: Helper functions for schema management
-- ============================================================================

-- Function to get current school's schema from session
CREATE OR REPLACE FUNCTION public.get_current_schema() RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_schema', true);
END;
$$ LANGUAGE plpgsql;

-- Function to set current schema
CREATE OR REPLACE FUNCTION public.set_current_schema(schema_name TEXT) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_schema', schema_name, false);
    EXECUTE format('SET search_path TO %I, public', schema_name);
END;
$$ LANGUAGE plpgsql;

-- Function to check if a schema exists
CREATE OR REPLACE FUNCTION public.schema_exists(schema_name TEXT) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF PUBLIC SCHEMA
-- ============================================================================
