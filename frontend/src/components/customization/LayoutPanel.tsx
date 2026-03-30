import React from 'react';

interface LayoutPanelProps {
  customizations: any;
  updateCustomization: (updates: any) => void;
}

const LayoutPanel: React.FC<LayoutPanelProps> = ({
  customizations,
  updateCustomization,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">Layout Colors</h2>
        <p className="text-sm text-muted">
          Customize the colors of major layout elements like sidebar and header
        </p>
      </div>

      <div className="bg-surface rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Sidebar Background */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Sidebar Background
          </label>
          <p className="text-xs text-muted mb-3">
            Background color for the navigation sidebar
          </p>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: customizations.sidebar_background }}
            />
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="color"
                value={customizations.sidebar_background}
                onChange={(e) => updateCustomization({ sidebar_background: e.target.value })}
                className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={customizations.sidebar_background}
                onChange={(e) => updateCustomization({ sidebar_background: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Header Background */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Header Background
          </label>
          <p className="text-xs text-muted mb-3">
            Background color for the top header bar
          </p>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: customizations.header_background }}
            />
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="color"
                value={customizations.header_background}
                onChange={(e) => updateCustomization({ header_background: e.target.value })}
                className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={customizations.header_background}
                onChange={(e) => updateCustomization({ header_background: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-text mb-4">Preview</h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          {/* Mock Header */}
          <div
            className="h-16 px-4 flex items-center justify-between border-b border-gray-200"
            style={{ backgroundColor: customizations.header_background }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-border rounded"></div>
              <span className="font-semibold text-primary">School Portal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-border rounded-full"></div>
            </div>
          </div>
          
          {/* Mock Layout */}
          <div className="flex h-64">
            {/* Mock Sidebar */}
            <div
              className="w-48 p-4 border-r border-gray-200"
              style={{ backgroundColor: customizations.sidebar_background }}
            >
              <div className="space-y-2">
                {['Dashboard', 'Students', 'Reports', 'Settings'].map((item) => (
                  <div
                    key={item}
                    className="px-3 py-2 text-sm text-text rounded hover:bg-surface"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mock Content */}
            <div className="flex-1 p-4 bg-surface">
              <div className="space-y-3">
                <div className="h-4 bg-border rounded w-1/3"></div>
                <div className="h-3 bg-border rounded w-2/3"></div>
                <div className="h-3 bg-border rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> For best readability, use light colors for sidebar and header backgrounds. 
          Dark text on light backgrounds provides the best contrast.
        </p>
      </div>
    </div>
  );
};

export default LayoutPanel;
