-- Migration: Add Goldie Badge Configuration Table
-- This table stores the merit points threshold for earning the Goldie Badge per school

CREATE TABLE IF NOT EXISTS goldie_badge_config (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    points_threshold INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id)
);

-- Add comment
COMMENT ON TABLE goldie_badge_config IS 'Stores Goldie Badge configuration per school';
COMMENT ON COLUMN goldie_badge_config.points_threshold IS 'Merit points required to earn the Goldie Badge';

-- Insert default configuration for existing schools
INSERT INTO goldie_badge_config (school_id, points_threshold)
SELECT id, 100 FROM public.schools
ON CONFLICT (school_id) DO NOTHING;
