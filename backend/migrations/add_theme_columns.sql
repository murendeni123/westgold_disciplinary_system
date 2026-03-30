-- Add theme storage columns to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS active_theme_json JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS draft_theme_json JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.schools.active_theme_json IS 'Active theme configuration applied to school';
COMMENT ON COLUMN public.schools.draft_theme_json IS 'Draft theme configuration for preview and editing';
