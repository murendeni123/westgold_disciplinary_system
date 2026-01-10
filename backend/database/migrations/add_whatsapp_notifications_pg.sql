-- WhatsApp Notifications Database Migration for PostgreSQL
-- Run this migration to add WhatsApp notification support

-- ============================================================================
-- 1. Add WhatsApp opt-in fields to users table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB;

-- ============================================================================
-- 2. Create notification_logs table for audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    
    -- Who received the notification
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    
    -- Notification details
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    type TEXT NOT NULL,
    template_name TEXT,
    recipient_phone TEXT,
    recipient_email TEXT,
    
    -- Message content
    payload_json JSONB,
    message_preview TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending',
    message_id TEXT,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP
);

-- ============================================================================
-- 3. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_student ON notification_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_school ON notification_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_message_id ON notification_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_opt_in ON users(whatsapp_opt_in);

-- ============================================================================
-- 4. Create WhatsApp templates reference table
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Template identification
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    
    -- Template content
    template_text TEXT,
    language_code TEXT DEFAULT 'en',
    
    -- Status
    status TEXT DEFAULT 'pending',
    
    -- Metadata
    parameter_count INTEGER DEFAULT 0,
    parameter_names JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    UNIQUE(school_id, template_name, language_code)
);

-- ============================================================================
-- 5. Insert default template references
-- ============================================================================

INSERT INTO whatsapp_templates (template_name, template_type, template_text, language_code, status, parameter_count, parameter_names)
SELECT 'student_absent', 'attendance_absent', 
       'Dear {{1}}, this is to inform you that your child {{2}} from class {{3}} was marked absent on {{4}} for {{5}}. Please contact the school if you have any questions.',
       'en', 'pending', 5, '["parent_name", "student_name", "class_name", "date", "period"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE template_name = 'student_absent');

INSERT INTO whatsapp_templates (template_name, template_type, template_text, language_code, status, parameter_count, parameter_names)
SELECT 'student_late', 'attendance_late',
       'Dear {{1}}, this is to inform you that your child {{2}} from class {{3}} arrived late on {{4}} at {{5}}.',
       'en', 'pending', 5, '["parent_name", "student_name", "class_name", "date", "arrival_time"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE template_name = 'student_late');

INSERT INTO whatsapp_templates (template_name, template_type, template_text, language_code, status, parameter_count, parameter_names)
SELECT 'incident_logged', 'behaviour_incident',
       'Dear {{1}}, we need to inform you about a behaviour incident involving your child {{2}}. Type: {{3}}. Details: {{4}}. Date: {{5}}. Please contact the school to discuss.',
       'en', 'pending', 5, '["parent_name", "student_name", "incident_type", "description", "date"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE template_name = 'incident_logged');

INSERT INTO whatsapp_templates (template_name, template_type, template_text, language_code, status, parameter_count, parameter_names)
SELECT 'merit_awarded', 'merit',
       'Dear {{1}}, great news! Your child {{2}} has been awarded a merit for {{3}} (+{{4}} points). {{5}}. Keep up the excellent work!',
       'en', 'pending', 5, '["parent_name", "student_name", "merit_type", "points", "description"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE template_name = 'merit_awarded');

INSERT INTO whatsapp_templates (template_name, template_type, template_text, language_code, status, parameter_count, parameter_names)
SELECT 'detention_scheduled', 'detention',
       'Dear {{1}}, your child {{2}} has been assigned detention on {{3}} at {{4}} for {{5}} at {{6}}. Reason: {{7}}. Please ensure they attend.',
       'en', 'pending', 7, '["parent_name", "student_name", "date", "time", "duration", "location", "reason"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE template_name = 'detention_scheduled');

-- ============================================================================
-- 6. Create table for incoming WhatsApp messages (parent replies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_incoming_messages (
    id SERIAL PRIMARY KEY,
    from_phone TEXT NOT NULL,
    message_type TEXT,
    message_text TEXT,
    whatsapp_message_id TEXT,
    
    -- Link to user if we can identify them
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    read_at TIMESTAMP,
    
    -- Response tracking
    responded BOOLEAN DEFAULT FALSE,
    response_message TEXT,
    responded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP,
    
    -- Timestamps
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_phone ON whatsapp_incoming_messages(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_unread ON whatsapp_incoming_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_received ON whatsapp_incoming_messages(received_at);

-- ============================================================================
-- Migration complete
-- ============================================================================
