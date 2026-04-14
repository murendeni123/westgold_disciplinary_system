-- Migration: Add completed_at and is_frozen columns to detention_sessions
-- These support the session-freeze feature: once a session is marked completed
-- no attendance changes are permitted and the record is permanently preserved.
-- Run this once per school schema.  Replace {SCHEMA_NAME} or use the migration runner.

ALTER TABLE {SCHEMA_NAME}.detention_sessions
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE {SCHEMA_NAME}.detention_sessions
  ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT false;

-- Backfill: any session already marked completed should be treated as frozen
UPDATE {SCHEMA_NAME}.detention_sessions
  SET is_frozen = true
  WHERE status = 'completed'
    AND (is_frozen IS NULL OR is_frozen = false);

COMMENT ON COLUMN {SCHEMA_NAME}.detention_sessions.completed_at
  IS 'Timestamp when the session was completed and frozen';
COMMENT ON COLUMN {SCHEMA_NAME}.detention_sessions.is_frozen
  IS 'When true, all attendance updates for this session are blocked (set automatically on completion)';

DO $$
BEGIN
  RAISE NOTICE 'Migration add_detention_freeze_columns applied successfully';
END $$;
