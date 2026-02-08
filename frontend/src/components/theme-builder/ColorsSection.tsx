import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { ColorTokens } from '../../types/theme.types';

interface ColorsSectionProps {
  colors: ColorTokens;
  onUpdateToken: (path: string, value: any) => void;
}

const ColorsSection: React.FC<ColorsSectionProps> = ({ colors, onUpdateToken }) => {
  const colorGroups = [
    {
      title: 'Brand Colors',
      colors: [
        { key: 'primary', label: 'Primary', description: 'Main brand color for buttons, links' },
        { key: 'secondary', label: 'Secondary', description: 'Accent color for highlights' },
      ],
    },
    {
      title: 'Semantic Colors',
      colors: [
        { key: 'success', label: 'Success', description: 'Positive actions and messages' },
        { key: 'warning', label: 'Warning', description: 'Warning states and alerts' },
        { key: 'danger', label: 'Danger', description: 'Errors and destructive actions' },
      ],
    },
    {
      title: 'Background & Surface',
      colors: [
        { key: 'background', label: 'Background', description: 'Page background color' },
        { key: 'surface', label: 'Surface', description: 'Card and panel backgrounds' },
      ],
    },
    {
      title: 'Text Colors',
      colors: [
        { key: 'textPrimary', label: 'Text Primary', description: 'Main text color' },
        { key: 'textSecondary', label: 'Text Secondary', description: 'Muted text color' },
      ],
    },
    {
      title: 'UI Elements',
      colors: [
        { key: 'border', label: 'Border', description: 'Border and divider color' },
        { key: 'focusRing', label: 'Focus Ring', description: 'Focus indicator color' },
      ],
    },
  ];

  const handleColorChange = (key: keyof ColorTokens, value: string) => {
    onUpdateToken(`colors.${key}`, value);
  };

  const generatePalette = (baseColor: string) => {
    // Generate lighter and darker shades
    // This is a simplified version - in production use a proper color library
    return {
      50: lightenColor(baseColor, 0.95),
      100: lightenColor(baseColor, 0.9),
      200: lightenColor(baseColor, 0.7),
      300: lightenColor(baseColor, 0.5),
      400: lightenColor(baseColor, 0.3),
      500: baseColor,
      600: darkenColor(baseColor, 0.1),
      700: darkenColor(baseColor, 0.2),
      800: darkenColor(baseColor, 0.3),
      900: darkenColor(baseColor, 0.4),
    };
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Color Palette</h3>
        <p className="text-sm text-gray-600">
          Define your brand colors and ensure proper contrast for accessibility.
        </p>
      </div>

      {colorGroups.map((group, groupIndex) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
          className="space-y-4"
        >
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {group.title}
          </h4>

          <div className="space-y-3">
            {group.colors.map((colorConfig) => {
              const colorValue = colors[colorConfig.key as keyof ColorTokens];
              const contrast = calculateContrast(colorValue, colors.surface);
              const contrastLevel = getContrastLevel(contrast);

              return (
                <ColorPicker
                  key={colorConfig.key}
                  label={colorConfig.label}
                  description={colorConfig.description}
                  value={colorValue}
                  onChange={(value) => handleColorChange(colorConfig.key as keyof ColorTokens, value)}
                  contrast={contrast}
                  contrastLevel={contrastLevel}
                  showPalette={colorConfig.key === 'primary' || colorConfig.key === 'secondary'}
                  palette={generatePalette(colorValue)}
                />
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Color Palette Preview */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Palette Preview</h4>
        <div className="grid grid-cols-2 gap-4">
          <PalettePreview label="Primary" palette={generatePalette(colors.primary)} />
          <PalettePreview label="Secondary" palette={generatePalette(colors.secondary)} />
        </div>
      </div>
    </div>
  );
};

// =====================================================
// COLOR PICKER COMPONENT
// =====================================================

interface ColorPickerProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  contrast?: number;
  contrastLevel?: 'AAA' | 'AA' | 'fail';
  showPalette?: boolean;
  palette?: Record<number, string>;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  description,
  value,
  onChange,
  contrast,
  contrastLevel,
  showPalette,
  palette,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        {/* Color Swatch */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-200"
            style={{ backgroundColor: value }}
          />
          <div className="absolute inset-0 rounded-lg pointer-events-none border-2 border-white shadow-sm" />
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-medium text-gray-900">{label}</h5>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
              {value.toUpperCase()}
            </code>
          </div>
          <p className="text-sm text-gray-600">{description}</p>

          {/* Contrast Badge */}
          {contrast !== undefined && contrastLevel && (
            <div className="mt-2 flex items-center gap-2">
              {contrastLevel === 'AAA' && (
                <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                  <Check size={12} />
                  <span>AAA ({contrast.toFixed(2)}:1)</span>
                </div>
              )}
              {contrastLevel === 'AA' && (
                <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                  <Check size={12} />
                  <span>AA ({contrast.toFixed(2)}:1)</span>
                </div>
              )}
              {contrastLevel === 'fail' && (
                <div className="flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                  <AlertTriangle size={12} />
                  <span>Low contrast ({contrast.toFixed(2)}:1)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expand Button */}
        {showPalette && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Palette size={18} className="text-gray-600" />
          </button>
        )}
      </div>

      {/* Expanded Palette */}
      {isExpanded && showPalette && palette && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          <div className="grid grid-cols-10 gap-2">
            {Object.entries(palette).map(([shade, color]) => (
              <button
                key={shade}
                onClick={() => onChange(color)}
                className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`${shade}: ${color}`}
              >
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// =====================================================
// PALETTE PREVIEW
// =====================================================

interface PalettePreviewProps {
  label: string;
  palette: Record<number, string>;
}

const PalettePreview: React.FC<PalettePreviewProps> = ({ label, palette }) => {
  return (
    <div>
      <p className="text-xs font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        {Object.entries(palette).map(([shade, color]) => (
          <div
            key={shade}
            className="flex-1 h-12"
            style={{ backgroundColor: color }}
            title={`${shade}: ${color}`}
          />
        ))}
      </div>
    </div>
  );
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const calculateContrast = (color1: string, color2: string): number => {
  // Convert hex to RGB
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  // Calculate relative luminance
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);

  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const getRelativeLuminance = (rgb: { r: number; g: number; b: number }): number => {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getContrastLevel = (ratio: number): 'AAA' | 'AA' | 'fail' => {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'fail';
};

const lightenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));

  return rgbToHex(r, g, b);
};

const darkenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));

  return rgbToHex(r, g, b);
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
};

export default ColorsSection;
