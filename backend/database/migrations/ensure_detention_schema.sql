-- =============================================================================
-- Migration: ensure_detention_schema.sql
-- Idempotent — safe to run multiple times on any school schema.
-- Aligns existing schemas created from the old template with the current
-- application requirements. Run this manually against each school schema.
--
-- Usage (replace {SCHEMA} with the school schema name, e.g. school_default):
--   SET search_path TO {SCHEMA};
--   \i ensure_detention_schema.sql
-- =============================================================================

-- 1. Create detention_sessions if it was never created (old template used 'detentions')
CREATE TABLE IF NOT EXISTS detention_sessions (
    id                 SERIAL PRIMARY KEY,
    detention_date     DATE NOT NULL,
    detention_time     TIME NOT NULL,
    end_time           TIME,
    duration           INTEGER DEFAULT 60,
    location           TEXT,
    teacher_on_duty_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    max_capacity       INTEGER DEFAULT 30,
    current_count      INTEGER DEFAULT 0,
    status             TEXT DEFAULT 'scheduled'
                           CHECK(status IN ('scheduled','in_progress','completed','cancelled')),
    is_frozen          BOOLEAN DEFAULT false,
    completed_at       TIMESTAMPTZ,
    notes              TEXT,
    created_by         INTEGER,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add is_frozen column if missing (older migrations may not have it)
DO $$ BEGIN
    ALTER TABLE detention_sessions ADD COLUMN is_frozen BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Add completed_at column if missing
DO $$ BEGIN
    ALTER TABLE detention_sessions ADD COLUMN completed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Create detention_assignments if missing
CREATE TABLE IF NOT EXISTS detention_assignments (
    id                  SERIAL PRIMARY KEY,
    detention_id        INTEGER NOT NULL REFERENCES detention_sessions(id) ON DELETE CASCADE,
    student_id          INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    incident_id         INTEGER REFERENCES behaviour_incidents(id) ON DELETE SET NULL,
    reason              TEXT,
    status              TEXT DEFAULT 'assigned',
    attendance_time     TIME,
    departure_time      TIME,
    behavior_during     TEXT,
    notes               TEXT,
    parent_notified     BOOLEAN DEFAULT false,
    parent_notified_at  TIMESTAMP,
    assigned_by         INTEGER,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ensure detention_assignments.status CHECK includes 'late' and 'rescheduled'
--    (old add_detention_tables.js may have omitted these values)
DO $$ BEGIN
    ALTER TABLE detention_assignments
        DROP CONSTRAINT IF EXISTS detention_assignments_status_check;
    ALTER TABLE detention_assignments
        ADD CONSTRAINT detention_assignments_status_check
        CHECK (status IN ('assigned','attended','absent','late','excused','rescheduled'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not update detention_assignments status CHECK: %', SQLERRM;
END $$;

-- 6. Create detention_session_teachers junction table (multi-teacher support)
CREATE TABLE IF NOT EXISTS detention_session_teachers (
    id         SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES detention_sessions(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, teacher_id)
);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_da_detention_id   ON detention_assignments (detention_id);
CREATE INDEX IF NOT EXISTS idx_da_student_id     ON detention_assignments (student_id);
CREATE INDEX IF NOT EXISTS idx_da_status         ON detention_assignments (status);
CREATE INDEX IF NOT EXISTS idx_ds_date           ON detention_sessions    (detention_date);
CREATE INDEX IF NOT EXISTS idx_ds_status         ON detention_sessions    (status);
CREATE INDEX IF NOT EXISTS idx_dst_session       ON detention_session_teachers (session_id);
CREATE INDEX IF NOT EXISTS idx_dst_teacher       ON detention_session_teachers (teacher_id);
