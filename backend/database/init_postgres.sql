-- PostgreSQL/Supabase Schema for PDS System

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'parent')),
    name TEXT NOT NULL,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schools table (for multi-tenancy)
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure schools table has a code column for alphanumeric school codes (e.g. WS2025)
ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- User-Schools linking table (for parents who can be linked to multiple schools)
CREATE TABLE IF NOT EXISTS user_schools (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    school_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(user_id, school_id)
);

-- School Customizations table
CREATE TABLE IF NOT EXISTS school_customizations (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL UNIQUE,
    
    -- Branding
    logo_path TEXT,
    favicon_path TEXT,
    login_background_path TEXT,
    dashboard_background_path TEXT,
    
    -- Colors
    primary_color TEXT DEFAULT '#3b82f6',
    secondary_color TEXT DEFAULT '#8b5cf6',
    success_color TEXT DEFAULT '#10b981',
    warning_color TEXT DEFAULT '#f59e0b',
    danger_color TEXT DEFAULT '#ef4444',
    background_color TEXT DEFAULT '#f9fafb',
    text_primary_color TEXT DEFAULT '#111827',
    text_secondary_color TEXT DEFAULT '#6b7280',
    
    -- Typography
    primary_font TEXT DEFAULT 'Inter',
    secondary_font TEXT DEFAULT 'Inter',
    base_font_size TEXT DEFAULT '16px',
    
    -- UI Components
    button_border_radius TEXT DEFAULT '8px',
    card_border_radius TEXT DEFAULT '12px',
    sidebar_background TEXT DEFAULT '#ffffff',
    header_background TEXT DEFAULT '#ffffff',
    
    -- Login Page
    login_welcome_message TEXT,
    login_tagline TEXT,
    login_background_color TEXT DEFAULT '#ffffff',
    
    -- Content
    contact_email TEXT,
    contact_phone TEXT,
    support_email TEXT,
    terms_url TEXT,
    privacy_url TEXT,
    
    -- Advanced
    custom_css TEXT,
    custom_js TEXT,
    
    -- Email Templates
    email_header_html TEXT,
    email_footer_html TEXT,
    email_signature TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    class_id INTEGER,
    grade_level TEXT,
    parent_id INTEGER,
    parent_link_code TEXT UNIQUE,
    photo_path TEXT,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(student_id, school_id)
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    grade_level TEXT,
    teacher_id INTEGER,
    academic_year TEXT,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Teachers table (extends users)
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    employee_id TEXT,
    phone TEXT,
    photo_path TEXT,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(employee_id, school_id)
);

-- Parents table (extends users)
CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    phone TEXT,
    work_phone TEXT,
    relationship_to_child TEXT,
    emergency_contact_1_name TEXT,
    emergency_contact_1_phone TEXT,
    emergency_contact_2_name TEXT,
    emergency_contact_2_phone TEXT,
    home_address TEXT,
    city TEXT,
    postal_code TEXT,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS work_phone TEXT;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS relationship_to_child TEXT;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS emergency_contact_1_name TEXT;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS emergency_contact_1_phone TEXT;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS emergency_contact_2_name TEXT;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS emergency_contact_2_phone TEXT;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS home_address TEXT;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS postal_code TEXT;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS school_id INTEGER;

ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Behaviour incidents table (demerits)
CREATE TABLE IF NOT EXISTS behaviour_incidents (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME,
    incident_type TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'resolved')),
    admin_notes TEXT,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Merits table
CREATE TABLE IF NOT EXISTS merits (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    merit_date DATE NOT NULL,
    merit_type TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    period TEXT,
    status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    teacher_id INTEGER NOT NULL,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(student_id, class_id, attendance_date, period)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Detention rules table
CREATE TABLE IF NOT EXISTS detention_rules (
    id SERIAL PRIMARY KEY,
    action_type TEXT NOT NULL CHECK(action_type IN ('verbal_warning', 'written_warning', 'detention', 'suspension', 'expulsion')),
    min_points INTEGER DEFAULT 0,
    max_points INTEGER,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
    detention_duration INTEGER DEFAULT 60,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Detention sessions table
CREATE TABLE IF NOT EXISTS detentions (
    id SERIAL PRIMARY KEY,
    detention_date DATE NOT NULL,
    detention_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    location TEXT,
    teacher_on_duty_id INTEGER,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_on_duty_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Detention assignments table
CREATE TABLE IF NOT EXISTS detention_assignments (
    id SERIAL PRIMARY KEY,
    detention_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    incident_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned', 'attended', 'absent', 'late', 'excused')),
    attendance_time TIME,
    notes TEXT,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (detention_id) REFERENCES detentions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (incident_id) REFERENCES behaviour_incidents(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Timetables table
CREATE TABLE IF NOT EXISTS timetables (
    id SERIAL PRIMARY KEY,
    class_id INTEGER,
    student_id INTEGER,
    teacher_id INTEGER,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
    period_number INTEGER NOT NULL,
    subject TEXT,
    start_time TIME,
    end_time TIME,
    room TEXT,
    is_break INTEGER DEFAULT 0,
    academic_year TEXT,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id INTEGER,
    related_type TEXT,
    is_read INTEGER DEFAULT 0,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Incident Types table
CREATE TABLE IF NOT EXISTS incident_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    default_points INTEGER DEFAULT 0,
    default_severity TEXT CHECK(default_severity IN ('low', 'medium', 'high')) DEFAULT 'low',
    description TEXT,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(name, school_id)
);

-- Merit Types table
CREATE TABLE IF NOT EXISTS merit_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    default_points INTEGER DEFAULT 1,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(name, school_id)
);

-- Interventions table
CREATE TABLE IF NOT EXISTS interventions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    assigned_by INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Intervention Types table
CREATE TABLE IF NOT EXISTS intervention_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    default_duration INTEGER,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(name, school_id)
);

-- Intervention Sessions table
CREATE TABLE IF NOT EXISTS intervention_sessions (
    id SERIAL PRIMARY KEY,
    intervention_id INTEGER NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME,
    duration INTEGER,
    facilitator_id INTEGER,
    notes TEXT,
    outcome TEXT,
    next_steps TEXT,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    FOREIGN KEY (facilitator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Consequences table (definitions)
CREATE TABLE IF NOT EXISTS consequences (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')) DEFAULT 'low',
    default_duration TEXT,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(name, school_id)
);

-- Student Consequences table (assignments)
CREATE TABLE IF NOT EXISTS student_consequences (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    consequence_id INTEGER,
    incident_id INTEGER,
    assigned_by INTEGER NOT NULL,
    assigned_date DATE NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    parent_acknowledged INTEGER DEFAULT 0,
    parent_acknowledged_at TIMESTAMP,
    parent_notes TEXT,
    completion_verified INTEGER DEFAULT 0,
    completion_verified_by INTEGER,
    completion_verified_at TIMESTAMP,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (consequence_id) REFERENCES consequences(id) ON DELETE SET NULL,
    FOREIGN KEY (incident_id) REFERENCES behaviour_incidents(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Platform Users table (for Super Admin)
CREATE TABLE IF NOT EXISTS platform_users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'platform_admin',
    is_active INTEGER DEFAULT 1,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform Settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    platform_name TEXT DEFAULT 'Positive Discipline System',
    support_email TEXT,
    max_schools INTEGER DEFAULT 1000,
    max_students_per_school INTEGER DEFAULT 10000,
    goldie_badge_enabled INTEGER DEFAULT 1,
    goldie_badge_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add goldie_badge columns if they don't exist
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS goldie_badge_enabled INTEGER DEFAULT 1;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS goldie_badge_threshold INTEGER DEFAULT 10;

-- Goldie Badge Flags table (tracks students flagged for recognition)
CREATE TABLE IF NOT EXISTS goldie_badge_flags (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    flagged_by INTEGER NOT NULL,
    flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    merit_points INTEGER DEFAULT 0,
    demerit_points INTEGER DEFAULT 0,
    net_score INTEGER DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'flagged' CHECK(status IN ('flagged', 'awarded', 'removed')),
    awarded_at TIMESTAMP,
    school_id INTEGER,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(student_id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_goldie_badge_student ON goldie_badge_flags(student_id);
CREATE INDEX IF NOT EXISTS idx_goldie_badge_school ON goldie_badge_flags(school_id);

-- Subscription Plans table
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

-- School Subscriptions table
CREATE TABLE IF NOT EXISTS school_subscriptions (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

-- Platform Logs table
CREATE TABLE IF NOT EXISTS platform_logs (
    id SERIAL PRIMARY KEY,
    action_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    user_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push Subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, endpoint)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_student ON behaviour_incidents(student_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_date ON behaviour_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_behaviour_school ON behaviour_incidents(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_school ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_school ON messages(school_id);
CREATE INDEX IF NOT EXISTS idx_merits_student ON merits(student_id);
CREATE INDEX IF NOT EXISTS idx_merits_date ON merits(merit_date);
CREATE INDEX IF NOT EXISTS idx_merits_school ON merits(school_id);
CREATE INDEX IF NOT EXISTS idx_detentions_date ON detentions(detention_date);
CREATE INDEX IF NOT EXISTS idx_detentions_school ON detentions(school_id);
CREATE INDEX IF NOT EXISTS idx_detention_assignments_student ON detention_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_timetables_class ON timetables(class_id);
CREATE INDEX IF NOT EXISTS idx_timetables_student ON timetables(student_id);
CREATE INDEX IF NOT EXISTS idx_timetables_teacher ON timetables(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetables_school ON timetables(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_school ON notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);

