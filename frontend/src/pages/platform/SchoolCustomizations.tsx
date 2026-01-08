import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { ArrowLeft, Save, Upload, X, Palette, Type, Layout, Image, Mail, Code, Eye, FileText } from 'lucide-react';

const SchoolCustomizations: React.FC = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'colors' | 'typography' | 'ui' | 'login' | 'content' | 'email' | 'advanced'>('branding');
  const [customizations, setCustomizations] = useState<any>({});

  useEffect(() => {
    if (schoolId) {
      fetchCustomizations();
    }
  }, [schoolId]);

  const fetchCustomizations = async () => {
    try {
      setLoading(true);
      const response = await api.getSchoolCustomizations(Number(schoolId));
      setCustomizations(response.data || {});
    } catch (error) {
      console.error('Error fetching customizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setCustomizations((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (type: 'logo' | 'favicon' | 'login-background' | 'dashboard-background', file: File) => {
    try {
      setSaving(true);
      let response;
      if (type === 'logo') {
        response = await api.uploadSchoolLogo(Number(schoolId), file);
      } else if (type === 'favicon') {
        response = await api.uploadSchoolFavicon(Number(schoolId), file);
      } else if (type === 'login-background') {
        response = await api.uploadLoginBackground(Number(schoolId), file);
      } else {
        response = await api.uploadDashboardBackground(Number(schoolId), file);
      }

      // Update the appropriate field based on upload type
      const fieldMap: Record<typeof type, string> = {
        'logo': 'logo_path',
        'favicon': 'favicon_path',
        'login-background': 'login_background_path',
        'dashboard-background': 'dashboard_background_path',
      };
      const fieldName = fieldMap[type];
      const pathValue = response.data[fieldName] || response.data.logo_path || response.data.favicon_path || response.data.login_background_path || response.data.dashboard_background_path;
      
      setCustomizations((prev: any) => ({
        ...prev,
        [fieldName]: pathValue,
      }));
      alert('File uploaded successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error uploading file');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async (type: 'logo' | 'favicon' | 'login-background' | 'dashboard-background') => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      setSaving(true);
      if (type === 'logo') {
        await api.deleteSchoolLogo(Number(schoolId));
        setCustomizations((prev: any) => ({ ...prev, logo_path: null }));
      } else if (type === 'favicon') {
        await api.deleteSchoolFavicon(Number(schoolId));
        setCustomizations((prev: any) => ({ ...prev, favicon_path: null }));
      } else if (type === 'login-background') {
        await api.deleteLoginBackground(Number(schoolId));
        setCustomizations((prev: any) => ({ ...prev, login_background_path: null }));
      } else {
        await api.deleteDashboardBackground(Number(schoolId));
        setCustomizations((prev: any) => ({ ...prev, dashboard_background_path: null }));
      }
      alert('File deleted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting file');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateSchoolCustomizations(Number(schoolId), customizations);
      alert('Customizations saved successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving customizations');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    // Use the same base URL logic as the API service
    const getApiBaseUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          return 'http://192.168.18.160:5000';
        }
      }
      return 'http://localhost:5000';
    };
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${path}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Image },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'ui', label: 'UI Components', icon: Layout },
    { id: 'login', label: 'Login Page', icon: Eye },
    { id: 'content', label: 'Content', icon: Mail },
    { id: 'email', label: 'Email Templates', icon: FileText },
    { id: 'advanced', label: 'Advanced', icon: Code },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="secondary" onClick={() => navigate(`/platform/schools/${schoolId}`)}>
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">School Customizations</h1>
            <p className="text-gray-600 mt-2">Customize the appearance and branding for this school</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={20} className="mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'branding' && (
            <Card title="Branding Assets">
              <div className="space-y-6">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  {customizations.logo_path ? (
                    <div className="flex items-center space-x-4">
                      <img
                        src={getImageUrl(customizations.logo_path) || ''}
                        alt="Logo"
                        className="h-20 object-contain"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{customizations.logo_path}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteFile('logo')}
                          className="mt-2"
                        >
                          <X size={16} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('logo', file);
                        }}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload logo</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Favicon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                  {customizations.favicon_path ? (
                    <div className="flex items-center space-x-4">
                      <img
                        src={getImageUrl(customizations.favicon_path) || ''}
                        alt="Favicon"
                        className="h-16 w-16 object-contain"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{customizations.favicon_path}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteFile('favicon')}
                          className="mt-2"
                        >
                          <X size={16} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('favicon', file);
                        }}
                        className="hidden"
                        id="favicon-upload"
                      />
                      <label
                        htmlFor="favicon-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload favicon</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Login Background */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Login Page Background</label>
                  {customizations.login_background_path ? (
                    <div className="flex items-center space-x-4">
                      <img
                        src={getImageUrl(customizations.login_background_path) || ''}
                        alt="Login Background"
                        className="h-32 w-48 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{customizations.login_background_path}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteFile('login-background')}
                          className="mt-2"
                        >
                          <X size={16} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('login-background', file);
                        }}
                        className="hidden"
                        id="login-bg-upload"
                      />
                      <label
                        htmlFor="login-bg-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload background</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Dashboard Background */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Background</label>
                  {customizations.dashboard_background_path ? (
                    <div className="flex items-center space-x-4">
                      <img
                        src={getImageUrl(customizations.dashboard_background_path) || ''}
                        alt="Dashboard Background"
                        className="h-32 w-48 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{customizations.dashboard_background_path}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteFile('dashboard-background')}
                          className="mt-2"
                        >
                          <X size={16} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('dashboard-background', file);
                        }}
                        className="hidden"
                        id="dashboard-bg-upload"
                      />
                      <label
                        htmlFor="dashboard-bg-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload background</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'colors' && (
            <Card title="Color Theme">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Primary Color"
                  type="color"
                  value={customizations.primary_color || '#3b82f6'}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                />
                <Input
                  label="Secondary Color"
                  type="color"
                  value={customizations.secondary_color || '#8b5cf6'}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                />
                <Input
                  label="Success Color"
                  type="color"
                  value={customizations.success_color || '#10b981'}
                  onChange={(e) => handleInputChange('success_color', e.target.value)}
                />
                <Input
                  label="Warning Color"
                  type="color"
                  value={customizations.warning_color || '#f59e0b'}
                  onChange={(e) => handleInputChange('warning_color', e.target.value)}
                />
                <Input
                  label="Danger Color"
                  type="color"
                  value={customizations.danger_color || '#ef4444'}
                  onChange={(e) => handleInputChange('danger_color', e.target.value)}
                />
                <Input
                  label="Background Color"
                  type="color"
                  value={customizations.background_color || '#f9fafb'}
                  onChange={(e) => handleInputChange('background_color', e.target.value)}
                />
                <Input
                  label="Text Primary Color"
                  type="color"
                  value={customizations.text_primary_color || '#111827'}
                  onChange={(e) => handleInputChange('text_primary_color', e.target.value)}
                />
                <Input
                  label="Text Secondary Color"
                  type="color"
                  value={customizations.text_secondary_color || '#6b7280'}
                  onChange={(e) => handleInputChange('text_secondary_color', e.target.value)}
                />
              </div>
            </Card>
          )}

          {activeTab === 'typography' && (
            <Card title="Typography">
              <div className="space-y-4">
                <Input
                  label="Primary Font"
                  value={customizations.primary_font || 'Inter'}
                  onChange={(e) => handleInputChange('primary_font', e.target.value)}
                  placeholder="e.g., Inter, Roboto, Arial"
                />
                <Input
                  label="Secondary Font"
                  value={customizations.secondary_font || 'Inter'}
                  onChange={(e) => handleInputChange('secondary_font', e.target.value)}
                  placeholder="e.g., Inter, Roboto, Arial"
                />
                <Input
                  label="Base Font Size"
                  value={customizations.base_font_size || '16px'}
                  onChange={(e) => handleInputChange('base_font_size', e.target.value)}
                  placeholder="e.g., 16px, 1rem"
                />
              </div>
            </Card>
          )}

          {activeTab === 'ui' && (
            <Card title="UI Components">
              <div className="space-y-4">
                <Input
                  label="Button Border Radius"
                  value={customizations.button_border_radius || '8px'}
                  onChange={(e) => handleInputChange('button_border_radius', e.target.value)}
                  placeholder="e.g., 8px, 0.5rem"
                />
                <Input
                  label="Card Border Radius"
                  value={customizations.card_border_radius || '12px'}
                  onChange={(e) => handleInputChange('card_border_radius', e.target.value)}
                  placeholder="e.g., 12px, 0.75rem"
                />
                <Input
                  label="Sidebar Background"
                  type="color"
                  value={customizations.sidebar_background || '#ffffff'}
                  onChange={(e) => handleInputChange('sidebar_background', e.target.value)}
                />
                <Input
                  label="Header Background"
                  type="color"
                  value={customizations.header_background || '#ffffff'}
                  onChange={(e) => handleInputChange('header_background', e.target.value)}
                />
              </div>
            </Card>
          )}

          {activeTab === 'login' && (
            <Card title="Login Page Customization">
              <div className="space-y-4">
                <Input
                  label="Welcome Message"
                  value={customizations.login_welcome_message || ''}
                  onChange={(e) => handleInputChange('login_welcome_message', e.target.value)}
                  placeholder="Welcome to our school portal"
                />
                <Input
                  label="Tagline"
                  value={customizations.login_tagline || ''}
                  onChange={(e) => handleInputChange('login_tagline', e.target.value)}
                  placeholder="Empowering students for success"
                />
                <Input
                  label="Background Color"
                  type="color"
                  value={customizations.login_background_color || '#ffffff'}
                  onChange={(e) => handleInputChange('login_background_color', e.target.value)}
                />
              </div>
            </Card>
          )}

          {activeTab === 'content' && (
            <Card title="Content & Contact Information">
              <div className="space-y-4">
                <Input
                  label="Contact Email"
                  type="email"
                  value={customizations.contact_email || ''}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="contact@school.com"
                />
                <Input
                  label="Contact Phone"
                  type="tel"
                  value={customizations.contact_phone || ''}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
                <Input
                  label="Support Email"
                  type="email"
                  value={customizations.support_email || ''}
                  onChange={(e) => handleInputChange('support_email', e.target.value)}
                  placeholder="support@school.com"
                />
                <Input
                  label="Terms of Service URL"
                  type="url"
                  value={customizations.terms_url || ''}
                  onChange={(e) => handleInputChange('terms_url', e.target.value)}
                  placeholder="https://school.com/terms"
                />
                <Input
                  label="Privacy Policy URL"
                  type="url"
                  value={customizations.privacy_url || ''}
                  onChange={(e) => handleInputChange('privacy_url', e.target.value)}
                  placeholder="https://school.com/privacy"
                />
              </div>
            </Card>
          )}

          {activeTab === 'email' && (
            <Card title="Email Template Customization">
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Email template customization is coming soon. Currently, you can customize the email header and footer content below.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Header HTML</label>
                  <textarea
                    className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                    value={customizations.email_header_html || ''}
                    onChange={(e) => handleInputChange('email_header_html', e.target.value)}
                    placeholder="<div style='background: #3b82f6; color: white; padding: 20px; text-align: center;'><h1>School Name</h1></div>"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    HTML content to appear at the top of all emails
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Footer HTML</label>
                  <textarea
                    className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                    value={customizations.email_footer_html || ''}
                    onChange={(e) => handleInputChange('email_footer_html', e.target.value)}
                    placeholder="<div style='background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;'><p>© 2024 School Name. All rights reserved.</p></div>"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    HTML content to appear at the bottom of all emails
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Signature</label>
                  <textarea
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg"
                    value={customizations.email_signature || ''}
                    onChange={(e) => handleInputChange('email_signature', e.target.value)}
                    placeholder="Best regards,&#10;School Administration Team"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Default signature for all emails
                  </p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'advanced' && (
            <Card title="Advanced Customization">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS</label>
                  <textarea
                    className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                    value={customizations.custom_css || ''}
                    onChange={(e) => handleInputChange('custom_css', e.target.value)}
                    placeholder="/* Add your custom CSS here */"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom JavaScript</label>
                  <textarea
                    className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                    value={customizations.custom_js || ''}
                    onChange={(e) => handleInputChange('custom_js', e.target.value)}
                    placeholder="// Add your custom JavaScript here"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Use with caution. Custom JavaScript can affect functionality.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <Card title="Preview">
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: customizations.background_color || '#f9fafb' }}>
                <div
                  className="p-3 rounded mb-2"
                  style={{
                    backgroundColor: customizations.primary_color || '#3b82f6',
                    color: 'white',
                    borderRadius: customizations.button_border_radius || '8px',
                  }}
                >
                  Primary Button
                </div>
                <div
                  className="p-3 rounded mb-2"
                  style={{
                    backgroundColor: customizations.secondary_color || '#8b5cf6',
                    color: 'white',
                    borderRadius: customizations.button_border_radius || '8px',
                  }}
                >
                  Secondary Button
                </div>
                <div
                  className="p-4 rounded border"
                  style={{
                    borderRadius: customizations.card_border_radius || '12px',
                    backgroundColor: 'white',
                  }}
                >
                  <p style={{ color: customizations.text_primary_color || '#111827' }}>
                    Sample Card Content
                  </p>
                  <p className="text-sm mt-2" style={{ color: customizations.text_secondary_color || '#6b7280' }}>
                    Secondary text color preview
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <p>Font: {customizations.primary_font || 'Inter'}</p>
                <p>Base Size: {customizations.base_font_size || '16px'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SchoolCustomizations;

