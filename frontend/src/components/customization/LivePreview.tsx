import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

interface LivePreviewProps {
  customizations: any;
}

type DeviceSize = 'desktop' | 'tablet' | 'mobile';
type PortalType = 'admin' | 'teacher' | 'parent';

const LivePreview: React.FC<LivePreviewProps> = ({ customizations }) => {
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop');
  const [portalType, setPortalType] = useState<PortalType>('admin');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current) {
      // Apply CSS variables to preview
      const root = previewRef.current;
      root.style.setProperty('--primary-color', customizations.primary_color);
      root.style.setProperty('--secondary-color', customizations.secondary_color);
      root.style.setProperty('--success-color', customizations.success_color);
      root.style.setProperty('--warning-color', customizations.warning_color);
      root.style.setProperty('--danger-color', customizations.danger_color);
      root.style.setProperty('--background-color', customizations.background_color);
      root.style.setProperty('--text-primary-color', customizations.text_primary_color);
      root.style.setProperty('--text-secondary-color', customizations.text_secondary_color);
      root.style.setProperty('--button-border-radius', customizations.button_border_radius);
      root.style.setProperty('--card-border-radius', customizations.card_border_radius);
      root.style.setProperty('--sidebar-background', customizations.sidebar_background);
      root.style.setProperty('--header-background', customizations.header_background);
      root.style.setProperty('--primary-font', customizations.primary_font);
      root.style.setProperty('--secondary-font', customizations.secondary_font);
      root.style.setProperty('--base-font-size', customizations.base_font_size);
    }
  }, [customizations]);

  const getDeviceWidth = () => {
    switch (deviceSize) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      case 'desktop':
        return '100%';
    }
  };

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    const baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : 'https://westgold-disciplinary-system.onrender.com';
    return `${baseUrl}${path}`;
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Preview Controls */}
      <div className="bg-surface border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text">Live Preview</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDeviceSize('desktop')}
              className={`p-2 rounded ${deviceSize === 'desktop' ? 'bg-secondary text-blue-600' : 'text-muted hover:bg-surface'}`}
              title="Desktop"
            >
              <Monitor size={18} />
            </button>
            <button
              onClick={() => setDeviceSize('tablet')}
              className={`p-2 rounded ${deviceSize === 'tablet' ? 'bg-secondary text-blue-600' : 'text-muted hover:bg-surface'}`}
              title="Tablet"
            >
              <Tablet size={18} />
            </button>
            <button
              onClick={() => setDeviceSize('mobile')}
              className={`p-2 rounded ${deviceSize === 'mobile' ? 'bg-secondary text-blue-600' : 'text-muted hover:bg-surface'}`}
              title="Mobile"
            >
              <Smartphone size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setPortalType('admin')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded ${
              portalType === 'admin' ? 'bg-secondary text-white' : 'bg-surface text-text hover:bg-border'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setPortalType('teacher')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded ${
              portalType === 'teacher' ? 'bg-secondary text-white' : 'bg-surface text-text hover:bg-border'
            }`}
          >
            Teacher
          </button>
          <button
            onClick={() => setPortalType('parent')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded ${
              portalType === 'parent' ? 'bg-secondary text-white' : 'bg-surface text-text hover:bg-border'
            }`}
          >
            Parent
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-4">
        <div 
          className="mx-auto bg-surface rounded-lg shadow-lg overflow-hidden transition-all duration-300"
          style={{ 
            width: getDeviceWidth(),
            fontFamily: customizations.primary_font,
            fontSize: customizations.base_font_size,
          }}
        >
          <div ref={previewRef}>
            {/* Header */}
            <div 
              className="h-16 px-4 flex items-center justify-between border-b"
              style={{ 
                backgroundColor: customizations.header_background,
                borderColor: customizations.background_color,
              }}
            >
              <div className="flex items-center space-x-3">
                {customizations.logo_path ? (
                  <img 
                    src={getImageUrl(customizations.logo_path) || ''} 
                    alt="Logo" 
                    className="h-8 object-contain"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: customizations.primary_color }}
                  >
                    S
                  </div>
                )}
                <span 
                  className="font-semibold"
                  style={{ 
                    color: customizations.text_primary_color,
                    fontFamily: customizations.secondary_font,
                  }}
                >
                  School Portal
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: customizations.primary_color + '40' }}
                />
              </div>
            </div>

            {/* Layout */}
            <div className="flex" style={{ minHeight: '500px' }}>
              {/* Sidebar */}
              {deviceSize !== 'mobile' && (
                <div 
                  className="w-48 p-4 border-r"
                  style={{ 
                    backgroundColor: customizations.sidebar_background,
                    borderColor: customizations.background_color,
                  }}
                >
                  <div className="space-y-1">
                    {['Dashboard', 'Students', 'Reports', 'Settings'].map((item, index) => (
                      <div
                        key={item}
                        className="px-3 py-2 text-sm rounded transition-colors"
                        style={{
                          backgroundColor: index === 0 ? customizations.primary_color + '20' : 'transparent',
                          color: index === 0 ? customizations.primary_color : customizations.text_primary_color,
                          borderRadius: customizations.button_border_radius,
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div 
                className="flex-1 p-6"
                style={{ backgroundColor: customizations.background_color }}
              >
                <div className="space-y-4">
                  {/* Page Title */}
                  <div>
                    <h1 
                      className="text-2xl font-bold mb-1"
                      style={{ 
                        color: customizations.text_primary_color,
                        fontFamily: customizations.secondary_font,
                      }}
                    >
                      Dashboard
                    </h1>
                    <p 
                      className="text-sm"
                      style={{ color: customizations.text_secondary_color }}
                    >
                      Welcome back to your {portalType} portal
                    </p>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Total Students', value: '1,234', color: customizations.primary_color },
                      { label: 'Active Cases', value: '45', color: customizations.warning_color },
                      { label: 'Resolved', value: '892', color: customizations.success_color },
                      { label: 'Pending', value: '23', color: customizations.secondary_color },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="p-4 bg-surface border shadow-sm"
                        style={{ 
                          borderRadius: customizations.card_border_radius,
                          borderColor: customizations.background_color,
                        }}
                      >
                        <p 
                          className="text-xs mb-1"
                          style={{ color: customizations.text_secondary_color }}
                        >
                          {stat.label}
                        </p>
                        <p 
                          className="text-2xl font-bold"
                          style={{ color: stat.color }}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="px-4 py-2 text-white font-medium"
                      style={{
                        backgroundColor: customizations.primary_color,
                        borderRadius: customizations.button_border_radius,
                      }}
                    >
                      Primary Action
                    </button>
                    <button
                      className="px-4 py-2 text-white font-medium"
                      style={{
                        backgroundColor: customizations.secondary_color,
                        borderRadius: customizations.button_border_radius,
                      }}
                    >
                      Secondary Action
                    </button>
                  </div>

                  {/* Content Card */}
                  <div
                    className="p-4 bg-surface border shadow-sm"
                    style={{ 
                      borderRadius: customizations.card_border_radius,
                      borderColor: customizations.background_color,
                    }}
                  >
                    <h3 
                      className="font-semibold mb-2"
                      style={{ 
                        color: customizations.text_primary_color,
                        fontFamily: customizations.secondary_font,
                      }}
                    >
                      Recent Activity
                    </h3>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: customizations.primary_color }}
                          />
                          <div className="flex-1">
                            <p 
                              className="text-sm"
                              style={{ color: customizations.text_primary_color }}
                            >
                              Activity item {i}
                            </p>
                            <p 
                              className="text-xs"
                              style={{ color: customizations.text_secondary_color }}
                            >
                              2 hours ago
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
