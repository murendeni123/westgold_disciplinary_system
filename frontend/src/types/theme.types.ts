// =====================================================
// ENTERPRISE THEME SYSTEM - TYPESCRIPT TYPES
// =====================================================

export type ThemeStatus = 'draft' | 'published' | 'archived';
export type AssetType = 'logo' | 'favicon' | 'login_background' | 'dashboard_background' | 'custom';
export type ThemeAction = 'created' | 'updated' | 'published' | 'archived' | 'rolled_back';
export type PortalType = 'admin' | 'teacher' | 'parent';
export type DeviceType = 'desktop' | 'tablet' | 'mobile';
export type PreviewPage = 'login' | 'dashboard' | 'incident' | 'reports' | 'table';

// =====================================================
// DESIGN TOKENS
// =====================================================

export interface ColorTokens {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  warning: string;
  danger: string;
  border: string;
  focusRing: string;
}

export interface TypographyTokens {
  fontPrimary: string;
  fontSecondary: string;
  baseFontSize: string;
  headingScale: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
  };
  fontWeights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ComponentTokens {
  buttonRadius: string;
  cardRadius: string;
  inputRadius: string;
  shadowLevel: 'none' | 'sm' | 'medium' | 'lg' | 'xl';
  borderWidth: string;
  spacingScale: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

export interface LayoutTokens {
  sidebarWidth: string;
  headerHeight: string;
  density: 'compact' | 'normal' | 'comfortable';
  cornerStyle: 'sharp' | 'rounded' | 'pill';
}

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  components: ComponentTokens;
  layout: LayoutTokens;
}

// =====================================================
// ASSETS
// =====================================================

export interface ThemeAssets {
  logo?: string | null;
  favicon?: string | null;
  loginBackground?: string | null;
  dashboardBackground?: string | null;
}

export interface ThemeAssetRecord {
  id: number;
  school_id: number;
  theme_version_id?: number | null;
  asset_type: AssetType;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  is_active: boolean;
  used_in_published: boolean;
  uploaded_by?: number;
  uploaded_at: string;
}

// =====================================================
// CONTENT
// =====================================================

export interface LoginPageContent {
  welcomeMessage?: string;
  tagline?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface ContactContent {
  email?: string;
  phone?: string;
  supportEmail?: string;
}

export interface FooterContent {
  termsUrl?: string;
  privacyUrl?: string;
}

export interface ThemeContent {
  loginPage?: LoginPageContent;
  contact?: ContactContent;
  footer?: FooterContent;
}

// =====================================================
// EMAIL TEMPLATES
// =====================================================

export interface EmailTemplates {
  headerHtml?: string;
  footerHtml?: string;
  signature?: string;
}

// =====================================================
// ADVANCED OVERRIDES
// =====================================================

export interface AdvancedOverrides {
  customCss?: string;
  customJs?: string;
  scopedStyles?: Record<string, string>;
}

// =====================================================
// PORTAL OVERRIDES
// =====================================================

export interface PortalOverride {
  colors?: Partial<ColorTokens>;
  typography?: Partial<TypographyTokens>;
  components?: Partial<ComponentTokens>;
  layout?: Partial<LayoutTokens>;
}

export interface PortalOverrides {
  admin?: PortalOverride;
  teacher?: PortalOverride;
  parent?: PortalOverride;
}

// =====================================================
// THEME VERSION
// =====================================================

export interface ThemeVersion {
  id: number;
  school_id: number;
  version_number: number;
  status: ThemeStatus;
  name?: string;
  description?: string;
  tokens: DesignTokens;
  assets?: ThemeAssets;
  content?: ThemeContent;
  email_templates?: EmailTemplates;
  advanced_overrides?: AdvancedOverrides;
  portal_overrides?: PortalOverrides;
  created_by?: number;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  published_by?: number | null;
}

// =====================================================
// THEME CHANGE HISTORY
// =====================================================

export interface ValidationWarning {
  type: 'contrast' | 'missing_asset' | 'unsafe_css' | 'performance';
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

export interface ThemeChangeHistory {
  id: number;
  school_id: number;
  theme_version_id?: number | null;
  action: ThemeAction;
  changes?: Record<string, any>;
  previous_version?: number;
  new_version?: number;
  validation_passed?: boolean;
  validation_warnings?: ValidationWarning[];
  changed_by?: number;
  changed_at: string;
  ip_address?: string;
  user_agent?: string;
}

// =====================================================
// DRAFT STATE (Frontend Only)
// =====================================================

export interface DraftThemeState {
  tokens: DesignTokens;
  assets: ThemeAssets;
  content: ThemeContent;
  email_templates: EmailTemplates;
  advanced_overrides: AdvancedOverrides;
  portal_overrides: PortalOverrides;
  isDirty: boolean;
  lastSaved?: string;
  validationWarnings: ValidationWarning[];
}

// =====================================================
// PREVIEW STATE
// =====================================================

export interface PreviewState {
  portal: PortalType;
  page: PreviewPage;
  device: DeviceType;
  splitView: boolean;
  showBefore: boolean;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface GetThemeResponse {
  theme: ThemeVersion | null;
  hasPublished: boolean;
  hasDraft: boolean;
}

export interface SaveDraftRequest {
  school_id: number;
  tokens: DesignTokens;
  assets?: ThemeAssets;
  content?: ThemeContent;
  email_templates?: EmailTemplates;
  advanced_overrides?: AdvancedOverrides;
  portal_overrides?: PortalOverrides;
  name?: string;
  description?: string;
}

export interface PublishThemeRequest {
  school_id: number;
  theme_version_id: number;
  force?: boolean;
}

export interface PublishThemeResponse {
  success: boolean;
  published_version: ThemeVersion;
  validation_warnings?: ValidationWarning[];
}

export interface RollbackThemeRequest {
  school_id: number;
  target_version_number: number;
}

export interface UploadAssetRequest {
  school_id: number;
  asset_type: AssetType;
  file: File;
}

export interface UploadAssetResponse {
  asset: ThemeAssetRecord;
  url: string;
}

export interface ThemeHistoryResponse {
  history: ThemeChangeHistory[];
  total: number;
  page: number;
  pageSize: number;
}

// =====================================================
// VALIDATION
// =====================================================

export interface ContrastCheckResult {
  ratio: number;
  passes: boolean;
  level: 'AAA' | 'AA' | 'fail';
}

export interface ThemeValidationResult {
  isValid: boolean;
  errors: ValidationWarning[];
  warnings: ValidationWarning[];
  contrastChecks: Record<string, ContrastCheckResult>;
  missingAssets: string[];
  unsafeCss: string[];
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ThemeTokenPath = 
  | `colors.${keyof ColorTokens}`
  | `typography.${keyof TypographyTokens}`
  | `components.${keyof ComponentTokens}`
  | `layout.${keyof LayoutTokens}`;

// =====================================================
// DEFAULT VALUES
// =====================================================

export const DEFAULT_COLOR_TOKENS: ColorTokens = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  background: '#f9fafb',
  surface: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  border: '#e5e7eb',
  focusRing: '#3b82f6',
};

export const DEFAULT_TYPOGRAPHY_TOKENS: TypographyTokens = {
  fontPrimary: 'Inter',
  fontSecondary: 'Inter',
  baseFontSize: '16px',
  headingScale: {
    h1: '2.5rem',
    h2: '2rem',
    h3: '1.5rem',
    h4: '1.25rem',
    h5: '1rem',
    h6: '0.875rem',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const DEFAULT_COMPONENT_TOKENS: ComponentTokens = {
  buttonRadius: '8px',
  cardRadius: '12px',
  inputRadius: '8px',
  shadowLevel: 'medium',
  borderWidth: '1px',
  spacingScale: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
};

export const DEFAULT_LAYOUT_TOKENS: LayoutTokens = {
  sidebarWidth: '280px',
  headerHeight: '64px',
  density: 'normal',
  cornerStyle: 'rounded',
};

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  colors: DEFAULT_COLOR_TOKENS,
  typography: DEFAULT_TYPOGRAPHY_TOKENS,
  components: DEFAULT_COMPONENT_TOKENS,
  layout: DEFAULT_LAYOUT_TOKENS,
};
