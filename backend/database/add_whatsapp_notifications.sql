-- WhatsApp Notifications Database Schema
-- Run this migration to add WhatsApp notification support

-- ============================================================================
-- 1. Add WhatsApp opt-in fields to users table
-- ============================================================================

-- Add WhatsApp phone number (may be different from regular phone)
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add opt-in flag for WhatsApp notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_in INTEGER DEFAULT 0;

-- Add notification preferences (JSON for flexibility)
-- Example: {"attendance": true, "incidents": true, "merits": true, "detentions": true}
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences TEXT;

-- ============================================================================
-- 2. Create notification_logs table for audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Who received the notification
    user_id INTEGER,                    -- Parent/user who received it
    student_id INTEGER,                 -- Student the notification is about
    school_id INTEGER,                  -- School context
    
    -- Notification details
    channel TEXT NOT NULL DEFAULT 'whatsapp',  -- 'whatsapp', 'email', 'sms', 'push'
    type TEXT NOT NULL,                 -- 'attendance_absent', 'attendance_late', 'behaviour_incident', 'merit_awarded', 'detention_scheduled'
    template_name TEXT,                 -- WhatsApp template name used
    recipient_phone TEXT,               -- Phone number sent to
    recipient_email TEXT,               -- Email address (for email notifications)
    
    -- Message content
    payload_json TEXT,                  -- Full payload sent (for debugging)
    message_preview TEXT,               -- Human-readable preview of message
    
    -- Status tracking
    status TEXT DEFAULT 'pending',      -- 'pending', 'sent', 'delivered', 'read', 'failed', 'disabled'
    message_id TEXT,                    -- External message ID from WhatsApp
    error_message TEXT,                 -- Error details if failed
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    delivered_at DATETIME,
    read_at DATETIME,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
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

-- Index for users WhatsApp opt-in queries
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_opt_in ON users(whatsapp_opt_in);

-- ============================================================================
-- 4. Create WhatsApp templates reference table (for admin UI)
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER,                  -- NULL for system-wide templates
    
    -- Template identification
    template_name TEXT NOT NULL,        -- Name registered with WhatsApp
    template_type TEXT NOT NULL,        -- 'attendance_absent', 'incident', 'merit', 'detention', etc.
    
    -- Template content (for reference/preview)
    template_text TEXT,                 -- The actual template text with {{placeholders}}
    language_code TEXT DEFAULT 'en',    -- Language code
    
    -- Status
    status TEXT DEFAULT 'pending',      -- 'pending', 'approved', 'rejected'
    
    -- Metadata
    parameter_count INTEGER DEFAULT 0,  -- Number of parameters in template
    parameter_names TEXT,               -- JSON array of parameter names
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(school_id, template_name, language_code)
);

-- ============================================================================
-- 5. Insert default template references
-- ============================================================================

-- These are reference entries - actual templates must be created in WhatsApp Business Manager
INSERT INTO whatsapp_templates (template_name, template_type, template_text, language_code, status, parameter_count, parameter_names)
SELECT 'student_absent', 'attendance_absent', 
       'Dear {{1}}, this is to inform you that your child {{2}} from class {{3}} was marked absent on {{4}} for {{5}}. Please contact the school if you have any questions.',
       'en', 'pending', 5, '["parent_name", "student_name", "class_name", "date", "period"]'
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE template_name = 'student_absent');

INSERT INTO whatsapp_templates (template_name, template_type, template_text, language_code, status, parameter_count, parameter_names)
SELECT 'student_late', 'attendance_late',
       'Dear {{1}}, this is to inform you that your child {{2}} from class {{3}} arrived late on {{4}} at {{5}}.',
       'en', 'pending', 5, '["parent_name", "student_name", "class_name", "date", "arrival_time"]'
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE template_name = 'student_late');

INSERT INTO whatsapp_templates (template_name, template_type, template_text, language_code, status, parameter_count, parameter_names)
SELECT 'incident_logged', 'behaviour_incident',
       'Dear {{1}}, we need to inform you about a behaviour incident involving your child {{2}}. Type: {{3}}. Details: {{4}}. Date: {{5}}. Please contact the school to discuss.',
       'en', 'pending', 5, '["parent_name", "student_name", "incident_type", "description", "date"]'
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE template_name = 'incident_logged');

INSERT INTO whatsapp_templates (template_name, template_type, template_text, language_code, status, parameter_count, parameter_names)
SELECT 'merit_awarded', 'merit',
       'Dear {{1}}, great news! Your child {{2}} has been awarded a merit for {{3}} (+{{4}} points). {{5}}. Keep up the excellent work!',
       'en', 'pending', 5, '["parent_name", "student_name", "merit_type", "points", "description"]'
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE template_name = 'merit_awarded');

INSERT INTO whatsapp_templates (template_name, template_type, template_text, language_code, status, parameter_count, parameter_names)
SELECT 'detention_scheduled', 'detention',
       'Dear {{1}}, your child {{2}} has been assigned detention on {{3}} at {{4}} for {{5}} at {{6}}. Reason: {{7}}. Please ensure they attend.',
       'en', 'pending', 7, '["parent_name", "student_name", "date", "time", "duration", "location", "reason"]'
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE template_name = 'detention_scheduled');

-- ============================================================================
-- 6. Add school-level WhatsApp settings to school_customizations
-- ============================================================================

-- These may already exist, so we use ALTER TABLE ADD COLUMN IF NOT EXISTS
-- If your SQLite version doesn't support IF NOT EXISTS, run these manually

-- ALTER TABLE school_customizations ADD COLUMN IF NOT EXISTS whatsapp_enabled INTEGER DEFAULT 0;
-- ALTER TABLE school_customizations ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT;
-- ALTER TABLE school_customizations ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT;
-- ALTER TABLE school_customizations ADD COLUMN IF NOT EXISTS whatsapp_default_language TEXT DEFAULT 'en';

-- ============================================================================
-- PostgreSQL Version (for production with Supabase)
-- ============================================================================

-- ============================================================================
-- 7. Create table for incoming WhatsApp messages (parent replies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_incoming_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_phone TEXT NOT NULL,           -- Phone number that sent the message
    message_type TEXT,                  -- 'text', 'image', 'document', etc.
    message_text TEXT,                  -- Message content
    whatsapp_message_id TEXT,           -- WhatsApp's message ID
    
    -- Link to user if we can identify them
    user_id INTEGER,                    -- Matched parent user
    student_id INTEGER,                 -- Related student (if identifiable)
    
    -- Status
    is_read INTEGER DEFAULT 0,
    read_by INTEGER,                    -- Admin who read it
    read_at DATETIME,
    
    -- Response tracking
    responded INTEGER DEFAULT 0,
    response_message TEXT,
    responded_by INTEGER,
    responded_at DATETIME,
    
    -- Timestamps
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    FOREIGN KEY (read_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_phone ON whatsapp_incoming_messages(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_unread ON whatsapp_incoming_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_whatsapp_incoming_received ON whatsapp_incoming_messages(received_at);

/*
-- Run this instead if using PostgreSQL:

-- 1. Add columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB;

-- 2. Create notification_logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    type TEXT NOT NULL,
    template_name TEXT,
    recipient_phone TEXT,
    recipient_email TEXT,
    payload_json JSONB,
    message_preview TEXT,
    status TEXT DEFAULT 'pending',
    message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_student ON notification_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_school ON notification_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_message_id ON notification_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_opt_in ON users(whatsapp_opt_in);

-- 4. Create whatsapp_templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    template_text TEXT,
    language_code TEXT DEFAULT 'en',
    status TEXT DEFAULT 'pending',
    parameter_count INTEGER DEFAULT 0,
    parameter_names JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(school_id, template_name, language_code)
);

*/
