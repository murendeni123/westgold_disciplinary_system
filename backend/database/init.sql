-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'parent')),
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    class_id INTEGER,
    grade_level TEXT,
    parent_id INTEGER,
    parent_link_code TEXT UNIQUE,
    photo_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (parent_id) REFERENCES users(id)
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT NOT NULL,
    grade_level TEXT,
    teacher_id INTEGER,
    academic_year TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Teachers table (extends users)
CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    employee_id TEXT UNIQUE,
    phone TEXT,
    photo_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Behaviour incidents table (demerits)
CREATE TABLE IF NOT EXISTS behaviour_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME,
    incident_type TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'resolved')),
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Merits table
CREATE TABLE IF NOT EXISTS merits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    merit_date DATE NOT NULL,
    merit_type TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    period TEXT,
    status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    teacher_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    UNIQUE(student_id, class_id, attendance_date, period)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- Detention rules table
CREATE TABLE IF NOT EXISTS detention_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL CHECK(action_type IN ('verbal_warning', 'written_warning', 'detention', 'suspension', 'expulsion')),
    min_points INTEGER DEFAULT 0,
    max_points INTEGER,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
    detention_duration INTEGER DEFAULT 60,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Detention sessions table
CREATE TABLE IF NOT EXISTS detentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detention_date DATE NOT NULL,
    detention_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    location TEXT,
    teacher_on_duty_id INTEGER,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_on_duty_id) REFERENCES users(id)
);

-- Detention assignments table
CREATE TABLE IF NOT EXISTS detention_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detention_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    incident_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned', 'attended', 'absent', 'late', 'excused')),
    attendance_time TIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (detention_id) REFERENCES detentions(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (incident_id) REFERENCES behaviour_incidents(id)
);

-- Timetables table
CREATE TABLE IF NOT EXISTS timetables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id INTEGER,
    related_type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_student ON behaviour_incidents(student_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_date ON behaviour_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_merits_student ON merits(student_id);
CREATE INDEX IF NOT EXISTS idx_merits_date ON merits(merit_date);
CREATE INDEX IF NOT EXISTS idx_detentions_date ON detentions(detention_date);
CREATE INDEX IF NOT EXISTS idx_detention_assignments_student ON detention_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_timetables_class ON timetables(class_id);
CREATE INDEX IF NOT EXISTS idx_timetables_student ON timetables(student_id);
CREATE INDEX IF NOT EXISTS idx_timetables_teacher ON timetables(teacher_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Incident Types table
CREATE TABLE IF NOT EXISTS incident_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    default_points INTEGER DEFAULT 0,
    default_severity TEXT CHECK(default_severity IN ('low', 'medium', 'high')) DEFAULT 'low',
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Merit Types table
CREATE TABLE IF NOT EXISTS merit_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    default_points INTEGER DEFAULT 1,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Schools table (for multi-tenancy)
CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- School Customizations table
CREATE TABLE IF NOT EXISTS school_customizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

