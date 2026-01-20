-- =====================================================
-- PER-PERIOD ATTENDANCE SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This migration creates tables for the per-period attendance system
-- Supports both fixed weekly and rotating cycle timetables
-- Multi-tenant aware (uses schema context)
-- =====================================================

-- 1. TIMETABLE TEMPLATES (School-wide schedule skeleton)
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    timetable_type VARCHAR(20) NOT NULL CHECK (timetable_type IN ('fixed_weekly', 'rotating_cycle')),
    cycle_length INTEGER DEFAULT 1, -- 1 for fixed weekly, 2+ for rotating (e.g., Week A/B)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_timetable_templates_active ON timetable_templates(is_active);
CREATE INDEX idx_timetable_templates_year ON timetable_templates(academic_year);

-- 2. TIME SLOTS (Period definitions with times)
-- =====================================================
CREATE TABLE IF NOT EXISTS time_slots (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES timetable_templates(id) ON DELETE CASCADE,
    period_number INTEGER NOT NULL,
    period_name VARCHAR(50) NOT NULL, -- e.g., "Period 1", "Tea Break", "Lunch"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_break BOOLEAN DEFAULT false, -- true for breaks (no attendance)
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1=Mon, 5=Fri
    cycle_day INTEGER DEFAULT 1, -- For rotating timetables (1=Week A, 2=Week B, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, day_of_week, cycle_day, period_number)
);

CREATE INDEX idx_time_slots_template ON time_slots(template_id);
CREATE INDEX idx_time_slots_day ON time_slots(day_of_week, cycle_day);
CREATE INDEX idx_time_slots_period ON time_slots(period_number);

-- 3. SUBJECTS (for timetable assignment)
-- =====================================================
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_active ON subjects(is_active);

-- 4. CLASSROOMS (for room assignment and clash detection)
-- =====================================================
CREATE TABLE IF NOT EXISTS classrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50),
    capacity INTEGER,
    building VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classrooms_active ON classrooms(is_active);

-- 5. CLASS TIMETABLES (Actual schedule per class)
-- =====================================================
CREATE TABLE IF NOT EXISTS class_timetables (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES timetable_templates(id) ON DELETE CASCADE,
    time_slot_id INTEGER NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    classroom_id INTEGER REFERENCES classrooms(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE(class_id, time_slot_id, effective_from)
);

CREATE INDEX idx_class_timetables_class ON class_timetables(class_id);
CREATE INDEX idx_class_timetables_teacher ON class_timetables(teacher_id);
CREATE INDEX idx_class_timetables_slot ON class_timetables(time_slot_id);
CREATE INDEX idx_class_timetables_active ON class_timetables(is_active);
CREATE INDEX idx_class_timetables_dates ON class_timetables(effective_from, effective_to);

-- 6. PERIOD SESSIONS (Daily instances of periods)
-- =====================================================
CREATE TABLE IF NOT EXISTS period_sessions (
    id SERIAL PRIMARY KEY,
    class_timetable_id INTEGER NOT NULL REFERENCES class_timetables(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    time_slot_id INTEGER NOT NULL REFERENCES time_slots(id),
    class_id INTEGER NOT NULL REFERENCES classes(id),
    teacher_id INTEGER REFERENCES teachers(id),
    subject_id INTEGER REFERENCES subjects(id),
    status VARCHAR(20) NOT NULL DEFAULT 'not_marked' CHECK (status IN ('not_marked', 'in_progress', 'completed', 'locked')),
    completed_at TIMESTAMP,
    completed_by INTEGER REFERENCES users(id),
    locked_at TIMESTAMP,
    locked_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, session_date, time_slot_id)
);

CREATE INDEX idx_period_sessions_date ON period_sessions(session_date);
CREATE INDEX idx_period_sessions_class ON period_sessions(class_id);
CREATE INDEX idx_period_sessions_teacher ON period_sessions(teacher_id);
CREATE INDEX idx_period_sessions_status ON period_sessions(status);
CREATE INDEX idx_period_sessions_class_date ON period_sessions(class_id, session_date);

-- 7. ATTENDANCE RECORDS (Individual student attendance per period)
-- =====================================================
CREATE TABLE IF NOT EXISTS period_attendance_records (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES period_sessions(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL, -- Links to students.student_id
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'dismissed', 'late_arrival')),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marked_by INTEGER REFERENCES users(id),
    notes TEXT,
    is_amended BOOLEAN DEFAULT false,
    amended_at TIMESTAMP,
    amended_by INTEGER REFERENCES users(id),
    amendment_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

CREATE INDEX idx_attendance_records_session ON period_attendance_records(session_id);
CREATE INDEX idx_attendance_records_student ON period_attendance_records(student_id);
CREATE INDEX idx_attendance_records_status ON period_attendance_records(status);
CREATE INDEX idx_attendance_records_marked_at ON period_attendance_records(marked_at);

-- 8. DISMISSALS (Student dismissals and returns)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_dismissals (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    dismissal_date DATE NOT NULL,
    dismissed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dismissed_by INTEGER NOT NULL REFERENCES users(id),
    dismissal_reason TEXT NOT NULL,
    dismissal_type VARCHAR(20) DEFAULT 'full_day' CHECK (dismissal_type IN ('full_day', 'partial_day')),
    returned_at TIMESTAMP,
    returned_by INTEGER REFERENCES users(id),
    return_notes TEXT,
    is_active BOOLEAN DEFAULT true, -- false if student returned
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dismissals_student ON student_dismissals(student_id);
CREATE INDEX idx_dismissals_date ON student_dismissals(dismissal_date);
CREATE INDEX idx_dismissals_active ON student_dismissals(is_active);
CREATE INDEX idx_dismissals_student_date ON student_dismissals(student_id, dismissal_date);

-- 9. LATE ARRIVALS (Student late arrivals to school)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_late_arrivals (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    arrival_date DATE NOT NULL,
    arrived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    recorded_by_role VARCHAR(20) NOT NULL CHECK (recorded_by_role IN ('admin', 'teacher')),
    reason TEXT,
    periods_affected TEXT, -- JSON array of period numbers marked as late_arrival
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_late_arrivals_student ON student_late_arrivals(student_id);
CREATE INDEX idx_late_arrivals_date ON student_late_arrivals(arrival_date);
CREATE INDEX idx_late_arrivals_student_date ON student_late_arrivals(student_id, arrival_date);

-- 10. ATTENDANCE FLAGS (Bunking detection and alerts)
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_flags (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    flag_date DATE NOT NULL,
    flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN (
        'present_to_absent',
        'absent_to_present',
        'multiple_late',
        'subject_pattern',
        'middle_period_absent',
        'group_bunking'
    )),
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    related_periods TEXT, -- JSON array of period IDs involved
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_flags_student ON attendance_flags(student_id);
CREATE INDEX idx_attendance_flags_date ON attendance_flags(flag_date);
CREATE INDEX idx_attendance_flags_type ON attendance_flags(flag_type);
CREATE INDEX idx_attendance_flags_resolved ON attendance_flags(is_resolved);
CREATE INDEX idx_attendance_flags_severity ON attendance_flags(severity);

-- 11. AUDIT LOG (Track all changes for compliance)
-- =====================================================
CREATE TABLE IF NOT EXISTS period_attendance_audit_log (
    id SERIAL PRIMARY KEY,
    record_id INTEGER,
    table_name VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT
);

CREATE INDEX idx_audit_log_table ON period_attendance_audit_log(table_name);
CREATE INDEX idx_audit_log_record ON period_attendance_audit_log(record_id);
CREATE INDEX idx_audit_log_changed_at ON period_attendance_audit_log(changed_at);
CREATE INDEX idx_audit_log_changed_by ON period_attendance_audit_log(changed_by);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check teacher clash (prevent double-booking)
CREATE OR REPLACE FUNCTION check_teacher_clash(
    p_teacher_id INTEGER,
    p_time_slot_id INTEGER,
    p_class_timetable_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    clash_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO clash_count
    FROM class_timetables ct
    WHERE ct.teacher_id = p_teacher_id
      AND ct.time_slot_id = p_time_slot_id
      AND ct.is_active = true
      AND ct.id != COALESCE(p_class_timetable_id, 0);
    
    RETURN clash_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to check room clash (prevent double-booking)
CREATE OR REPLACE FUNCTION check_room_clash(
    p_classroom_id INTEGER,
    p_time_slot_id INTEGER,
    p_class_timetable_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    clash_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO clash_count
    FROM class_timetables ct
    WHERE ct.classroom_id = p_classroom_id
      AND ct.time_slot_id = p_time_slot_id
      AND ct.is_active = true
      AND ct.id != COALESCE(p_class_timetable_id, 0);
    
    RETURN clash_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create period session
CREATE OR REPLACE FUNCTION get_or_create_period_session(
    p_class_timetable_id INTEGER,
    p_session_date DATE
) RETURNS INTEGER AS $$
DECLARE
    v_session_id INTEGER;
    v_class_id INTEGER;
    v_teacher_id INTEGER;
    v_subject_id INTEGER;
    v_time_slot_id INTEGER;
BEGIN
    -- Get timetable details
    SELECT class_id, teacher_id, subject_id, time_slot_id
    INTO v_class_id, v_teacher_id, v_subject_id, v_time_slot_id
    FROM class_timetables
    WHERE id = p_class_timetable_id;
    
    -- Try to get existing session
    SELECT id INTO v_session_id
    FROM period_sessions
    WHERE class_id = v_class_id
      AND session_date = p_session_date
      AND time_slot_id = v_time_slot_id;
    
    -- Create if doesn't exist
    IF v_session_id IS NULL THEN
        INSERT INTO period_sessions (
            class_timetable_id,
            session_date,
            time_slot_id,
            class_id,
            teacher_id,
            subject_id,
            status
        ) VALUES (
            p_class_timetable_id,
            p_session_date,
            v_time_slot_id,
            v_class_id,
            v_teacher_id,
            v_subject_id,
            'not_marked'
        ) RETURNING id INTO v_session_id;
    END IF;
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUDIT LOGGING
-- =====================================================

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_log_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO period_attendance_audit_log (
            record_id, table_name, action, old_values, changed_at
        ) VALUES (
            OLD.id, TG_TABLE_NAME, 'DELETE', row_to_json(OLD), CURRENT_TIMESTAMP
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO period_attendance_audit_log (
            record_id, table_name, action, old_values, new_values, changed_at
        ) VALUES (
            NEW.id, TG_TABLE_NAME, 'UPDATE', row_to_json(OLD), row_to_json(NEW), CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO period_attendance_audit_log (
            record_id, table_name, action, new_values, changed_at
        ) VALUES (
            NEW.id, TG_TABLE_NAME, 'INSERT', row_to_json(NEW), CURRENT_TIMESTAMP
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_period_attendance_records
    AFTER INSERT OR UPDATE OR DELETE ON period_attendance_records
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

CREATE TRIGGER audit_period_sessions
    AFTER INSERT OR UPDATE OR DELETE ON period_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

CREATE TRIGGER audit_student_dismissals
    AFTER INSERT OR UPDATE OR DELETE ON student_dismissals
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE timetable_templates IS 'School-wide timetable templates supporting fixed weekly or rotating cycle schedules';
COMMENT ON TABLE time_slots IS 'Period definitions with start/end times for each day of the week';
COMMENT ON TABLE class_timetables IS 'Actual timetable assignments per class with teacher, subject, and room';
COMMENT ON TABLE period_sessions IS 'Daily instances of periods where attendance is recorded';
COMMENT ON TABLE period_attendance_records IS 'Individual student attendance records per period';
COMMENT ON TABLE student_dismissals IS 'Records of student dismissals and returns during school day';
COMMENT ON TABLE student_late_arrivals IS 'Records of students arriving late to school';
COMMENT ON TABLE attendance_flags IS 'Automated flags for potential bunking or attendance issues';
COMMENT ON TABLE period_attendance_audit_log IS 'Complete audit trail of all attendance-related changes';
