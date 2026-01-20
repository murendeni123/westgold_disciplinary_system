/**
 * Database Schema Reset Script
 * Creates all tables in the correct dependency order
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const schema = `
-- Drop tables in reverse dependency order (if they exist)
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS platform_logs CASCADE;
DROP TABLE IF EXISTS school_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS goldie_badge_flags CASCADE;
DROP TABLE IF EXISTS student_consequences CASCADE;
DROP TABLE IF EXISTS consequences CASCADE;
DROP TABLE IF EXISTS intervention_sessions CASCADE;
DROP TABLE IF EXISTS intervention_types CASCADE;
DROP TABLE IF EXISTS interventions CASCADE;
DROP TABLE IF EXISTS merit_types CASCADE;
DROP TABLE IF EXISTS incident_types CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS timetables CASCADE;
DROP TABLE IF EXISTS detention_assignments CASCADE;
DROP TABLE IF EXISTS detentions CASCADE;
DROP TABLE IF EXISTS detention_rules CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS merits CASCADE;
DROP TABLE IF EXISTS behaviour_incidents CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS school_customizations CASCADE;
DROP TABLE IF EXISTS user_schools CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS platform_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- Create tables in correct dependency order

-- 1. Schools table (no dependencies)
CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    code TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users table (depends on schools)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'parent')),
    name TEXT NOT NULL,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Platform Users table (no dependencies)
CREATE TABLE platform_users (
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

-- 4. Platform Settings table (no dependencies)
CREATE TABLE platform_settings (
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

-- 5. User-Schools linking table
CREATE TABLE user_schools (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, school_id)
);

-- 6. School Customizations table
CREATE TABLE school_customizations (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
    logo_path TEXT,
    favicon_path TEXT,
    login_background_path TEXT,
    dashboard_background_path TEXT,
    primary_color TEXT DEFAULT '#3b82f6',
    secondary_color TEXT DEFAULT '#8b5cf6',
    success_color TEXT DEFAULT '#10b981',
    warning_color TEXT DEFAULT '#f59e0b',
    danger_color TEXT DEFAULT '#ef4444',
    background_color TEXT DEFAULT '#f9fafb',
    text_primary_color TEXT DEFAULT '#111827',
    text_secondary_color TEXT DEFAULT '#6b7280',
    primary_font TEXT DEFAULT 'Inter',
    secondary_font TEXT DEFAULT 'Inter',
    base_font_size TEXT DEFAULT '16px',
    button_border_radius TEXT DEFAULT '8px',
    card_border_radius TEXT DEFAULT '12px',
    sidebar_background TEXT DEFAULT '#ffffff',
    header_background TEXT DEFAULT '#ffffff',
    login_welcome_message TEXT,
    login_tagline TEXT,
    login_background_color TEXT DEFAULT '#ffffff',
    contact_email TEXT,
    contact_phone TEXT,
    support_email TEXT,
    terms_url TEXT,
    privacy_url TEXT,
    custom_css TEXT,
    custom_js TEXT,
    email_header_html TEXT,
    email_footer_html TEXT,
    email_signature TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Classes table
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    grade_level TEXT,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    academic_year TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    grade_level TEXT,
    parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    parent_link_code TEXT UNIQUE,
    photo_path TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, school_id)
);

-- 9. Teachers table
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id TEXT,
    phone TEXT,
    photo_path TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, school_id)
);

-- 10. Parents table
CREATE TABLE parents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Behaviour incidents table
CREATE TABLE behaviour_incidents (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incident_date DATE NOT NULL,
    incident_time TIME,
    incident_type TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'resolved')),
    admin_notes TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Merits table
CREATE TABLE merits (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merit_date DATE NOT NULL,
    merit_type TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    period TEXT,
    status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, attendance_date, period)
);

-- 14. Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Detention rules table
CREATE TABLE detention_rules (
    id SERIAL PRIMARY KEY,
    action_type TEXT NOT NULL CHECK(action_type IN ('verbal_warning', 'written_warning', 'detention', 'suspension', 'expulsion')),
    min_points INTEGER DEFAULT 0,
    max_points INTEGER,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
    detention_duration INTEGER DEFAULT 60,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Detentions table
CREATE TABLE detentions (
    id SERIAL PRIMARY KEY,
    detention_date DATE NOT NULL,
    detention_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    location TEXT,
    teacher_on_duty_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Detention assignments table
CREATE TABLE detention_assignments (
    id SERIAL PRIMARY KEY,
    detention_id INTEGER NOT NULL REFERENCES detentions(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    incident_id INTEGER REFERENCES behaviour_incidents(id) ON DELETE SET NULL,
    reason TEXT,
    status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned', 'attended', 'absent', 'late', 'excused')),
    attendance_time TIME,
    notes TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Timetables table
CREATE TABLE timetables (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
    period_number INTEGER NOT NULL,
    subject TEXT,
    start_time TIME,
    end_time TIME,
    room TEXT,
    is_break INTEGER DEFAULT 0,
    academic_year TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id INTEGER,
    related_type TEXT,
    is_read INTEGER DEFAULT 0,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. Incident Types table
CREATE TABLE incident_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    default_points INTEGER DEFAULT 0,
    default_severity TEXT CHECK(default_severity IN ('low', 'medium', 'high')) DEFAULT 'low',
    description TEXT,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, school_id)
);

-- 21. Merit Types table
CREATE TABLE merit_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    default_points INTEGER DEFAULT 1,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, school_id)
);

-- 22. Interventions table
CREATE TABLE interventions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT,
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. Intervention Types table
CREATE TABLE intervention_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    default_duration INTEGER,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, school_id)
);

-- 24. Intervention Sessions table
CREATE TABLE intervention_sessions (
    id SERIAL PRIMARY KEY,
    intervention_id INTEGER NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_time TIME,
    duration INTEGER,
    facilitator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    outcome TEXT,
    next_steps TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 25. Consequences table
CREATE TABLE consequences (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')) DEFAULT 'low',
    default_duration TEXT,
    is_active INTEGER DEFAULT 1,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, school_id)
);

-- 26. Student Consequences table
CREATE TABLE student_consequences (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    consequence_id INTEGER REFERENCES consequences(id) ON DELETE SET NULL,
    incident_id INTEGER REFERENCES behaviour_incidents(id) ON DELETE SET NULL,
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 27. Goldie Badge Flags table
CREATE TABLE goldie_badge_flags (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    flagged_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    merit_points INTEGER DEFAULT 0,
    demerit_points INTEGER DEFAULT 0,
    net_score INTEGER DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'flagged' CHECK(status IN ('flagged', 'awarded', 'removed')),
    awarded_at TIMESTAMP,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(student_id, school_id)
);

-- 28. Subscription Plans table
CREATE TABLE subscription_plans (
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

-- 29. School Subscriptions table
CREATE TABLE school_subscriptions (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 30. Platform Logs table
CREATE TABLE platform_logs (
    id SERIAL PRIMARY KEY,
    action_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    user_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 31. Push Subscriptions table
CREATE TABLE push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- Create indexes
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_parent ON students(parent_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_behaviour_student ON behaviour_incidents(student_id);
CREATE INDEX idx_behaviour_date ON behaviour_incidents(incident_date);
CREATE INDEX idx_behaviour_school ON behaviour_incidents(school_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_school ON attendance(school_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_school ON messages(school_id);
CREATE INDEX idx_merits_student ON merits(student_id);
CREATE INDEX idx_merits_date ON merits(merit_date);
CREATE INDEX idx_merits_school ON merits(school_id);
CREATE INDEX idx_detentions_date ON detentions(detention_date);
CREATE INDEX idx_detentions_school ON detentions(school_id);
CREATE INDEX idx_detention_assignments_student ON detention_assignments(student_id);
CREATE INDEX idx_timetables_class ON timetables(class_id);
CREATE INDEX idx_timetables_student ON timetables(student_id);
CREATE INDEX idx_timetables_teacher ON timetables(teacher_id);
CREATE INDEX idx_timetables_school ON timetables(school_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_school ON notifications(school_id);
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_teachers_school ON teachers(school_id);
CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_goldie_badge_student ON goldie_badge_flags(student_id);
CREATE INDEX idx_goldie_badge_school ON goldie_badge_flags(school_id);

-- Insert default platform settings
INSERT INTO platform_settings (id, platform_name, goldie_badge_enabled, goldie_badge_threshold)
VALUES (1, 'Positive Discipline System', 1, 10)
ON CONFLICT (id) DO NOTHING;
`;

async function resetSchema() {
    const client = await pool.connect();
    try {
        console.log('Resetting database schema...');
        await client.query(schema);
        console.log('Schema reset complete!');
        
        // Verify tables exist
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        console.log('Created tables:', result.rows.map(r => r.table_name).join(', '));
    } catch (err) {
        console.error('Error:', err.message);
        throw err;
    } finally {
        client.release();
        pool.end();
    }
}

resetSchema();
