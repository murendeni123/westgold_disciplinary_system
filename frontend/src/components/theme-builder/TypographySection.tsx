import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Type, Search, Check } from 'lucide-react';
import { TypographyTokens } from '../../types/theme.types';

interface TypographySectionProps {
  typography: TypographyTokens;
  onUpdateToken: (path: string, value: any) => void;
}

const TypographySection: React.FC<TypographySectionProps> = ({ typography, onUpdateToken }) => {
  const [fontSearch, setFontSearch] = useState('');
  const [popularFonts] = useState([
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Raleway',
    'Nunito',
    'Playfair Display',
    'Merriweather',
    'Source Sans Pro',
    'Work Sans',
    'DM Sans',
    'Plus Jakarta Sans',
  ]);

  const filteredFonts = popularFonts.filter((font) =>
    font.toLowerCase().includes(fontSearch.toLowerCase())
  );

  // Load Google Fonts dynamically
  useEffect(() => {
    const loadFont = (fontName: string) => {
      if (!fontName || fontName === 'Inter') return; // Inter is already loaded

      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(
        /\s+/g,
        '+'
      )}:wght@400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    };

    loadFont(typography.fontPrimary);
    loadFont(typography.fontSecondary);
  }, [typography.fontPrimary, typography.fontSecondary]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Typography</h3>
        <p className="text-sm text-gray-600">
          Choose fonts and text styles that reflect your school's personality.
        </p>
      </div>

      {/* Primary Font */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Primary Font
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Used for body text, buttons, and most UI elements
          </p>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={fontSearch}
              onChange={(e) => setFontSearch(e.target.value)}
              placeholder="Search Google Fonts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mt-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredFonts.map((font) => (
              <button
                key={font}
                onClick={() => onUpdateToken('typography.fontPrimary', font)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  typography.fontPrimary === font ? 'bg-blue-50' : ''
                }`}
                style={{ fontFamily: font }}
              >
                <span className="text-sm">{font}</span>
                {typography.fontPrimary === font && (
                  <Check size={16} className="text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Preview */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-xs text-gray-500 mb-3">Preview</p>
          <div style={{ fontFamily: typography.fontPrimary }}>
            <p className="text-3xl font-bold mb-2">The quick brown fox</p>
            <p className="text-lg mb-2">jumps over the lazy dog</p>
            <p className="text-sm text-gray-600">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
              abcdefghijklmnopqrstuvwxyz<br />
              0123456789
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Font */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Secondary Font (Optional)
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Used for headings and special emphasis
          </p>

          <select
            value={typography.fontSecondary}
            onChange={(e) => onUpdateToken('typography.fontSecondary', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={typography.fontPrimary}>Same as primary</option>
            {popularFonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Base Font Size */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Base Font Size
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Default text size for body content
          </p>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min="12"
              max="20"
              step="1"
              value={parseInt(typography.baseFontSize)}
              onChange={(e) => onUpdateToken('typography.baseFontSize', `${e.target.value}px`)}
              className="flex-1"
            />
            <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono text-sm">
              {typography.baseFontSize}
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p style={{ fontSize: typography.baseFontSize }}>
              This is sample text at the selected base font size. It should be comfortable to read
              at normal viewing distances.
            </p>
          </div>
        </div>
      </div>

      {/* Heading Scale */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Heading Scale
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Size hierarchy for headings
          </p>

          <div className="space-y-3">
            {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((heading) => (
              <div key={heading} className="flex items-center gap-4">
                <label className="w-12 text-sm font-medium text-gray-700 uppercase">
                  {heading}
                </label>
                <input
                  type="text"
                  value={typography.headingScale[heading]}
                  onChange={(e) =>
                    onUpdateToken(`typography.headingScale.${heading}`, e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="e.g., 2rem"
                />
                <div
                  className="flex-1 font-semibold"
                  style={{
                    fontFamily: typography.fontSecondary,
                    fontSize: typography.headingScale[heading],
                  }}
                >
                  Sample {heading.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Font Weights */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Font Weights
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Weight values for different text styles
          </p>

          <div className="grid grid-cols-2 gap-4">
            {(['normal', 'medium', 'semibold', 'bold'] as const).map((weight) => (
              <div key={weight}>
                <label className="block text-xs text-gray-600 mb-1 capitalize">
                  {weight}
                </label>
                <input
                  type="number"
                  min="100"
                  max="900"
                  step="100"
                  value={typography.fontWeights[weight]}
                  onChange={(e) =>
                    onUpdateToken(`typography.fontWeights.${weight}`, parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p
                  className="mt-2 text-sm"
                  style={{
                    fontFamily: typography.fontPrimary,
                    fontWeight: typography.fontWeights[weight],
                  }}
                >
                  Sample text
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line Heights */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Line Heights
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Spacing between lines of text
          </p>

          <div className="grid grid-cols-3 gap-4">
            {(['tight', 'normal', 'relaxed'] as const).map((lineHeight) => (
              <div key={lineHeight}>
                <label className="block text-xs text-gray-600 mb-1 capitalize">
                  {lineHeight}
                </label>
                <input
                  type="number"
                  min="1"
                  max="2"
                  step="0.05"
                  value={typography.lineHeights[lineHeight]}
                  onChange={(e) =>
                    onUpdateToken(`typography.lineHeights.${lineHeight}`, parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div
                  className="mt-2 p-2 bg-gray-50 rounded text-xs"
                  style={{
                    fontFamily: typography.fontPrimary,
                    lineHeight: typography.lineHeights[lineHeight],
                  }}
                >
                  Sample text with multiple lines to show line height spacing clearly.
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Typography Preview */}
      <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Full Typography Preview</h4>
        <div style={{ fontFamily: typography.fontPrimary }}>
          <h1
            className="font-bold mb-2"
            style={{
              fontFamily: typography.fontSecondary,
              fontSize: typography.headingScale.h1,
              fontWeight: typography.fontWeights.bold,
            }}
          >
            Heading 1
          </h1>
          <h2
            className="font-semibold mb-2"
            style={{
              fontFamily: typography.fontSecondary,
              fontSize: typography.headingScale.h2,
              fontWeight: typography.fontWeights.semibold,
            }}
          >
            Heading 2
          </h2>
          <h3
            className="font-medium mb-2"
            style={{
              fontFamily: typography.fontSecondary,
              fontSize: typography.headingScale.h3,
              fontWeight: typography.fontWeights.medium,
            }}
          >
            Heading 3
          </h3>
          <p
            className="mb-4"
            style={{
              fontSize: typography.baseFontSize,
              lineHeight: typography.lineHeights.normal,
              fontWeight: typography.fontWeights.normal,
            }}
          >
            This is body text using your selected typography settings. The quick brown fox jumps
            over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <p
            className="text-sm"
            style={{
              lineHeight: typography.lineHeights.relaxed,
              fontWeight: typography.fontWeights.normal,
            }}
          >
            <strong style={{ fontWeight: typography.fontWeights.bold }}>Bold text</strong> and{' '}
            <em>italic text</em> for emphasis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TypographySection;
