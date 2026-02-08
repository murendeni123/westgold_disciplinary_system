import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Check, Loader } from 'lucide-react';
import { api } from '../../services/api';
import { ThemeAssets, AssetType } from '../../types/theme.types';

interface BrandingSectionProps {
  schoolId: string;
  assets: ThemeAssets;
  onUpdateAssets: (assets: ThemeAssets) => void;
}

const BrandingSection: React.FC<BrandingSectionProps> = ({
  schoolId,
  assets,
  onUpdateAssets,
}) => {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const assetTypes: Array<{
    key: keyof ThemeAssets;
    type: AssetType;
    label: string;
    description: string;
    recommended: string;
  }> = [
    {
      key: 'logo',
      type: 'logo',
      label: 'School Logo',
      description: 'Displayed in sidebar and header',
      recommended: 'PNG or SVG, 200x60px recommended',
    },
    {
      key: 'favicon',
      type: 'favicon',
      label: 'Favicon',
      description: 'Browser tab icon',
      recommended: 'ICO or PNG, 32x32px',
    },
    {
      key: 'loginBackground',
      type: 'login_background',
      label: 'Login Background',
      description: 'Background image for login page',
      recommended: 'JPG or PNG, 1920x1080px recommended',
    },
    {
      key: 'dashboardBackground',
      type: 'dashboard_background',
      label: 'Dashboard Background',
      description: 'Background image for dashboard',
      recommended: 'JPG or PNG, 1920x1080px recommended',
    },
  ];

  const handleFileUpload = async (assetKey: keyof ThemeAssets, assetType: AssetType, file: File) => {
    setUploading(prev => ({ ...prev, [assetKey]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('asset_type', assetType);

      const response = await api.uploadThemeAsset(parseInt(schoolId), formData);

      onUpdateAssets({
        ...assets,
        [assetKey]: response.data.url,
      });
    } catch (error) {
      console.error('Error uploading asset:', error);
    } finally {
      setUploading(prev => ({ ...prev, [assetKey]: false }));
    }
  };

  const handleRemoveAsset = (assetKey: keyof ThemeAssets) => {
    onUpdateAssets({
      ...assets,
      [assetKey]: null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Brand Assets</h3>
        <p className="text-sm text-gray-600">
          Upload your school's branding assets to customize the appearance across all portals.
        </p>
      </div>

      <div className="space-y-6">
        {assetTypes.map((assetConfig) => (
          <AssetUploadCard
            key={assetConfig.key}
            assetKey={assetConfig.key}
            assetType={assetConfig.type}
            label={assetConfig.label}
            description={assetConfig.description}
            recommended={assetConfig.recommended}
            currentAsset={assets[assetConfig.key]}
            isUploading={uploading[assetConfig.key]}
            onUpload={(file) => handleFileUpload(assetConfig.key, assetConfig.type, file)}
            onRemove={() => handleRemoveAsset(assetConfig.key)}
          />
        ))}
      </div>
    </div>
  );
};

// =====================================================
// ASSET UPLOAD CARD
// =====================================================

interface AssetUploadCardProps {
  assetKey: string;
  assetType: AssetType;
  label: string;
  description: string;
  recommended: string;
  currentAsset?: string | null;
  isUploading?: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

const AssetUploadCard: React.FC<AssetUploadCardProps> = ({
  label,
  description,
  recommended,
  currentAsset,
  isUploading,
  onUpload,
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const getImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-medium text-gray-900">{label}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <p className="text-xs text-gray-500 mt-1">{recommended}</p>
        </div>
      </div>

      {currentAsset ? (
        <div className="relative group">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                <img
                  src={getImageUrl(currentAsset) || ''}
                  alt={label}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                  <Check size={16} />
                  <span className="font-medium">Uploaded</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{currentAsset}</p>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Replace
            </button>
            <button
              onClick={onRemove}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader size={32} className="text-blue-600 animate-spin" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload size={24} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, SVG or ICO (max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </motion.div>
  );
};

export default BrandingSection;
