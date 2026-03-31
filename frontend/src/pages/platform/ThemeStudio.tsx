import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  X, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Monitor,
  Check,
  RotateCcw,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

// Helper function to get full image URL
const getImageUrl = (path: string | null): string | null => {
  if (!path) return null;
  
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Construct full URL with backend base
  const hostname = window.location.hostname;
  const backendUrl = hostname !== 'localhost' && hostname !== '127.0.0.1'
    ? 'http://192.168.18.160:5000'
    : 'http://localhost:5000';
  
  return `${backendUrl}${path}`;
};

interface Theme {
  brand: {
    schoolName: string;
    logoUrl: string | null;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  login: {
    headline: string;
    subtext: string;
    bannerUrl: string | null;
  };
  ui: {
    radius: number;
    density: 'compact' | 'comfortable';
  };
}

const ThemeStudio: React.FC = () => {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const navigate = useNavigate();
  const { success, error: showError, ToastContainer } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'colors' | 'login' | 'ui'>('branding');
  const [schoolName, setSchoolName] = useState('');
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [draftTheme, setDraftTheme] = useState<Theme | null>(null);
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    if (schoolSlug) {
      fetchTheme();
    }
  }, [schoolSlug]);

  // Apply preview theme to CSS variables in real-time
  useEffect(() => {
    if (previewTheme) {
      applyThemeVariables(previewTheme);
    }
  }, [previewTheme]);

  const fetchTheme = async () => {
    try {
      setLoading(true);
      const response = await api.getSchoolTheme(schoolSlug!);
      const { activeTheme, draftTheme, schoolName } = response.data;
      
      setActiveTheme(activeTheme);
      setDraftTheme(draftTheme || activeTheme);
      setPreviewTheme(draftTheme || activeTheme);
      setSchoolName(schoolName);
    } catch (err: any) {
      console.error('Error fetching theme:', err);
      showError('Failed to load theme');
    } finally {
      setLoading(false);
    }
  };

  const applyThemeVariables = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-bg', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--radius', `${theme.ui.radius}px`);
  };

  const handleInputChange = (section: keyof Theme, field: string, value: any) => {
    if (!draftTheme) return;
    
    const updated = {
      ...draftTheme,
      [section]: {
        ...draftTheme[section],
        [field]: value
      }
    };
    
    setDraftTheme(updated);
    setPreviewTheme(updated);
  };

  const handleSaveDraft = async () => {
    if (!draftTheme) return;
    
    try {
      setSaving(true);
      await api.saveThemeStudioDraft(schoolSlug!, draftTheme);
      success('Draft theme saved successfully');
      await fetchTheme();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this theme? It will be visible to all users.')) {
      return;
    }
    
    try {
      setSaving(true);
      await api.publishThemeStudio(schoolSlug!);
      success('Theme published successfully!');
      await fetchTheme();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to publish theme');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!window.confirm('Are you sure you want to discard all draft changes?')) {
      return;
    }
    
    try {
      setSaving(true);
      await api.discardDraftTheme(schoolSlug!);
      success('Draft discarded');
      await fetchTheme();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to discard draft');
    } finally {
      setSaving(false);
    }
  };

  const handleRevertToDefault = async () => {
    if (!window.confirm('Are you sure you want to revert to default theme? This will replace your current draft.')) {
      return;
    }
    
    try {
      setSaving(true);
      await api.revertTheme(schoolSlug!);
      success('Reverted to default theme');
      await fetchTheme();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to revert theme');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type: 'logo' | 'banner', file: File) => {
    if (!file) return;
    
    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('File size must be less than 2MB');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Only image files are allowed');
      return;
    }
    
    try {
      if (type === 'logo') setUploadingLogo(true);
      else setUploadingBanner(true);
      
      const response = await api.uploadThemeFile(schoolSlug!, type, file);
      const fileUrl = response.data.url;
      
      // Update draft theme with new URL
      if (type === 'logo') {
        handleInputChange('brand', 'logoUrl', fileUrl);
      } else {
        handleInputChange('login', 'bannerUrl', fileUrl);
      }
      
      success(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully`);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleDeleteFile = async (type: 'logo' | 'banner') => {
    try {
      await api.deleteThemeFile(schoolSlug!, type);
      
      if (type === 'logo') {
        handleInputChange('brand', 'logoUrl', null);
      } else {
        handleInputChange('login', 'bannerUrl', null);
      }
      
      success(`${type === 'logo' ? 'Logo' : 'Banner'} deleted`);
    } catch (err: any) {
      showError('Failed to delete file');
    }
  };

  const enablePreviewMode = () => {
    if (!draftTheme) return;
    
    // Save preview state to sessionStorage
    sessionStorage.setItem('themePreviewEnabled', 'true');
    sessionStorage.setItem('themePreviewJson', JSON.stringify(draftTheme));
    sessionStorage.setItem('themePreviewSchool', schoolName);
    
    success('Preview mode enabled - navigate to see changes');
  };

  const openPreview = (page: 'login' | 'dashboard') => {
    if (!draftTheme) return;
    
    // Save preview state
    sessionStorage.setItem('themePreviewEnabled', 'true');
    sessionStorage.setItem('themePreviewJson', JSON.stringify(draftTheme));
    sessionStorage.setItem('themePreviewSchool', schoolName);
    
    // Open preview page
    const url = page === 'login' 
      ? `/s/${schoolSlug}/login?previewTheme=1`
      : `/admin/dashboard?previewTheme=1`;
    
    window.open(url, '_blank');
  };

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Sparkles },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'login', label: 'Login Page', icon: Monitor },
    { id: 'ui', label: 'UI Options', icon: Type },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-muted">Loading theme studio...</p>
        </div>
      </div>
    );
  }

  if (!draftTheme) return null;

  const hasDraftChanges = JSON.stringify(draftTheme) !== JSON.stringify(activeTheme);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-purple-50 to-pink-50">
      <ToastContainer />
      
      {/* Header */}
      <div className="bg-surface/80 backdrop-blur-xl shadow-lg border-b border-border sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/platform/schools/${schoolSlug}`)}
                className="bg-surface/50"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary">Theme Studio</h1>
                <p className="text-sm text-muted">{schoolName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openPreview('login')}
                className="bg-secondary text-blue-600 border-blue-200"
              >
                <Eye size={16} className="mr-2" />
                Preview Login
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRevertToDefault}
                disabled={saving}
                className="bg-surface"
              >
                <RotateCcw size={16} className="mr-2" />
                Revert to Default
              </Button>
              
              {hasDraftChanges && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDiscardDraft}
                  disabled={saving}
                  className="bg-surface text-red-600 border-red-200"
                >
                  <Trash2 size={16} className="mr-2" />
                  Discard Draft
                </Button>
              )}
              
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || !hasDraftChanges}
                className="bg-gradient-to-r from-secondary to-secondary"
              >
                <Save size={16} className="mr-2" />
                Save Draft
              </Button>
              
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublish}
                disabled={saving || !hasDraftChanges}
                className="bg-gradient-to-r from-primary to-emerald-600"
              >
                <Check size={16} className="mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Left: Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl shadow-xl border border-border p-2">
            <div className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-secondary to-secondary text-white shadow-lg'
                        : 'text-muted hover:bg-surface'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface/80 backdrop-blur-xl rounded-2xl shadow-xl border border-border p-6"
          >
            {/* Branding Section */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-primary mb-4">School Branding</h2>
                
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">School Logo</label>
                  {draftTheme.brand.logoUrl ? (
                    <div className="flex items-center space-x-4">
                      <img
                        src={getImageUrl(draftTheme.brand.logoUrl) || ''}
                        alt="Logo"
                        className="h-20 w-20 object-contain border border-gray-200 rounded-lg p-2"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-muted mb-2">{draftTheme.brand.logoUrl}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteFile('logo')}
                          className="bg-surface text-red-600 border-red-200"
                        >
                          <X size={16} className="mr-2" />
                          Remove Logo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                      <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl font-bold text-gray-400">
                          {schoolName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted mb-3">No logo uploaded</p>
                      <label className="cursor-pointer inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('logo', e.target.files[0])}
                          disabled={uploadingLogo}
                        />
                        <span className="inline-flex items-center px-4 py-2 bg-surface border border-gray-300 rounded-lg text-sm font-medium text-text hover:bg-surface transition-colors">
                          <Upload size={16} className="mr-2" />
                          {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* School Name */}
                <Input
                  label="School Name"
                  value={draftTheme.brand.schoolName}
                  onChange={(e) => handleInputChange('brand', 'schoolName', e.target.value)}
                  placeholder="Enter school name"
                />
              </div>
            )}

            {/* Colors Section */}
            {activeTab === 'colors' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-primary mb-4">Color Palette</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(draftTheme.colors).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-text mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => handleInputChange('colors', key, e.target.value)}
                          className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer"
                        />
                        <Input
                          value={value}
                          onChange={(e) => handleInputChange('colors', key, e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Login Page Section */}
            {activeTab === 'login' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-primary mb-4">Login Page Content</h2>
                
                <Input
                  label="Headline"
                  value={draftTheme.login.headline}
                  onChange={(e) => handleInputChange('login', 'headline', e.target.value)}
                  placeholder="Welcome Back"
                />
                
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Subtext</label>
                  <textarea
                    value={draftTheme.login.subtext}
                    onChange={(e) => handleInputChange('login', 'subtext', e.target.value)}
                    placeholder="Enter login page subtext"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Login Banner Image</label>
                  {draftTheme.login.bannerUrl ? (
                    <div className="space-y-3">
                      <img
                        src={getImageUrl(draftTheme.login.bannerUrl) || ''}
                        alt="Login Banner"
                        className="w-full h-48 object-cover rounded-xl border border-gray-200"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteFile('banner')}
                        className="bg-surface text-red-600 border-red-200"
                      >
                        <X size={16} className="mr-2" />
                        Remove Banner
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-muted mb-3">No banner uploaded</p>
                      <label className="cursor-pointer inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('banner', e.target.files[0])}
                          disabled={uploadingBanner}
                        />
                        <span className="inline-flex items-center px-4 py-2 bg-surface border border-gray-300 rounded-lg text-sm font-medium text-text hover:bg-surface transition-colors">
                          <Upload size={16} className="mr-2" />
                          {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* UI Options Section */}
            {activeTab === 'ui' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-primary mb-4">UI Customization</h2>
                
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Corner Radius: {draftTheme.ui.radius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={draftTheme.ui.radius}
                    onChange={(e) => handleInputChange('ui', 'radius', parseInt(e.target.value))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>Sharp (0px)</span>
                    <span>Rounded (24px)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Density</label>
                  <div className="flex space-x-3">
                    {['compact', 'comfortable'].map((density) => (
                      <button
                        key={density}
                        onClick={() => handleInputChange('ui', 'density', density)}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                          draftTheme.ui.density === density
                            ? 'border-blue-600 bg-secondary text-blue-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-semibold capitalize">{density}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl shadow-xl border border-border p-6 sticky top-24">
            <h3 className="text-lg font-bold text-primary mb-4">Live Preview</h3>
            
            {/* Color Swatches */}
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(draftTheme.colors).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div
                      className="w-full h-12 rounded-lg border border-gray-200 mb-1"
                      style={{ backgroundColor: value }}
                    />
                    <p className="text-xs text-muted capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* UI Preview */}
            <div className="space-y-3">
              <div className="p-4 bg-surface rounded-xl">
                <p className="text-sm font-medium text-text mb-2">Button Preview</p>
                <button
                  className="w-full px-4 py-2 text-white font-semibold shadow-lg"
                  style={{
                    backgroundColor: draftTheme.colors.primary,
                    borderRadius: `${draftTheme.ui.radius}px`
                  }}
                >
                  Primary Button
                </button>
              </div>

              <div className="p-4 bg-surface rounded-xl">
                <p className="text-sm font-medium text-text mb-2">Card Preview</p>
                <div
                  className="p-4 shadow-md"
                  style={{
                    backgroundColor: draftTheme.colors.surface,
                    borderRadius: `${draftTheme.ui.radius}px`
                  }}
                >
                  <p className="text-sm" style={{ color: draftTheme.colors.text }}>
                    Sample card content
                  </p>
                </div>
              </div>

              {draftTheme.brand.logoUrl && (
                <div className="p-4 bg-surface rounded-xl">
                  <p className="text-sm font-medium text-text mb-2">Logo Preview</p>
                  <img
                    src={getImageUrl(draftTheme.brand.logoUrl) || ''}
                    alt="Logo Preview"
                    className="h-16 mx-auto object-contain"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-secondary rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Changes are previewed in real-time. Save your draft and use the preview buttons to see how it looks on actual pages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeStudio;
