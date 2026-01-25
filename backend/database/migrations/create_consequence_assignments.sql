-- Create consequence_assignments table to track all consequence assignments
-- This table stores records of consequences assigned to students by teachers or admins

CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.consequence_assignments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    consequence_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    assigned_by_role VARCHAR(50) NOT NULL CHECK(assigned_by_role IN ('admin', 'teacher')),
    consequence_type VARCHAR(100) NOT NULL CHECK(consequence_type IN ('verbal_warning', 'written_warning', 'suspension', 'other')),
    description TEXT,
    reason TEXT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled', 'appealed')),
    start_date DATE,
    end_date DATE,
    auto_assigned BOOLEAN DEFAULT false,
    incident_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES {SCHEMA_NAME}.students(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL,
    FOREIGN KEY (incident_id) REFERENCES {SCHEMA_NAME}.behaviour_incidents(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_consequence_assignments_student ON {SCHEMA_NAME}.consequence_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_consequence_assignments_assigned_by ON {SCHEMA_NAME}.consequence_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_consequence_assignments_type ON {SCHEMA_NAME}.consequence_assignments(consequence_type);
CREATE INDEX IF NOT EXISTS idx_consequence_assignments_status ON {SCHEMA_NAME}.consequence_assignments(status);
CREATE INDEX IF NOT EXISTS idx_consequence_assignments_date ON {SCHEMA_NAME}.consequence_assignments(assigned_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION {SCHEMA_NAME}.update_consequence_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consequence_assignments_updated_at
    BEFORE UPDATE ON {SCHEMA_NAME}.consequence_assignments
    FOR EACH ROW
    EXECUTE FUNCTION {SCHEMA_NAME}.update_consequence_assignments_updated_at();

-- Add comments for documentation
COMMENT ON TABLE {SCHEMA_NAME}.consequence_assignments IS 'Tracks all consequences assigned to students by teachers or admins with role-based permissions';
COMMENT ON COLUMN {SCHEMA_NAME}.consequence_assignments.consequence_type IS 'Type of consequence: verbal_warning, written_warning, suspension, or other';
COMMENT ON COLUMN {SCHEMA_NAME}.consequence_assignments.assigned_by_role IS 'Role of the person who assigned the consequence (admin or teacher)';
COMMENT ON COLUMN {SCHEMA_NAME}.consequence_assignments.auto_assigned IS 'Whether the consequence was automatically assigned by the system based on criteria';
COMMENT ON COLUMN {SCHEMA_NAME}.consequence_assignments.status IS 'Current status of the consequence assignment';
