-- Migration: Add Portal-Specific Logo Columns
-- Description: Add separate logo columns for parent, teacher, and admin portals
-- Date: 2024

-- Add portal-specific logo columns to school_branding table
ALTER TABLE public.school_branding 
ADD COLUMN IF NOT EXISTS parent_portal_logo_url TEXT,
ADD COLUMN IF NOT EXISTS teacher_portal_logo_url TEXT,
ADD COLUMN IF NOT EXISTS admin_portal_logo_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.school_branding.parent_portal_logo_url IS 'Logo URL for parent portal';
COMMENT ON COLUMN public.school_branding.teacher_portal_logo_url IS 'Logo URL for teacher portal';
COMMENT ON COLUMN public.school_branding.admin_portal_logo_url IS 'Logo URL for admin portal';

-- Create indexes for performance (optional, but good practice)
CREATE INDEX IF NOT EXISTS idx_school_branding_parent_logo ON public.school_branding(parent_portal_logo_url) WHERE parent_portal_logo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_school_branding_teacher_logo ON public.school_branding(teacher_portal_logo_url) WHERE teacher_portal_logo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_school_branding_admin_logo ON public.school_branding(admin_portal_logo_url) WHERE admin_portal_logo_url IS NOT NULL;
