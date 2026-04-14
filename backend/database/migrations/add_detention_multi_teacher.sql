-- Migration: detention_session_teachers
-- Allows multiple teachers/invigilators to be assigned to a single detention session.
-- The primary teacher remains in detention_sessions.teacher_on_duty_id.
-- Additional teachers are stored here.

CREATE TABLE IF NOT EXISTS {SCHEMA}.detention_session_teachers (
  id         SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES {SCHEMA}.detention_sessions(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES {SCHEMA}.teachers(id)           ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_dst_session ON {SCHEMA}.detention_session_teachers (session_id);
CREATE INDEX IF NOT EXISTS idx_dst_teacher ON {SCHEMA}.detention_session_teachers (teacher_id);
