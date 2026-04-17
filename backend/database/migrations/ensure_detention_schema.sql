-- =============================================================================
-- Migration: ensure_detention_schema.sql
-- Idempotent — safe to run multiple times on any school schema.
-- Handles ALL known production schema states and aligns them with the
-- current application code.
--
-- Known states that need fixing:
--   A) add_detention_tables.js created detention_assignments.detention_session_id
--      (wrong column name — code uses detention_id everywhere)
--   B) school_schema_template.sql created detention_assignments.detention_id
--      but with FK referencing 'detentions' table, not 'detention_sessions'
--   C) add_detention_tables.js status CHECK is missing 'in_progress' for sessions
--      and missing 'late'/'rescheduled' for assignments
--   D) assigned_by column was NOT NULL in add_detention_tables.js, which breaks
--      POST /detentions/:id/assign (that endpoint omits assigned_by)
--   E) detention_sessions missing is_frozen and completed_at columns
--
-- Usage (replace {SCHEMA} with the school schema name, e.g. school_lear_1291):
--   SET search_path TO {SCHEMA}, public;
--   \i ensure_detention_schema.sql
-- =============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Ensure detention_sessions exists
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detention_sessions (
    id                 SERIAL PRIMARY KEY,
    detention_date     DATE NOT NULL,
    detention_time     TIME NOT NULL,
    end_time           TIME,
    duration           INTEGER DEFAULT 60,
    location           TEXT,
    teacher_on_duty_id INTEGER,
    max_capacity       INTEGER DEFAULT 30,
    current_count      INTEGER DEFAULT 0,
    status             TEXT DEFAULT 'scheduled',
    is_frozen          BOOLEAN DEFAULT false,
    completed_at       TIMESTAMPTZ,
    notes              TEXT,
    created_by         INTEGER,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Add missing columns to detention_sessions
-- ──────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
    ALTER TABLE detention_sessions ADD COLUMN is_frozen BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE detention_sessions ADD COLUMN completed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE detention_sessions ADD COLUMN current_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Fix detention_sessions.status CHECK  (add 'in_progress' if missing)
--    Drop any existing check constraint by name (auto-named by postgres), then
--    recreate with the full set of valid values.
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT constraint_name
        FROM   information_schema.check_constraints
        WHERE  constraint_schema = current_schema()
          AND  constraint_name LIKE '%detention_sessions%status%'
    LOOP
        EXECUTE 'ALTER TABLE detention_sessions DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'detention_sessions status constraint removal: %', SQLERRM;
END $$;

ALTER TABLE detention_sessions
    DROP CONSTRAINT IF EXISTS detention_sessions_status_check;

ALTER TABLE detention_sessions
    ADD CONSTRAINT detention_sessions_status_check
    CHECK (status IN ('scheduled','in_progress','completed','cancelled'));

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. FIX CRITICAL: detention_assignments column name
--    add_detention_tables.js used 'detention_session_id' — rename to 'detention_id'
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE  table_schema = current_schema()
          AND  table_name   = 'detention_assignments'
          AND  column_name  = 'detention_session_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE  table_schema = current_schema()
          AND  table_name   = 'detention_assignments'
          AND  column_name  = 'detention_id'
    ) THEN
        RAISE NOTICE 'Renaming detention_assignments.detention_session_id -> detention_id';
        ALTER TABLE detention_assignments RENAME COLUMN detention_session_id TO detention_id;
    END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Ensure detention_assignments exists (if neither add_detention_tables.js
--    nor the template created it yet)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detention_assignments (
    id                  SERIAL PRIMARY KEY,
    detention_id        INTEGER NOT NULL,
    student_id          INTEGER NOT NULL,
    incident_id         INTEGER,
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

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. FIX CRITICAL: detention_assignments.detention_id FK
--    The old template pointed FK at 'detentions' table, not 'detention_sessions'.
--    Every auto-assign INSERT fails the FK check and is silently swallowed,
--    leaving 0 students visible even after auto-assign appears to succeed.
--    Drop any wrong FK, add correct FK -> detention_sessions.
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop ALL foreign key constraints on detention_assignments.detention_id
    -- so we can add the correct one cleanly.
    FOR r IN
        SELECT tc.constraint_name
        FROM   information_schema.table_constraints tc
        JOIN   information_schema.key_column_usage  kcu
               ON  tc.constraint_name = kcu.constraint_name
               AND tc.table_schema    = kcu.table_schema
        WHERE  tc.table_schema   = current_schema()
          AND  tc.table_name     = 'detention_assignments'
          AND  tc.constraint_type = 'FOREIGN KEY'
          AND  kcu.column_name   = 'detention_id'
    LOOP
        RAISE NOTICE 'Dropping FK: %', r.constraint_name;
        EXECUTE 'ALTER TABLE detention_assignments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Add the correct FK (only if detention_sessions exists — it always should now)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.table_constraints tc
        JOIN   information_schema.key_column_usage  kcu
               ON  tc.constraint_name = kcu.constraint_name
               AND tc.table_schema    = kcu.table_schema
        WHERE  tc.table_schema    = current_schema()
          AND  tc.table_name      = 'detention_assignments'
          AND  tc.constraint_type = 'FOREIGN KEY'
          AND  kcu.column_name    = 'detention_id'
    ) THEN
        ALTER TABLE detention_assignments
            ADD CONSTRAINT da_detention_sessions_fk
            FOREIGN KEY (detention_id) REFERENCES detention_sessions(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added correct FK: detention_assignments.detention_id -> detention_sessions.id';
    END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. FIX: Make assigned_by nullable
--    add_detention_tables.js declared it NOT NULL, which breaks POST /:id/assign
--    (that route omits assigned_by from the INSERT columns).
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    ALTER TABLE detention_assignments ALTER COLUMN assigned_by DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. Fix detention_assignments.status CHECK (add 'late', 'rescheduled')
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT constraint_name
        FROM   information_schema.check_constraints
        WHERE  constraint_schema = current_schema()
          AND  constraint_name LIKE '%detention_assignments%status%'
    LOOP
        EXECUTE 'ALTER TABLE detention_assignments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE detention_assignments
    DROP CONSTRAINT IF EXISTS detention_assignments_status_check;

ALTER TABLE detention_assignments
    ADD CONSTRAINT detention_assignments_status_check
    CHECK (status IN ('assigned','attended','absent','late','excused','rescheduled'));

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. Create detention_session_teachers junction table (multi-teacher support)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detention_session_teachers (
    id         SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES detention_sessions(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id)          ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, teacher_id)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. Performance indexes
-- ──────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_da_detention_id   ON detention_assignments     (detention_id);
CREATE INDEX IF NOT EXISTS idx_da_student_id     ON detention_assignments     (student_id);
CREATE INDEX IF NOT EXISTS idx_da_status         ON detention_assignments     (status);
CREATE INDEX IF NOT EXISTS idx_ds_date           ON detention_sessions        (detention_date);
CREATE INDEX IF NOT EXISTS idx_ds_status         ON detention_sessions        (status);
CREATE INDEX IF NOT EXISTS idx_dst_session       ON detention_session_teachers (session_id);
CREATE INDEX IF NOT EXISTS idx_dst_teacher       ON detention_session_teachers (teacher_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Done
-- ──────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
    RAISE NOTICE '✅ ensure_detention_schema.sql complete.';
END $$;
