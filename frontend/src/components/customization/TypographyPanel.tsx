import React from 'react';
import Select from '../Select';
import Input from '../Input';

interface TypographyPanelProps {
  customizations: any;
  updateCustomization: (updates: any) => void;
}

const TypographyPanel: React.FC<TypographyPanelProps> = ({
  customizations,
  updateCustomization,
}) => {
  const popularFonts = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Raleway',
    'Ubuntu',
    'Nunito',
    'Playfair Display',
    'Merriweather',
    'Source Sans Pro',
  ];

  const fontSizes = [
    { value: '14px', label: '14px - Small' },
    { value: '15px', label: '15px' },
    { value: '16px', label: '16px - Default' },
    { value: '17px', label: '17px' },
    { value: '18px', label: '18px - Large' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">Typography</h2>
        <p className="text-sm text-muted">
          Choose fonts and text sizes for your school's interface
        </p>
      </div>

      <div className="bg-surface rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Primary Font */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Primary Font
          </label>
          <p className="text-xs text-muted mb-3">
            Used for body text, buttons, and most UI elements
          </p>
          <select
            value={customizations.primary_font}
            onChange={(e) => updateCustomization({ primary_font: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ fontFamily: customizations.primary_font }}
          >
            {popularFonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Secondary Font */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Secondary Font
          </label>
          <p className="text-xs text-muted mb-3">
            Used for headings and emphasis (optional)
          </p>
          <select
            value={customizations.secondary_font}
            onChange={(e) => updateCustomization({ secondary_font: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ fontFamily: customizations.secondary_font }}
          >
            {popularFonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Base Font Size */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Base Font Size
          </label>
          <p className="text-xs text-muted mb-3">
            Default text size for the interface
          </p>
          <select
            value={customizations.base_font_size}
            onChange={(e) => updateCustomization({ base_font_size: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {fontSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-text mb-4">Preview</h3>
        <div 
          className="space-y-4"
          style={{ 
            fontFamily: customizations.primary_font,
            fontSize: customizations.base_font_size 
          }}
        >
          <div>
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: customizations.secondary_font }}
            >
              Heading 1
            </h1>
            <h2 
              className="text-2xl font-semibold mb-2"
              style={{ fontFamily: customizations.secondary_font }}
            >
              Heading 2
            </h2>
            <h3 
              className="text-xl font-medium mb-2"
              style={{ fontFamily: customizations.secondary_font }}
            >
              Heading 3
            </h3>
          </div>
          <p className="text-text">
            This is a paragraph of body text using the primary font. 
            It demonstrates how regular text will appear throughout your school's interface.
            The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-sm text-muted">
            This is smaller secondary text, often used for descriptions and metadata.
          </p>
        </div>
      </div>

      <div className="bg-secondary border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Fonts are loaded from Google Fonts. 
          Make sure to test your selections on different devices to ensure they display correctly.
        </p>
      </div>
    </div>
  );
};

export default TypographyPanel;
