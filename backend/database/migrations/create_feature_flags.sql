-- Feature Flags Table in Platform Schema
-- This table stores feature toggles that can be enabled/disabled per school

CREATE TABLE IF NOT EXISTS platform.feature_flags (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    enabled_by INTEGER,
    enabled_at TIMESTAMP,
    disabled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, feature_name)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_school_feature 
ON platform.feature_flags(school_id, feature_name);

-- Insert default Goldie Badge feature flag for all existing schools
INSERT INTO platform.feature_flags (school_id, feature_name, is_enabled)
SELECT id, 'goldie_badge', false
FROM public.schools
ON CONFLICT (school_id, feature_name) DO NOTHING;

-- Function to automatically create feature flags for new schools
CREATE OR REPLACE FUNCTION platform.create_default_feature_flags()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO platform.feature_flags (school_id, feature_name, is_enabled)
    VALUES 
        (NEW.id, 'goldie_badge', false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default feature flags when a new school is created
DROP TRIGGER IF EXISTS trigger_create_default_feature_flags ON public.schools;
CREATE TRIGGER trigger_create_default_feature_flags
AFTER INSERT ON public.schools
FOR EACH ROW
EXECUTE FUNCTION platform.create_default_feature_flags();

COMMENT ON TABLE platform.feature_flags IS 'Stores feature toggles that can be enabled/disabled per school by platform admins';
COMMENT ON COLUMN platform.feature_flags.feature_name IS 'Name of the feature (e.g., goldie_badge, advanced_analytics)';
COMMENT ON COLUMN platform.feature_flags.is_enabled IS 'Whether the feature is currently enabled for this school';
