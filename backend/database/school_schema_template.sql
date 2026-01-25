-- ============================================================================
-- SCHOOL SCHEMA TEMPLATE
-- ============================================================================
-- This template is used to create a new schema for each school.
-- Replace {SCHEMA_NAME} with actual schema name (e.g., school_ws2025)
-- This is executed programmatically when onboarding a new school.
-- ============================================================================

-- Create the schema
CREATE SCHEMA IF NOT EXISTS {SCHEMA_NAME};

-- ============================================================================
-- CLASSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.classes (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    grade_level TEXT,
    teacher_id INTEGER,
    academic_year TEXT NOT NULL,
    student_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STUDENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.students (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK(gender IN ('male', 'female', 'other')),
    class_id INTEGER,
    grade_level TEXT,
    parent_id INTEGER,
    secondary_parent_id INTEGER,
    parent_link_code TEXT UNIQUE,
    photo_path TEXT,
    medical_info TEXT,
    special_needs TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    withdrawal_date DATE,
    demerit_points INTEGER DEFAULT 0,
    merit_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES {SCHEMA_NAME}.classes(id) ON DELETE SET NULL
);

-- ============================================================================
-- TEACHERS (Extended info for users with teacher role)
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.teachers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    employee_id TEXT UNIQUE,
    department TEXT,
    subjects TEXT[],
    phone TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    photo_path TEXT,
    hire_date DATE,
    is_class_teacher BOOLEAN DEFAULT false,
    class_teacher_of INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_teacher_of) REFERENCES {SCHEMA_NAME}.classes(id) ON DELETE SET NULL
);

-- ============================================================================
-- PARENTS (Extended info for users with parent role)
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.parents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    phone TEXT,
    work_phone TEXT,
    relationship_to_child TEXT,
    occupation TEXT,
    employer TEXT,
    emergency_contact_1_name TEXT,
    emergency_contact_1_phone TEXT,
    emergency_contact_1_relationship TEXT,
    emergency_contact_2_name TEXT,
    emergency_contact_2_phone TEXT,
    emergency_contact_2_relationship TEXT,
    home_address TEXT,
    city TEXT,
    postal_code TEXT,
    preferred_contact_method TEXT DEFAULT 'email' CHECK(preferred_contact_method IN ('email', 'phone', 'sms', 'whatsapp')),
    receive_sms_notifications BOOLEAN DEFAULT true,
    receive_email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INCIDENT TYPES (School-specific customization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.incident_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    default_points INTEGER DEFAULT 0,
    default_severity TEXT CHECK(default_severity IN ('low', 'medium', 'high')) DEFAULT 'low',
    description TEXT,
    category TEXT,
    requires_parent_notification BOOLEAN DEFAULT false,
    requires_admin_approval BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MERIT TYPES (School-specific customization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.merit_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    default_points INTEGER DEFAULT 1,
    description TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BEHAVIOUR INCIDENTS (Demerits)
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.behaviour_incidents (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME,
    incident_type_id INTEGER,
    incident_type TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'resolved', 'appealed')),
    approved_by INTEGER,
    approved_at TIMESTAMP,
    admin_notes TEXT,
    location TEXT,
    witnesses TEXT,
    evidence_path TEXT,
    parent_notified BOOLEAN DEFAULT false,
    parent_notified_at TIMESTAMP,
    parent_notified_method TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    follow_up_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES {SCHEMA_NAME}.students(id) ON DELETE CASCADE,
    FOREIGN KEY (incident_type_id) REFERENCES {SCHEMA_NAME}.incident_types(id) ON DELETE SET NULL
);

-- ============================================================================
-- MERITS (Positive Behaviour)
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.merits (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    merit_date DATE NOT NULL,
    merit_type_id INTEGER,
    merit_type TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT true,
    parent_notified BOOLEAN DEFAULT false,
    parent_notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES {SCHEMA_NAME}.students(id) ON DELETE CASCADE,
    FOREIGN KEY (merit_type_id) REFERENCES {SCHEMA_NAME}.merit_types(id) ON DELETE SET NULL
);

-- ============================================================================
-- ATTENDANCE
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    period TEXT DEFAULT 'full_day',
    status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late', 'excused', 'early_departure')),
    late_minutes INTEGER,
    notes TEXT,
    excuse_reason TEXT,
    excuse_verified BOOLEAN DEFAULT false,
    teacher_id INTEGER NOT NULL,
    parent_notified BOOLEAN DEFAULT false,
    parent_notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES {SCHEMA_NAME}.students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES {SCHEMA_NAME}.classes(id) ON DELETE CASCADE,
    UNIQUE(student_id, class_id, attendance_date, period)
);

-- ============================================================================
-- DETENTION RULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.detention_rules (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK(action_type IN ('verbal_warning', 'written_warning', 'detention', 'suspension', 'expulsion', 'parent_meeting')),
    min_points INTEGER DEFAULT 0,
    max_points INTEGER,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
    detention_duration INTEGER DEFAULT 60,
    description TEXT,
    auto_assign BOOLEAN DEFAULT false,
    notify_parent BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DETENTION SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.detentions (
    id SERIAL PRIMARY KEY,
    detention_date DATE NOT NULL,
    detention_time TIME NOT NULL,
    end_time TIME,
    duration INTEGER DEFAULT 60,
    location TEXT,
    teacher_on_duty_id INTEGER,
    max_capacity INTEGER,
    current_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DETENTION ASSIGNMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.detention_assignments (
    id SERIAL PRIMARY KEY,
    detention_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    incident_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned', 'attended', 'absent', 'late', 'excused', 'rescheduled')),
    attendance_time TIME,
    departure_time TIME,
    behavior_during TEXT,
    notes TEXT,
    parent_notified BOOLEAN DEFAULT false,
    parent_notified_at TIMESTAMP,
    assigned_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (detention_id) REFERENCES {SCHEMA_NAME}.detentions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES {SCHEMA_NAME}.students(id) ON DELETE CASCADE,
    FOREIGN KEY (incident_id) REFERENCES {SCHEMA_NAME}.behaviour_incidents(id) ON DELETE SET NULL
);

-- ============================================================================
-- MESSAGES (Internal school messaging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER,
    receiver_type TEXT CHECK(receiver_type IN ('user', 'class', 'grade', 'all_parents', 'all_teachers')),
    receiver_group_id INTEGER,
    subject TEXT,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'general' CHECK(message_type IN ('general', 'incident', 'merit', 'attendance', 'detention', 'urgent')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,
    attachment_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id INTEGER,
    related_type TEXT,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_dismissed BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INTERVENTION TYPES
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.intervention_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    default_duration_days INTEGER,
    requires_parent_consent BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INTERVENTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.interventions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    intervention_type_id INTEGER,
    type TEXT NOT NULL,
    description TEXT,
    goals TEXT,
    assigned_by INTEGER NOT NULL,
    facilitator_id INTEGER,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK(status IN ('pending', 'active', 'completed', 'cancelled', 'on_hold')),
    outcome TEXT,
    notes TEXT,
    parent_consent_required BOOLEAN DEFAULT false,
    parent_consent_given BOOLEAN DEFAULT false,
    parent_consent_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES {SCHEMA_NAME}.students(id) ON DELETE CASCADE,
    FOREIGN KEY (intervention_type_id) REFERENCES {SCHEMA_NAME}.intervention_types(id) ON DELETE SET NULL
);

-- ============================================================================
-- INTERVENTION SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.intervention_sessions (
    id SERIAL PRIMARY KEY,
    intervention_id INTEGER NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME,
    duration INTEGER,
    facilitator_id INTEGER,
    attendance_status TEXT CHECK(attendance_status IN ('attended', 'absent', 'cancelled', 'rescheduled')),
    notes TEXT,
    progress_rating INTEGER CHECK(progress_rating BETWEEN 1 AND 5),
    outcome TEXT,
    next_steps TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (intervention_id) REFERENCES {SCHEMA_NAME}.interventions(id) ON DELETE CASCADE
);

-- ============================================================================
-- CONSEQUENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.consequences (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    description TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')) DEFAULT 'low',
    default_duration TEXT,
    requires_parent_acknowledgment BOOLEAN DEFAULT false,
    requires_completion_verification BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STUDENT CONSEQUENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.student_consequences (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    consequence_id INTEGER,
    incident_id INTEGER,
    consequence_name TEXT NOT NULL,
    assigned_by INTEGER NOT NULL,
    assigned_date DATE NOT NULL,
    due_date DATE,
    completed_date DATE,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    notes TEXT,
    student_reflection TEXT,
    parent_acknowledged BOOLEAN DEFAULT false,
    parent_acknowledged_at TIMESTAMP,
    parent_notes TEXT,
    completion_verified BOOLEAN DEFAULT false,
    completion_verified_by INTEGER,
    completion_verified_at TIMESTAMP,
    verification_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES {SCHEMA_NAME}.students(id) ON DELETE CASCADE,
    FOREIGN KEY (consequence_id) REFERENCES {SCHEMA_NAME}.consequences(id) ON DELETE SET NULL,
    FOREIGN KEY (incident_id) REFERENCES {SCHEMA_NAME}.behaviour_incidents(id) ON DELETE SET NULL
);

-- ============================================================================
-- TIMETABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.timetables (
    id SERIAL PRIMARY KEY,
    class_id INTEGER,
    teacher_id INTEGER,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
    period_number INTEGER NOT NULL,
    subject TEXT,
    start_time TIME,
    end_time TIME,
    room TEXT,
    is_break BOOLEAN DEFAULT false,
    break_name TEXT,
    academic_year TEXT,
    term TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES {SCHEMA_NAME}.classes(id) ON DELETE CASCADE
);

-- ============================================================================
-- ACADEMIC YEARS
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.academic_years (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TERMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.terms (
    id SERIAL PRIMARY KEY,
    academic_year_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    term_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (academic_year_id) REFERENCES {SCHEMA_NAME}.academic_years(id) ON DELETE CASCADE
);

-- ============================================================================
-- SCHOOL CUSTOMIZATIONS (Branding, colors, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.customizations (
    id SERIAL PRIMARY KEY,
    logo_path TEXT,
    favicon_path TEXT,
    login_background_path TEXT,
    primary_color TEXT DEFAULT '#3b82f6',
    secondary_color TEXT DEFAULT '#8b5cf6',
    accent_color TEXT DEFAULT '#f59e0b',
    success_color TEXT DEFAULT '#10b981',
    warning_color TEXT DEFAULT '#f59e0b',
    danger_color TEXT DEFAULT '#ef4444',
    login_welcome_message TEXT,
    login_tagline TEXT,
    dashboard_welcome_message TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,
    address TEXT,
    motto TEXT,
    custom_css TEXT,
    email_signature TEXT,
    sms_sender_name TEXT,
    timezone TEXT DEFAULT 'Africa/Johannesburg',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_format TEXT DEFAULT 'HH:mm',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SCHOOL SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'string' CHECK(setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AUDIT LOG (School-level activity tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR SCHOOL SCHEMA
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_students_class ON {SCHEMA_NAME}.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_parent ON {SCHEMA_NAME}.students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON {SCHEMA_NAME}.students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON {SCHEMA_NAME}.students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_grade ON {SCHEMA_NAME}.students(grade_level);

CREATE INDEX IF NOT EXISTS idx_teachers_user ON {SCHEMA_NAME}.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_employee ON {SCHEMA_NAME}.teachers(employee_id);

CREATE INDEX IF NOT EXISTS idx_parents_user ON {SCHEMA_NAME}.parents(user_id);

CREATE INDEX IF NOT EXISTS idx_behaviour_student ON {SCHEMA_NAME}.behaviour_incidents(student_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_teacher ON {SCHEMA_NAME}.behaviour_incidents(teacher_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_date ON {SCHEMA_NAME}.behaviour_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_behaviour_status ON {SCHEMA_NAME}.behaviour_incidents(status);
CREATE INDEX IF NOT EXISTS idx_behaviour_type ON {SCHEMA_NAME}.behaviour_incidents(incident_type);

CREATE INDEX IF NOT EXISTS idx_merits_student ON {SCHEMA_NAME}.merits(student_id);
CREATE INDEX IF NOT EXISTS idx_merits_teacher ON {SCHEMA_NAME}.merits(teacher_id);
CREATE INDEX IF NOT EXISTS idx_merits_date ON {SCHEMA_NAME}.merits(merit_date);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON {SCHEMA_NAME}.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON {SCHEMA_NAME}.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON {SCHEMA_NAME}.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON {SCHEMA_NAME}.attendance(status);

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON {SCHEMA_NAME}.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON {SCHEMA_NAME}.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON {SCHEMA_NAME}.messages(is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON {SCHEMA_NAME}.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON {SCHEMA_NAME}.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON {SCHEMA_NAME}.notifications(type);

CREATE INDEX IF NOT EXISTS idx_detentions_date ON {SCHEMA_NAME}.detentions(detention_date);
CREATE INDEX IF NOT EXISTS idx_detentions_status ON {SCHEMA_NAME}.detentions(status);

CREATE INDEX IF NOT EXISTS idx_detention_assignments_student ON {SCHEMA_NAME}.detention_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_detention_assignments_detention ON {SCHEMA_NAME}.detention_assignments(detention_id);

CREATE INDEX IF NOT EXISTS idx_interventions_student ON {SCHEMA_NAME}.interventions(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON {SCHEMA_NAME}.interventions(status);

CREATE INDEX IF NOT EXISTS idx_consequences_student ON {SCHEMA_NAME}.student_consequences(student_id);
CREATE INDEX IF NOT EXISTS idx_consequences_status ON {SCHEMA_NAME}.student_consequences(status);

CREATE INDEX IF NOT EXISTS idx_timetables_class ON {SCHEMA_NAME}.timetables(class_id);
CREATE INDEX IF NOT EXISTS idx_timetables_teacher ON {SCHEMA_NAME}.timetables(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetables_day ON {SCHEMA_NAME}.timetables(day_of_week);

CREATE INDEX IF NOT EXISTS idx_audit_user ON {SCHEMA_NAME}.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON {SCHEMA_NAME}.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON {SCHEMA_NAME}.audit_log(created_at);

-- ============================================================================
-- SEED DEFAULT DATA FOR NEW SCHOOL
-- ============================================================================

-- Default Incident Types
INSERT INTO {SCHEMA_NAME}.incident_types (name, code, default_points, default_severity, description, category, requires_admin_approval, display_order) VALUES
    ('Late to Class', 'LATE', 1, 'low', 'Student arrived late to class', 'Punctuality', false, 1),
    ('Incomplete Homework', 'HW', 2, 'low', 'Student did not complete assigned homework', 'Academic', false, 2),
    ('Disruptive Behavior', 'DISRUPT', 3, 'medium', 'Student disrupted class activities', 'Behavior', true, 3),
    ('Dress Code Violation', 'DRESS', 2, 'low', 'Student violated school dress code', 'Uniform', false, 4),
    ('Disrespect to Staff', 'DISRESP', 5, 'medium', 'Student showed disrespect to staff member', 'Behavior', true, 5),
    ('Bullying', 'BULLY', 10, 'high', 'Student engaged in bullying behavior', 'Behavior', true, 6),
    ('Fighting', 'FIGHT', 15, 'high', 'Student involved in physical altercation', 'Behavior', true, 7),
    ('Cheating', 'CHEAT', 10, 'high', 'Student caught cheating on test or assignment', 'Academic', true, 8),
    ('Vandalism', 'VANDAL', 10, 'high', 'Student damaged school property', 'Property', true, 9),
    ('Truancy', 'TRUANT', 5, 'medium', 'Student absent without permission', 'Attendance', true, 10)
ON CONFLICT (name) DO NOTHING;

-- Default Merit Types
INSERT INTO {SCHEMA_NAME}.merit_types (name, code, default_points, description, category, display_order) VALUES
    ('Academic Excellence', 'ACAD', 5, 'Outstanding academic performance', 'Academic', 1),
    ('Helpful Behavior', 'HELP', 2, 'Student helped others or staff', 'Behavior', 2),
    ('Leadership', 'LEAD', 3, 'Student demonstrated leadership qualities', 'Character', 3),
    ('Improvement', 'IMPROVE', 3, 'Student showed significant improvement', 'Progress', 4),
    ('Punctuality', 'PUNCT', 1, 'Consistent punctuality', 'Attendance', 5),
    ('Community Service', 'SERVICE', 4, 'Participation in community service', 'Service', 6),
    ('Sports Achievement', 'SPORT', 3, 'Achievement in sports activities', 'Extra-curricular', 7),
    ('Arts Achievement', 'ARTS', 3, 'Achievement in arts activities', 'Extra-curricular', 8),
    ('Perfect Attendance', 'ATTEND', 5, 'Perfect attendance for the term', 'Attendance', 9),
    ('Good Citizenship', 'CITIZEN', 2, 'Demonstrated good citizenship', 'Character', 10)
ON CONFLICT (name) DO NOTHING;

-- Default Consequences
INSERT INTO {SCHEMA_NAME}.consequences (name, code, description, severity, requires_parent_acknowledgment, display_order) VALUES
    ('Verbal Warning', 'VERBAL', 'Verbal warning from teacher', 'low', false, 1),
    ('Written Warning', 'WRITTEN', 'Written warning documented', 'low', true, 2),
    ('Break Detention', 'BREAK_DET', 'Detention during break time', 'medium', true, 3),
    ('After School Detention', 'AFTER_DET', 'Detention after school hours', 'medium', true, 4),
    ('Saturday Detention', 'SAT_DET', 'Detention on Saturday', 'medium', true, 5),
    ('Parent Meeting', 'PARENT_MTG', 'Meeting with parents required', 'medium', true, 6),
    ('In-School Suspension', 'ISS', 'Suspension served at school', 'high', true, 7),
    ('Out-of-School Suspension', 'OSS', 'Suspension served at home', 'high', true, 8),
    ('Community Service', 'COMM_SERV', 'Community service hours required', 'medium', true, 9),
    ('Behavioral Contract', 'CONTRACT', 'Student placed on behavioral contract', 'high', true, 10)
ON CONFLICT (name) DO NOTHING;

-- Default Intervention Types
INSERT INTO {SCHEMA_NAME}.intervention_types (name, description, default_duration_days, requires_parent_consent) VALUES
    ('Counseling', 'One-on-one counseling sessions', 30, true),
    ('Peer Mentoring', 'Paired with a peer mentor', 60, false),
    ('Academic Support', 'Additional academic assistance', 30, false),
    ('Behavior Monitoring', 'Daily behavior check-ins', 14, true),
    ('Anger Management', 'Anger management program', 30, true),
    ('Social Skills Group', 'Group sessions for social skills', 45, true),
    ('Parent Partnership', 'Enhanced parent communication', 30, true),
    ('Study Skills', 'Study skills development program', 21, false)
ON CONFLICT (name) DO NOTHING;

-- Default Detention Rules
INSERT INTO {SCHEMA_NAME}.detention_rules (name, action_type, min_points, max_points, severity, detention_duration, auto_assign, notify_parent) VALUES
    ('First Warning', 'verbal_warning', 0, 5, 'low', 0, false, false),
    ('Written Warning', 'written_warning', 6, 10, 'low', 0, false, true),
    ('Break Detention', 'detention', 11, 20, 'medium', 30, true, true),
    ('After School Detention', 'detention', 21, 35, 'medium', 60, true, true),
    ('Parent Meeting Required', 'parent_meeting', 36, 50, 'high', 0, false, true),
    ('Suspension Consideration', 'suspension', 51, 999, 'high', 0, false, true);

-- Default School Settings
INSERT INTO {SCHEMA_NAME}.settings (setting_key, setting_value, setting_type, description, is_public) VALUES
    ('school_start_time', '07:30', 'string', 'School day start time', true),
    ('school_end_time', '14:30', 'string', 'School day end time', true),
    ('late_threshold_minutes', '10', 'number', 'Minutes after which student is marked late', false),
    ('demerit_threshold_warning', '20', 'number', 'Demerit points for warning notification', false),
    ('demerit_threshold_critical', '50', 'number', 'Demerit points for critical alert', false),
    ('auto_notify_parents_incidents', 'true', 'boolean', 'Automatically notify parents of incidents', false),
    ('auto_notify_parents_merits', 'true', 'boolean', 'Automatically notify parents of merits', false),
    ('require_incident_approval', 'true', 'boolean', 'Require admin approval for incidents', false),
    ('allow_teacher_detention_assign', 'true', 'boolean', 'Allow teachers to assign detentions', false),
    ('academic_year', '2025', 'string', 'Current academic year', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Default Customizations
INSERT INTO {SCHEMA_NAME}.customizations (
    primary_color, secondary_color, accent_color,
    login_welcome_message, login_tagline,
    timezone, date_format, time_format
) VALUES (
    '#3b82f6', '#8b5cf6', '#f59e0b',
    'Welcome to our Positive Discipline System',
    'Building character, one student at a time',
    'Africa/Johannesburg', 'DD/MM/YYYY', 'HH:mm'
);

-- ============================================================================
-- END OF SCHOOL SCHEMA TEMPLATE
-- ============================================================================
