import React from 'react';
import { LayoutTokens } from '../../types/theme.types';

interface LayoutSectionProps {
  layout: LayoutTokens;
  onUpdateToken: (path: string, value: any) => void;
}

const LayoutSection: React.FC<LayoutSectionProps> = ({ layout, onUpdateToken }) => {
  const densityOptions: Array<{ value: LayoutTokens['density']; label: string; description: string }> = [
    { value: 'compact', label: 'Compact', description: 'Tight spacing, more content visible' },
    { value: 'normal', label: 'Normal', description: 'Balanced spacing and readability' },
    { value: 'comfortable', label: 'Comfortable', description: 'Generous spacing, easier to scan' },
  ];

  const cornerOptions: Array<{ value: LayoutTokens['cornerStyle']; label: string; preview: string }> = [
    { value: 'sharp', label: 'Sharp', preview: '0px' },
    { value: 'rounded', label: 'Rounded', preview: '8px' },
    { value: 'pill', label: 'Pill', preview: '999px' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Layout</h3>
        <p className="text-sm text-gray-600">
          Control the overall layout structure and spacing of your application.
        </p>
      </div>

      {/* Sidebar Width */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Sidebar Width
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Width of the navigation sidebar
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="200"
              max="400"
              step="20"
              value={parseInt(layout.sidebarWidth)}
              onChange={(e) => onUpdateToken('layout.sidebarWidth', `${e.target.value}px`)}
              className="flex-1"
            />
            <div className="w-24 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono text-sm">
              {layout.sidebarWidth}
            </div>
          </div>
          <div className="mt-4 flex gap-4 h-32 border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="bg-gray-800 flex items-center justify-center text-white text-sm"
              style={{ width: layout.sidebarWidth }}
            >
              Sidebar
            </div>
            <div className="flex-1 bg-gray-50 flex items-center justify-center text-gray-600 text-sm">
              Main Content
            </div>
          </div>
        </div>
      </div>

      {/* Header Height */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Header Height
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Height of the top header bar
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="48"
              max="96"
              step="8"
              value={parseInt(layout.headerHeight)}
              onChange={(e) => onUpdateToken('layout.headerHeight', `${e.target.value}px`)}
              className="flex-1"
            />
            <div className="w-24 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono text-sm">
              {layout.headerHeight}
            </div>
          </div>
          <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="bg-white border-b border-gray-200 flex items-center px-6 text-gray-900 font-medium"
              style={{ height: layout.headerHeight }}
            >
              Header
            </div>
            <div className="h-24 bg-gray-50 flex items-center justify-center text-gray-600 text-sm">
              Page Content
            </div>
          </div>
        </div>
      </div>

      {/* Density */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Content Density
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Overall spacing and padding throughout the interface
          </p>
          <div className="grid grid-cols-3 gap-3">
            {densityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdateToken('layout.density', option.value)}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  layout.density === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900 mb-1">{option.label}</p>
                <p className="text-xs text-gray-600">{option.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Corner Style */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Corner Style
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Overall roundness of UI elements
          </p>
          <div className="grid grid-cols-3 gap-3">
            {cornerOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdateToken('layout.cornerStyle', option.value)}
                className={`p-4 border-2 transition-all ${
                  layout.cornerStyle === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  borderRadius: option.value === 'sharp' ? '0' : option.value === 'rounded' ? '8px' : '999px',
                }}
              >
                <div
                  className="w-full h-16 bg-gradient-to-br from-blue-500 to-purple-500 mb-2"
                  style={{
                    borderRadius: option.value === 'sharp' ? '0' : option.value === 'rounded' ? '8px' : '999px',
                  }}
                />
                <p className="font-medium text-gray-900 text-center">{option.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Layout Preview */}
      <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Layout Preview</h4>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: '400px' }}>
          {/* Header */}
          <div
            className="bg-white border-b border-gray-200 flex items-center px-6"
            style={{ height: layout.headerHeight }}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg" />
              <span className="font-semibold text-gray-900">School Portal</span>
            </div>
          </div>

          {/* Main Layout */}
          <div className="flex h-full">
            {/* Sidebar */}
            <div
              className="bg-gray-800 text-white p-4"
              style={{ width: layout.sidebarWidth }}
            >
              <div className="space-y-2">
                {['Dashboard', 'Students', 'Classes', 'Reports'].map((item) => (
                  <div
                    key={item}
                    className="px-3 py-2 bg-white/10 rounded text-sm"
                    style={{
                      padding: layout.density === 'compact' ? '0.5rem 0.75rem' : layout.density === 'comfortable' ? '0.75rem 1rem' : '0.5rem 0.75rem',
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-50 p-6">
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold mb-2">Sample Card</h5>
                  <p className="text-sm text-gray-600">Content with {layout.density} density</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold mb-2">Another Card</h5>
                  <p className="text-sm text-gray-600">Spacing adjusts based on density setting</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutSection;
