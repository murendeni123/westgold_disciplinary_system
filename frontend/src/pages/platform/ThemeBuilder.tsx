import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Eye,
  History,
  Upload,
  Palette,
  Type,
  Layout,
  Sparkles,
  Settings,
  Mail,
  Code,
  ArrowLeft,
  Check,
  AlertTriangle,
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  Rocket,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  ThemeVersion,
  DraftThemeState,
  PreviewState,
  DesignTokens,
  ValidationWarning,
  DEFAULT_DESIGN_TOKENS,
  PortalType,
  DeviceType,
  PreviewPage,
} from '../../types/theme.types';
import BrandingSection from '../../components/theme-builder/BrandingSection';
import ColorsSection from '../../components/theme-builder/ColorsSection';
import TypographySection from '../../components/theme-builder/TypographySection';
import ComponentsSection from '../../components/theme-builder/ComponentsSection';
import LayoutSection from '../../components/theme-builder/LayoutSection';
import ContentSection from '../../components/theme-builder/ContentSection';
import EmailTemplatesSection from '../../components/theme-builder/EmailTemplatesSection';
import AdvancedSection from '../../components/theme-builder/AdvancedSection';
import LivePreviewFrame from '../../components/theme-builder/LivePreviewFrame';

// =====================================================
// MAIN THEME BUILDER COMPONENT
// =====================================================

const ThemeBuilder: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();

  // State management
  const [publishedTheme, setPublishedTheme] = useState<ThemeVersion | null>(null);
  const [draftState, setDraftState] = useState<DraftThemeState>({
    tokens: DEFAULT_DESIGN_TOKENS,
    assets: {},
    content: {},
    email_templates: {},
    advanced_overrides: {},
    portal_overrides: {},
    isDirty: false,
    validationWarnings: [],
  });

  const [previewState, setPreviewState] = useState<PreviewState>({
    portal: 'admin',
    page: 'dashboard',
    device: 'desktop',
    splitView: false,
    showBefore: false,
  });

  const [activeSection, setActiveSection] = useState<string>('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // =====================================================
  // DATA FETCHING
  // =====================================================

  useEffect(() => {
    loadThemes();
  }, [schoolId]);

  const loadThemes = async () => {
    if (!schoolId) return;
    
    try {
      const [publishedRes, draftRes] = await Promise.all([
        api.getPublishedTheme(parseInt(schoolId)),
        api.getDraftTheme(parseInt(schoolId)),
      ]);

      if (publishedRes.data.theme) {
        setPublishedTheme(publishedRes.data.theme);
      }

      if (draftRes.data.theme) {
        const draft = draftRes.data.theme;
        setDraftState({
          tokens: draft.tokens || DEFAULT_DESIGN_TOKENS,
          assets: draft.assets || {},
          content: draft.content || {},
          email_templates: draft.email_templates || {},
          advanced_overrides: draft.advanced_overrides || {},
          portal_overrides: draft.portal_overrides || {},
          isDirty: false,
          lastSaved: draft.updated_at,
          validationWarnings: [],
        });
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  // =====================================================
  // AUTO-SAVE
  // =====================================================

  useEffect(() => {
    if (!autoSaveEnabled || !draftState.isDirty) return;

    const timer = setTimeout(() => {
      saveDraft();
    }, 2000);

    return () => clearTimeout(timer);
  }, [draftState, autoSaveEnabled]);

  const saveDraft = async () => {
    if (!schoolId) return;

    setIsSaving(true);
    try {
      await api.saveDraftTheme(parseInt(schoolId), {
        tokens: draftState.tokens,
        assets: draftState.assets,
        content: draftState.content,
        email_templates: draftState.email_templates,
        advanced_overrides: draftState.advanced_overrides,
        portal_overrides: draftState.portal_overrides,
      });

      setLastSaved(new Date());
      setDraftState(prev => ({ ...prev, isDirty: false }));
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================================
  // PUBLISH WORKFLOW
  // =====================================================

  const publishTheme = async () => {
    if (!schoolId) return;

    // Validate before publishing
    const warnings = validateTheme();
    if (warnings.some(w => w.severity === 'error')) {
      setDraftState(prev => ({ ...prev, validationWarnings: warnings }));
      return;
    }

    setIsPublishing(true);
    try {
      // Save draft first
      await saveDraft();

      // Get draft ID
      const draftRes = await api.getDraftTheme(parseInt(schoolId));
      const draftId = draftRes.data.theme?.id;

      if (!draftId) {
        throw new Error('No draft to publish');
      }

      // Publish
      await api.publishTheme(parseInt(schoolId), {
        theme_version_id: draftId,
      });

      // Reload themes
      await loadThemes();

      setDraftState(prev => ({ ...prev, isDirty: false, validationWarnings: [] }));
    } catch (error) {
      console.error('Error publishing theme:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateTheme = (): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];

    // Check contrast ratios
    const { colors } = draftState.tokens;
    const primaryContrast = calculateContrast(colors.primary, colors.surface);
    if (primaryContrast < 4.5) {
      warnings.push({
        type: 'contrast',
        severity: 'warning',
        message: 'Primary color contrast ratio is below WCAG AA standard',
        field: 'colors.primary',
      });
    }

    // Check for missing assets
    if (!draftState.assets.logo) {
      warnings.push({
        type: 'missing_asset',
        severity: 'warning',
        message: 'No logo uploaded',
        field: 'assets.logo',
      });
    }

    // Check for unsafe CSS
    if (draftState.advanced_overrides.customCss) {
      const unsafePatterns = ['eval(', 'expression(', 'javascript:'];
      const css = draftState.advanced_overrides.customCss;
      if (unsafePatterns.some(pattern => css.includes(pattern))) {
        warnings.push({
          type: 'unsafe_css',
          severity: 'error',
          message: 'Custom CSS contains potentially unsafe code',
          field: 'advanced_overrides.customCss',
        });
      }
    }

    return warnings;
  };

  const calculateContrast = (color1: string, color2: string): number => {
    // Simplified contrast calculation
    // In production, use a proper color library
    return 7; // Placeholder
  };

  // =====================================================
  // TOKEN UPDATES
  // =====================================================

  const updateToken = useCallback((path: string, value: any) => {
    setDraftState(prev => {
      const newTokens = { ...prev.tokens };
      const keys = path.split('.');
      let current: any = newTokens;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      return {
        ...prev,
        tokens: newTokens,
        isDirty: true,
      };
    });
  }, []);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <TopBar
        schoolId={schoolId}
        isDirty={draftState.isDirty}
        isSaving={isSaving}
        isPublishing={isPublishing}
        lastSaved={lastSaved}
        onBack={() => navigate(`/platform/schools/${schoolId}`)}
        onSave={saveDraft}
        onPublish={publishTheme}
        onHistory={() => setShowHistory(true)}
        validationWarnings={draftState.validationWarnings}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Customization Controls */}
        <LeftPanel
          schoolId={schoolId || ''}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          draftState={draftState}
          onUpdateToken={updateToken}
          onUpdateAssets={(assets) => setDraftState(prev => ({ ...prev, assets, isDirty: true }))}
          onUpdateContent={(content) => setDraftState(prev => ({ ...prev, content, isDirty: true }))}
          onUpdateEmailTemplates={(templates) => setDraftState(prev => ({ ...prev, email_templates: templates, isDirty: true }))}
          onUpdateAdvanced={(overrides) => setDraftState(prev => ({ ...prev, advanced_overrides: overrides, isDirty: true }))}
        />

        {/* Right Panel - Live Preview */}
        <RightPanel
          previewState={previewState}
          onPreviewStateChange={setPreviewState}
          draftTokens={draftState.tokens}
          publishedTokens={publishedTheme?.tokens}
          assets={draftState.assets}
        />
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <HistoryModal
            schoolId={schoolId}
            onClose={() => setShowHistory(false)}
            onRollback={loadThemes}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// =====================================================
// TOP BAR COMPONENT
// =====================================================

interface TopBarProps {
  schoolId?: string;
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  lastSaved: Date | null;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  onHistory: () => void;
  validationWarnings: ValidationWarning[];
}

const TopBar: React.FC<TopBarProps> = ({
  isDirty,
  isSaving,
  isPublishing,
  lastSaved,
  onBack,
  onSave,
  onPublish,
  onHistory,
  validationWarnings,
}) => {
  const hasErrors = validationWarnings.some(w => w.severity === 'error');

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Theme Builder</h1>
            <div className="flex items-center gap-2 mt-1">
              {isDirty && (
                <span className="text-xs text-orange-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  Unsaved changes
                </span>
              )}
              {isSaving && (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <Clock size={12} className="animate-spin" />
                  Saving...
                </span>
              )}
              {!isDirty && lastSaved && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Check size={12} />
                  Saved {formatTimeAgo(lastSaved)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle size={16} className="text-orange-600" />
              <span className="text-sm text-orange-900">
                {validationWarnings.length} {validationWarnings.length === 1 ? 'issue' : 'issues'}
              </span>
            </div>
          )}

          {/* History */}
          <button
            onClick={onHistory}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <History size={18} />
            <span>History</span>
          </button>

          {/* Save Draft */}
          <button
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Save size={18} />
            <span>Save Draft</span>
          </button>

          {/* Publish */}
          <button
            onClick={onPublish}
            disabled={hasErrors || isPublishing}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30"
          >
            {isPublishing ? (
              <>
                <Clock size={18} className="animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Rocket size={18} />
                <span>Publish</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// LEFT PANEL - CUSTOMIZATION SECTIONS
// =====================================================

interface LeftPanelProps {
  schoolId: string;
  activeSection: string;
  onSectionChange: (section: string) => void;
  draftState: DraftThemeState;
  onUpdateToken: (path: string, value: any) => void;
  onUpdateAssets: (assets: any) => void;
  onUpdateContent: (content: any) => void;
  onUpdateEmailTemplates: (templates: any) => void;
  onUpdateAdvanced: (overrides: any) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  schoolId,
  activeSection,
  onSectionChange,
  draftState,
  onUpdateToken,
  onUpdateAssets,
  onUpdateContent,
  onUpdateEmailTemplates,
  onUpdateAdvanced,
}) => {
  const sections = [
    { id: 'branding', label: 'Branding', icon: Upload },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'components', label: 'UI Components', icon: Sparkles },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'content', label: 'Content', icon: Settings },
    { id: 'email', label: 'Email Templates', icon: Mail },
    { id: 'advanced', label: 'Advanced', icon: Code },
  ];

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
      {/* Section Tabs */}
      <div className="border-b border-gray-200 p-4">
        <div className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                <span>{section.label}</span>
                {isActive && <ChevronRight size={16} className="ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'branding' && (
          <BrandingSection
            schoolId={schoolId || ''}
            assets={draftState.assets}
            onUpdateAssets={onUpdateAssets}
          />
        )}
        {activeSection === 'colors' && (
          <ColorsSection
            colors={draftState.tokens.colors}
            onUpdateToken={onUpdateToken}
          />
        )}
        {activeSection === 'typography' && (
          <TypographySection
            typography={draftState.tokens.typography}
            onUpdateToken={onUpdateToken}
          />
        )}
        {activeSection === 'components' && (
          <ComponentsSection
            components={draftState.tokens.components}
            onUpdateToken={onUpdateToken}
          />
        )}
        {activeSection === 'layout' && (
          <LayoutSection
            layout={draftState.tokens.layout}
            onUpdateToken={onUpdateToken}
          />
        )}
        {activeSection === 'content' && (
          <ContentSection
            content={draftState.content}
            onUpdateContent={onUpdateContent}
          />
        )}
        {activeSection === 'email' && (
          <EmailTemplatesSection
            emailTemplates={draftState.email_templates}
            onUpdateEmailTemplates={onUpdateEmailTemplates}
          />
        )}
        {activeSection === 'advanced' && (
          <AdvancedSection
            advancedOverrides={draftState.advanced_overrides}
            onUpdateAdvanced={onUpdateAdvanced}
          />
        )}
      </div>
    </div>
  );
};

// =====================================================
// RIGHT PANEL - LIVE PREVIEW
// =====================================================

interface RightPanelProps {
  previewState: PreviewState;
  onPreviewStateChange: (state: PreviewState) => void;
  draftTokens: DesignTokens;
  publishedTokens?: DesignTokens;
  assets: any;
}

const RightPanel: React.FC<RightPanelProps> = ({
  previewState,
  onPreviewStateChange,
  draftTokens,
  publishedTokens,
  assets,
}) => {
  const devices: { type: DeviceType; icon: any; width: string }[] = [
    { type: 'desktop', icon: Monitor, width: '100%' },
    { type: 'tablet', icon: Tablet, width: '768px' },
    { type: 'mobile', icon: Smartphone, width: '375px' },
  ];

  const portals: PortalType[] = ['admin', 'teacher', 'parent'];
  const pages: PreviewPage[] = ['login', 'dashboard', 'incident', 'reports', 'table'];

  return (
    <div className="flex-1 bg-gray-100 flex flex-col">
      {/* Preview Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Device Switcher */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {devices.map(({ type, icon: Icon }) => (
              <button
                key={type}
                onClick={() => onPreviewStateChange({ ...previewState, device: type })}
                className={`p-2 rounded-md transition-colors ${
                  previewState.device === type
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>

          {/* Portal Switcher */}
          <div className="flex items-center gap-2">
            {portals.map((portal) => (
              <button
                key={portal}
                onClick={() => onPreviewStateChange({ ...previewState, portal })}
                className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                  previewState.portal === portal
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {portal}
              </button>
            ))}
          </div>

          {/* Page Switcher */}
          <select
            value={previewState.page}
            onChange={(e) => onPreviewStateChange({ ...previewState, page: e.target.value as PreviewPage })}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            {pages.map((page) => (
              <option key={page} value={page} className="capitalize">
                {page}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 p-8 overflow-auto">
        <motion.div
          layout
          className="mx-auto bg-white rounded-xl shadow-2xl overflow-hidden"
          style={{
            width: devices.find(d => d.type === previewState.device)?.width,
            maxWidth: '100%',
          }}
        >
          <LivePreviewFrame
            tokens={draftTokens}
            portal={previewState.portal}
            page={previewState.page}
            assets={assets}
          />
        </motion.div>
      </div>
    </div>
  );
};

// Placeholder components - to be implemented
const HistoryModal: React.FC<any> = () => null;

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default ThemeBuilder;
