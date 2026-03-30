import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Button from '../Button';

interface BrandingPanelProps {
  customizations: any;
  updateCustomization: (updates: any) => void;
  onAssetUpload: (type: 'logo' | 'favicon', file: File) => Promise<void>;
  onAssetDelete: (type: 'logo' | 'favicon') => Promise<void>;
}

const BrandingPanel: React.FC<BrandingPanelProps> = ({
  customizations,
  onAssetUpload,
  onAssetDelete,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (type: 'logo' | 'favicon', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onAssetUpload(type, file);
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    const baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : 'https://westgold-disciplinary-system.onrender.com';
    return `${baseUrl}${path}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">Branding Assets</h2>
        <p className="text-sm text-muted">
          Upload your school's logo and favicon to personalize the appearance
        </p>
      </div>

      {/* Logo Upload */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-text">School Logo</h3>
            <p className="text-sm text-muted mt-1">
              Displayed in the sidebar and header. Recommended size: 200x60px
            </p>
          </div>
        </div>

        {customizations.logo_path ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={getImageUrl(customizations.logo_path) || ''}
                alt="School Logo"
                className="max-h-20 rounded-lg border border-gray-200"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload size={16} className="mr-2" />
                Replace
              </Button>
              <button
                onClick={() => onAssetDelete('logo')}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-surface rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-1"
              >
                <X size={16} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => logoInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-secondary transition-colors group"
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center group-hover:bg-secondary transition-colors">
                <ImageIcon size={24} className="text-gray-400 group-hover:text-blue-600" />
              </div>
              <p className="mt-3 text-sm font-medium text-text">Upload Logo</p>
              <p className="mt-1 text-xs text-muted">PNG, JPG, SVG up to 5MB</p>
            </div>
          </button>
        )}

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect('logo', e)}
          className="hidden"
        />
      </div>

      {/* Favicon Upload */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-text">Favicon</h3>
            <p className="text-sm text-muted mt-1">
              Small icon displayed in browser tabs. Recommended size: 32x32px
            </p>
          </div>
        </div>

        {customizations.favicon_path ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={getImageUrl(customizations.favicon_path) || ''}
                alt="Favicon"
                className="w-8 h-8 rounded border border-gray-200"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => faviconInputRef.current?.click()}
              >
                <Upload size={16} className="mr-2" />
                Replace
              </Button>
              <button
                onClick={() => onAssetDelete('favicon')}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-surface rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-1"
              >
                <X size={16} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => faviconInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-secondary transition-colors group"
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center group-hover:bg-secondary transition-colors">
                <ImageIcon size={24} className="text-gray-400 group-hover:text-blue-600" />
              </div>
              <p className="mt-3 text-sm font-medium text-text">Upload Favicon</p>
              <p className="mt-1 text-xs text-muted">ICO, PNG up to 1MB</p>
            </div>
          </button>
        )}

        <input
          ref={faviconInputRef}
          type="file"
          accept="image/x-icon,image/png"
          onChange={(e) => handleFileSelect('favicon', e)}
          className="hidden"
        />
      </div>

      <div className="bg-secondary border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> For best results, use transparent PNG files for your logo. 
          The favicon should be square (32x32px or 64x64px) for optimal display across all browsers.
        </p>
      </div>
    </div>
  );
};

export default BrandingPanel;
