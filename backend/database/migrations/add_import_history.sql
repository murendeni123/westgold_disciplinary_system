-- Import History Table for tracking all bulk imports
CREATE TABLE IF NOT EXISTS import_history (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    import_type VARCHAR(50) NOT NULL, -- 'students', 'teachers', 'classes'
    file_name VARCHAR(255),
    mode VARCHAR(20) NOT NULL DEFAULT 'upsert', -- 'create', 'update', 'upsert'
    academic_year VARCHAR(20),
    total_rows INTEGER DEFAULT 0,
    created_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    classes_created INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_import_history_school ON import_history(school_id);
CREATE INDEX IF NOT EXISTS idx_import_history_user ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_created ON import_history(created_at DESC);
