import React from 'react';
import { Palette, AlertCircle } from 'lucide-react';

interface ColorsPanelProps {
  customizations: any;
  updateCustomization: (updates: any) => void;
}

const ColorsPanel: React.FC<ColorsPanelProps> = ({
  customizations,
  updateCustomization,
}) => {
  const colorFields = [
    { key: 'primary_color', label: 'Primary Color', description: 'Main brand color for buttons and links' },
    { key: 'secondary_color', label: 'Secondary Color', description: 'Accent color for secondary actions' },
    { key: 'success_color', label: 'Success Color', description: 'Used for positive actions and messages' },
    { key: 'warning_color', label: 'Warning Color', description: 'Used for warnings and cautions' },
    { key: 'danger_color', label: 'Danger Color', description: 'Used for errors and destructive actions' },
    { key: 'background_color', label: 'Background Color', description: 'Main page background color' },
    { key: 'text_primary_color', label: 'Primary Text', description: 'Main text color' },
    { key: 'text_secondary_color', label: 'Secondary Text', description: 'Muted text color' },
  ];

  const handleColorChange = (key: string, value: string) => {
    updateCustomization({ [key]: value });
  };

  const getContrastRatio = (color1: string, color2: string): number => {
    const getLuminance = (color: string): number => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const [rs, gs, bs] = [r, g, b].map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  };

  const checkContrast = (textColor: string, bgColor: string): { ratio: number; passes: boolean } => {
    const ratio = getContrastRatio(textColor, bgColor);
    return {
      ratio,
      passes: ratio >= 4.5, // WCAG AA standard
    };
  };

  const primaryContrast = checkContrast('#ffffff', customizations.primary_color);
  const bgContrast = checkContrast(customizations.text_primary_color, customizations.background_color);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">Color Scheme</h2>
        <p className="text-sm text-muted">
          Customize your school's color palette to match your brand identity
        </p>
      </div>

      {/* Color Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {colorFields.map((field) => (
          <div key={field.key} className="bg-surface rounded-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: customizations[field.key] }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-text mb-1">
                  {field.label}
                </label>
                <p className="text-xs text-muted mb-2">{field.description}</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customizations[field.key]}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customizations[field.key]}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contrast Checker */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Palette size={20} className="text-text" />
          <h3 className="text-lg font-medium text-text">Accessibility Check</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
            <div>
              <p className="text-sm font-medium text-text">Primary Button Contrast</p>
              <p className="text-xs text-muted">White text on primary color</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-text">
                {primaryContrast.ratio.toFixed(2)}:1
              </span>
              {primaryContrast.passes ? (
                <span className="px-2 py-1 text-xs font-medium text-green-700 bg-primary rounded">
                  Pass
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded">
                  Fail
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
            <div>
              <p className="text-sm font-medium text-text">Text Contrast</p>
              <p className="text-xs text-muted">Primary text on background</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-text">
                {bgContrast.ratio.toFixed(2)}:1
              </span>
              {bgContrast.passes ? (
                <span className="px-2 py-1 text-xs font-medium text-green-700 bg-primary rounded">
                  Pass
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded">
                  Fail
                </span>
              )}
            </div>
          </div>
        </div>

        {(!primaryContrast.passes || !bgContrast.passes) && (
          <div className="mt-4 flex items-start space-x-2 p-3 bg-surface border border-amber-200 rounded-lg">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Some color combinations don't meet WCAG AA accessibility standards (4.5:1 contrast ratio). 
              Consider adjusting colors for better readability.
            </p>
          </div>
        )}
      </div>

      {/* Color Preview */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-text mb-4">Preview</h3>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: customizations.primary_color }}
            >
              Primary Button
            </button>
            <button
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: customizations.secondary_color }}
            >
              Secondary Button
            </button>
          </div>
          <div className="flex space-x-2">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: customizations.success_color + '20',
                color: customizations.success_color 
              }}
            >
              Success
            </span>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: customizations.warning_color + '20',
                color: customizations.warning_color 
              }}
            >
              Warning
            </span>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: customizations.danger_color + '20',
                color: customizations.danger_color 
              }}
            >
              Danger
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorsPanel;
