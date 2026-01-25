-- Migration: Add Progress Tracking and Outcome Measurement to Interventions
-- This adds fields for tracking intervention progress and measuring outcomes

-- Function to add columns to interventions table in a specific schema
CREATE OR REPLACE FUNCTION add_intervention_tracking_columns(schema_name TEXT) RETURNS void AS $$
BEGIN
  -- Add progress tracking fields
  EXECUTE format('
    ALTER TABLE %I.interventions 
    ADD COLUMN IF NOT EXISTS progress_status TEXT DEFAULT ''not_started'' CHECK (progress_status IN (''not_started'', ''in_progress'', ''on_hold'', ''completed'', ''cancelled'')),
    ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    ADD COLUMN IF NOT EXISTS progress_notes TEXT,
    ADD COLUMN IF NOT EXISTS last_progress_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS next_session_date DATE,
    ADD COLUMN IF NOT EXISTS sessions_completed INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sessions_planned INTEGER
  ', schema_name);

  -- Add outcome measurement fields
  EXECUTE format('
    ALTER TABLE %I.interventions 
    ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN (''successful'', ''partially_successful'', ''unsuccessful'', ''ongoing'', ''discontinued'')),
    ADD COLUMN IF NOT EXISTS outcome_date DATE,
    ADD COLUMN IF NOT EXISTS outcome_notes TEXT,
    ADD COLUMN IF NOT EXISTS effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS follow_up_notes TEXT,
    ADD COLUMN IF NOT EXISTS completed_by INTEGER
  ', schema_name);

  RAISE NOTICE 'Added intervention tracking columns to schema: %', schema_name;
END;
$$ LANGUAGE plpgsql;

-- Apply to all school schemas that have interventions table
DO $$
DECLARE
  school_schema TEXT;
BEGIN
  FOR school_schema IN 
    SELECT DISTINCT table_schema 
    FROM information_schema.tables 
    WHERE table_name = 'interventions' 
    AND table_schema LIKE 'school_%'
  LOOP
    PERFORM add_intervention_tracking_columns(school_schema);
  END LOOP;
  
  RAISE NOTICE 'Intervention tracking columns added to all school schemas with interventions table';
END $$;

-- Clean up
DROP FUNCTION IF EXISTS add_intervention_tracking_columns(TEXT);

-- Add comments for documentation
COMMENT ON COLUMN school_default.interventions.progress_status IS 'Current status of the intervention: not_started, in_progress, on_hold, completed, cancelled';
COMMENT ON COLUMN school_default.interventions.progress_percentage IS 'Percentage of intervention completion (0-100)';
COMMENT ON COLUMN school_default.interventions.progress_notes IS 'Notes about current progress';
COMMENT ON COLUMN school_default.interventions.last_progress_update IS 'Timestamp of last progress update';
COMMENT ON COLUMN school_default.interventions.next_session_date IS 'Date of next scheduled session';
COMMENT ON COLUMN school_default.interventions.sessions_completed IS 'Number of sessions completed';
COMMENT ON COLUMN school_default.interventions.sessions_planned IS 'Total number of sessions planned';
COMMENT ON COLUMN school_default.interventions.outcome IS 'Final outcome: successful, partially_successful, unsuccessful, ongoing, discontinued';
COMMENT ON COLUMN school_default.interventions.outcome_date IS 'Date when outcome was determined';
COMMENT ON COLUMN school_default.interventions.outcome_notes IS 'Detailed notes about the outcome';
COMMENT ON COLUMN school_default.interventions.effectiveness_rating IS 'Rating of intervention effectiveness (1-5 scale)';
COMMENT ON COLUMN school_default.interventions.follow_up_required IS 'Whether follow-up intervention is needed';
COMMENT ON COLUMN school_default.interventions.follow_up_notes IS 'Notes about required follow-up';
COMMENT ON COLUMN school_default.interventions.completed_by IS 'User ID who marked intervention as completed';
