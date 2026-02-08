-- =====================================================
-- ENTERPRISE THEME SYSTEM - DATABASE SCHEMA
-- Multi-tenant theme management with versioning
-- =====================================================

-- Theme Versions Table
-- Stores all theme versions (draft, published, archived)
CREATE TABLE IF NOT EXISTS public.theme_versions (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    
    -- Version metadata
    version_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    name VARCHAR(255),
    description TEXT,
    
    -- Design Tokens (JSON)
    tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Asset paths
    assets JSONB DEFAULT '{}'::jsonb,
    
    -- Content & messaging
    content JSONB DEFAULT '{}'::jsonb,
    
    -- Email templates
    email_templates JSONB DEFAULT '{}'::jsonb,
    
    -- Advanced overrides (scoped CSS/JS)
    advanced_overrides JSONB DEFAULT '{}'::jsonb,
    
    -- Per-portal overrides
    portal_overrides JSONB DEFAULT '{}'::jsonb,
    
    -- Audit trail
    created_by INTEGER REFERENCES public.platform_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    published_by INTEGER REFERENCES public.platform_users(id),
    
    -- Constraints
    UNIQUE(school_id, version_number)
);

-- Index for fast lookups
CREATE INDEX idx_theme_versions_school_status ON public.theme_versions(school_id, status);
CREATE INDEX idx_theme_versions_school_version ON public.theme_versions(school_id, version_number DESC);

-- Theme Assets Table
-- Stores uploaded assets with metadata
CREATE TABLE IF NOT EXISTS public.theme_assets (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    theme_version_id INTEGER REFERENCES public.theme_versions(id) ON DELETE SET NULL,
    
    -- Asset metadata
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('logo', 'favicon', 'login_background', 'dashboard_background', 'custom')),
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Dimensions for images
    width INTEGER,
    height INTEGER,
    
    -- Usage tracking
    is_active BOOLEAN DEFAULT true,
    used_in_published BOOLEAN DEFAULT false,
    
    -- Audit
    uploaded_by INTEGER REFERENCES public.platform_users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(school_id, asset_type, file_path)
);

CREATE INDEX idx_theme_assets_school ON public.theme_assets(school_id, is_active);

-- Theme Change History
-- Audit log of all theme changes
CREATE TABLE IF NOT EXISTS public.theme_change_history (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    theme_version_id INTEGER REFERENCES public.theme_versions(id) ON DELETE SET NULL,
    
    -- Change details
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'published', 'archived', 'rolled_back')),
    changes JSONB,
    previous_version INTEGER,
    new_version INTEGER,
    
    -- Validation results
    validation_passed BOOLEAN,
    validation_warnings JSONB,
    
    -- User context
    changed_by INTEGER REFERENCES public.platform_users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_theme_history_school ON public.theme_change_history(school_id, changed_at DESC);

-- =====================================================
-- DEFAULT DESIGN TOKENS SCHEMA
-- =====================================================

COMMENT ON COLUMN public.theme_versions.tokens IS 
'Design tokens JSON structure:
{
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "background": "#f9fafb",
    "surface": "#ffffff",
    "textPrimary": "#111827",
    "textSecondary": "#6b7280",
    "success": "#10b981",
    "warning": "#f59e0b",
    "danger": "#ef4444",
    "border": "#e5e7eb",
    "focusRing": "#3b82f6"
  },
  "typography": {
    "fontPrimary": "Inter",
    "fontSecondary": "Inter",
    "baseFontSize": "16px",
    "headingScale": {
      "h1": "2.5rem",
      "h2": "2rem",
      "h3": "1.5rem",
      "h4": "1.25rem",
      "h5": "1rem",
      "h6": "0.875rem"
    },
    "fontWeights": {
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "lineHeights": {
      "tight": 1.25,
      "normal": 1.5,
      "relaxed": 1.75
    }
  },
  "components": {
    "buttonRadius": "8px",
    "cardRadius": "12px",
    "inputRadius": "8px",
    "shadowLevel": "medium",
    "borderWidth": "1px",
    "spacingScale": {
      "xs": "0.25rem",
      "sm": "0.5rem",
      "md": "1rem",
      "lg": "1.5rem",
      "xl": "2rem",
      "2xl": "3rem"
    }
  },
  "layout": {
    "sidebarWidth": "280px",
    "headerHeight": "64px",
    "density": "normal",
    "cornerStyle": "rounded"
  }
}';

COMMENT ON COLUMN public.theme_versions.assets IS 
'Assets JSON structure:
{
  "logo": "/uploads/schools/1/logo-123.png",
  "favicon": "/uploads/schools/1/favicon-123.ico",
  "loginBackground": "/uploads/schools/1/login-bg-123.jpg",
  "dashboardBackground": "/uploads/schools/1/dashboard-bg-123.jpg"
}';

COMMENT ON COLUMN public.theme_versions.content IS 
'Content JSON structure:
{
  "loginPage": {
    "welcomeMessage": "Welcome to Our School",
    "tagline": "Excellence in Education",
    "alignment": "center"
  },
  "contact": {
    "email": "contact@school.com",
    "phone": "+1234567890",
    "supportEmail": "support@school.com"
  },
  "footer": {
    "termsUrl": "https://school.com/terms",
    "privacyUrl": "https://school.com/privacy"
  }
}';

COMMENT ON COLUMN public.theme_versions.portal_overrides IS 
'Portal-specific overrides JSON structure:
{
  "admin": {
    "colors": {
      "primary": "#f59e0b"
    }
  },
  "teacher": {
    "colors": {
      "primary": "#10b981"
    }
  },
  "parent": {
    "colors": {
      "primary": "#3b82f6"
    }
  }
}';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get current published theme
CREATE OR REPLACE FUNCTION get_published_theme(p_school_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    theme_data JSONB;
BEGIN
    SELECT row_to_json(t)::jsonb INTO theme_data
    FROM public.theme_versions t
    WHERE school_id = p_school_id 
    AND status = 'published'
    ORDER BY version_number DESC
    LIMIT 1;
    
    RETURN theme_data;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest draft theme
CREATE OR REPLACE FUNCTION get_draft_theme(p_school_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    theme_data JSONB;
BEGIN
    SELECT row_to_json(t)::jsonb INTO theme_data
    FROM public.theme_versions t
    WHERE school_id = p_school_id 
    AND status = 'draft'
    ORDER BY version_number DESC
    LIMIT 1;
    
    RETURN theme_data;
END;
$$ LANGUAGE plpgsql;

-- Function to create new version
CREATE OR REPLACE FUNCTION create_theme_version(
    p_school_id INTEGER,
    p_status VARCHAR(20),
    p_tokens JSONB,
    p_created_by INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    new_version_number INTEGER;
    new_id INTEGER;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO new_version_number
    FROM public.theme_versions
    WHERE school_id = p_school_id;
    
    -- Insert new version
    INSERT INTO public.theme_versions (
        school_id, version_number, status, tokens, created_by
    ) VALUES (
        p_school_id, new_version_number, p_status, p_tokens, p_created_by
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DEFAULT THEME FOR EXISTING SCHOOLS
-- =====================================================

-- Insert default published theme for schools without themes
INSERT INTO public.theme_versions (school_id, version_number, status, tokens, name)
SELECT 
    s.id,
    1,
    'published',
    '{
        "colors": {
            "primary": "#3b82f6",
            "secondary": "#8b5cf6",
            "background": "#f9fafb",
            "surface": "#ffffff",
            "textPrimary": "#111827",
            "textSecondary": "#6b7280",
            "success": "#10b981",
            "warning": "#f59e0b",
            "danger": "#ef4444",
            "border": "#e5e7eb",
            "focusRing": "#3b82f6"
        },
        "typography": {
            "fontPrimary": "Inter",
            "fontSecondary": "Inter",
            "baseFontSize": "16px"
        },
        "components": {
            "buttonRadius": "8px",
            "cardRadius": "12px",
            "inputRadius": "8px",
            "shadowLevel": "medium",
            "borderWidth": "1px"
        },
        "layout": {
            "sidebarWidth": "280px",
            "headerHeight": "64px",
            "density": "normal"
        }
    }'::jsonb,
    'Default Theme'
FROM public.schools s
WHERE NOT EXISTS (
    SELECT 1 FROM public.theme_versions tv 
    WHERE tv.school_id = s.id
)
ON CONFLICT (school_id, version_number) DO NOTHING;
