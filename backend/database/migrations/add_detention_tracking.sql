-- Add columns to track detention point thresholds and automation
-- This allows the system to track when a student's points were last reset for detention purposes

-- Add last_detention_reset to students table to track when points counting started
ALTER TABLE {SCHEMA_NAME}.students 
ADD COLUMN IF NOT EXISTS last_detention_reset TIMESTAMP DEFAULT NULL;

-- Add detention_queue table to manage overflow students
CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.detention_queue (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    points_at_queue INTEGER NOT NULL,
    queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to_session_id INTEGER,
    status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'cancelled')),
    FOREIGN KEY (student_id) REFERENCES {SCHEMA_NAME}.students(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_session_id) REFERENCES {SCHEMA_NAME}.detention_sessions(id) ON DELETE SET NULL
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_detention_queue_status ON {SCHEMA_NAME}.detention_queue(status);
CREATE INDEX IF NOT EXISTS idx_detention_queue_student ON {SCHEMA_NAME}.detention_queue(student_id);

-- Add capacity field to detention_sessions if not exists
ALTER TABLE {SCHEMA_NAME}.detention_sessions 
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 30;

-- Add auto_assigned flag to detention_assignments
ALTER TABLE {SCHEMA_NAME}.detention_assignments 
ADD COLUMN IF NOT EXISTS auto_assigned BOOLEAN DEFAULT false;

-- Add points_at_assignment to track the points that triggered the detention
ALTER TABLE {SCHEMA_NAME}.detention_assignments 
ADD COLUMN IF NOT EXISTS points_at_assignment INTEGER DEFAULT 0;

COMMENT ON COLUMN {SCHEMA_NAME}.students.last_detention_reset IS 'Timestamp when student last completed a detention - used to calculate new points since then';
COMMENT ON COLUMN {SCHEMA_NAME}.detention_assignments.points_at_assignment IS 'Total demerit points at the time of assignment - prevents re-assignment for same points';
COMMENT ON TABLE {SCHEMA_NAME}.detention_queue IS 'Queue for students who qualify for detention but session is at capacity';
