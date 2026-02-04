-- Migration: Create System Features Tables
-- Description: Create tables for managing system features and plan-feature relationships
-- Date: 2024

-- Create system_features table
CREATE TABLE IF NOT EXISTS public.system_features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create plan_features junction table
CREATE TABLE IF NOT EXISTS public.plan_features (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    feature_id INTEGER NOT NULL REFERENCES public.system_features(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plan_id, feature_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_features_category ON public.system_features(category);
CREATE INDEX IF NOT EXISTS idx_system_features_feature_key ON public.system_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_system_features_is_active ON public.system_features(is_active);
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON public.plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature_id ON public.plan_features(feature_id);

-- Add updated_at trigger for system_features
CREATE OR REPLACE FUNCTION update_system_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_features_updated_at
    BEFORE UPDATE ON public.system_features
    FOR EACH ROW
    EXECUTE FUNCTION update_system_features_updated_at();

-- Add comments
COMMENT ON TABLE public.system_features IS 'Stores all available system features';
COMMENT ON TABLE public.plan_features IS 'Junction table linking subscription plans to features';
COMMENT ON COLUMN public.system_features.feature_key IS 'Unique identifier for feature access control';
COMMENT ON COLUMN public.system_features.category IS 'Feature category for grouping (e.g., core, advanced, premium)';
COMMENT ON COLUMN public.system_features.is_premium IS 'Whether feature is premium/paid only';
