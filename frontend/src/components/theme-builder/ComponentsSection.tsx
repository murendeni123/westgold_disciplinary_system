import React from 'react';
import { motion } from 'framer-motion';
import { ComponentTokens } from '../../types/theme.types';

interface ComponentsSectionProps {
  components: ComponentTokens;
  onUpdateToken: (path: string, value: any) => void;
}

const ComponentsSection: React.FC<ComponentsSectionProps> = ({ components, onUpdateToken }) => {
  const shadowLevels: Array<{ value: ComponentTokens['shadowLevel']; label: string }> = [
    { value: 'none', label: 'None' },
    { value: 'sm', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'lg', label: 'Large' },
    { value: 'xl', label: 'Extra Large' },
  ];

  const getShadowStyle = (level: ComponentTokens['shadowLevel']): string => {
    const shadows = {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    };
    return shadows[level];
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">UI Components</h3>
        <p className="text-sm text-gray-600">
          Customize the appearance of buttons, cards, inputs, and other UI elements.
        </p>
      </div>

      {/* Border Radius */}
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Border Radius
          </h4>

          <div className="space-y-4">
            {/* Button Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Buttons
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="2"
                  value={parseInt(components.buttonRadius)}
                  onChange={(e) => onUpdateToken('components.buttonRadius', `${e.target.value}px`)}
                  className="flex-1"
                />
                <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono text-sm">
                  {components.buttonRadius}
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                  style={{ borderRadius: components.buttonRadius }}
                >
                  Primary Button
                </button>
                <button
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  style={{ borderRadius: components.buttonRadius }}
                >
                  Secondary Button
                </button>
              </div>
            </div>

            {/* Card Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Cards & Panels
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="2"
                  value={parseInt(components.cardRadius)}
                  onChange={(e) => onUpdateToken('components.cardRadius', `${e.target.value}px`)}
                  className="flex-1"
                />
                <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono text-sm">
                  {components.cardRadius}
                </div>
              </div>
              <div className="mt-3">
                <div
                  className="p-6 bg-white border border-gray-200 shadow-sm"
                  style={{ borderRadius: components.cardRadius }}
                >
                  <h5 className="font-semibold text-gray-900 mb-2">Sample Card</h5>
                  <p className="text-sm text-gray-600">
                    This is how cards and panels will look with the selected border radius.
                  </p>
                </div>
              </div>
            </div>

            {/* Input Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Input Fields
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="2"
                  value={parseInt(components.inputRadius)}
                  onChange={(e) => onUpdateToken('components.inputRadius', `${e.target.value}px`)}
                  className="flex-1"
                />
                <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono text-sm">
                  {components.inputRadius}
                </div>
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Sample input field"
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ borderRadius: components.inputRadius }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shadow Level */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Shadow Depth
          </h4>

          <div className="grid grid-cols-5 gap-3">
            {shadowLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => onUpdateToken('components.shadowLevel', level.value)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  components.shadowLevel === level.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="w-full h-16 bg-white rounded-lg mb-2"
                  style={{ boxShadow: getShadowStyle(level.value) }}
                />
                <p className="text-xs font-medium text-gray-700 text-center">{level.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Border Width */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Border Width
          </h4>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={parseInt(components.borderWidth)}
              onChange={(e) => onUpdateToken('components.borderWidth', `${e.target.value}px`)}
              className="flex-1"
            />
            <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono text-sm">
              {components.borderWidth}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div
              className="p-4 bg-white border border-gray-300 rounded-lg"
              style={{ borderWidth: components.borderWidth }}
            >
              <p className="text-sm text-gray-600">Sample border</p>
            </div>
            <div
              className="p-4 bg-white border border-blue-500 rounded-lg"
              style={{ borderWidth: components.borderWidth }}
            >
              <p className="text-sm text-blue-600">Primary border</p>
            </div>
            <div
              className="p-4 bg-white border border-red-500 rounded-lg"
              style={{ borderWidth: components.borderWidth }}
            >
              <p className="text-sm text-red-600">Danger border</p>
            </div>
          </div>
        </div>

        {/* Spacing Scale */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Spacing Scale
          </h4>

          <div className="space-y-3">
            {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
              <div key={size} className="flex items-center gap-4">
                <label className="w-12 text-sm font-medium text-gray-700 uppercase">
                  {size}
                </label>
                <input
                  type="text"
                  value={components.spacingScale[size]}
                  onChange={(e) =>
                    onUpdateToken(`components.spacingScale.${size}`, e.target.value)
                  }
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="e.g., 1rem"
                />
                <div
                  className="h-8 bg-blue-500 rounded"
                  style={{ width: components.spacingScale[size] }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Component Preview */}
      <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Component Preview</h4>

        <div className="space-y-6">
          {/* Buttons */}
          <div>
            <p className="text-xs text-gray-600 mb-3">Buttons</p>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                style={{
                  borderRadius: components.buttonRadius,
                  boxShadow: getShadowStyle(components.shadowLevel),
                }}
              >
                Primary
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                style={{
                  borderRadius: components.buttonRadius,
                  boxShadow: getShadowStyle(components.shadowLevel),
                }}
              >
                Success
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                style={{
                  borderRadius: components.buttonRadius,
                  boxShadow: getShadowStyle(components.shadowLevel),
                }}
              >
                Danger
              </button>
              <button
                className="px-4 py-2 border text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                style={{
                  borderRadius: components.buttonRadius,
                  borderWidth: components.borderWidth,
                }}
              >
                Outline
              </button>
            </div>
          </div>

          {/* Cards */}
          <div>
            <p className="text-xs text-gray-600 mb-3">Cards</p>
            <div className="grid grid-cols-2 gap-4">
              <div
                className="p-4 bg-white border"
                style={{
                  borderRadius: components.cardRadius,
                  borderWidth: components.borderWidth,
                  boxShadow: getShadowStyle(components.shadowLevel),
                }}
              >
                <h5 className="font-semibold mb-2">Card Title</h5>
                <p className="text-sm text-gray-600">Card content goes here</p>
              </div>
              <div
                className="p-4 bg-white border border-blue-500"
                style={{
                  borderRadius: components.cardRadius,
                  borderWidth: components.borderWidth,
                  boxShadow: getShadowStyle(components.shadowLevel),
                }}
              >
                <h5 className="font-semibold text-blue-700 mb-2">Highlighted Card</h5>
                <p className="text-sm text-gray-600">With colored border</p>
              </div>
            </div>
          </div>

          {/* Form Elements */}
          <div>
            <p className="text-xs text-gray-600 mb-3">Form Elements</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Text input"
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  borderRadius: components.inputRadius,
                  borderWidth: components.borderWidth,
                }}
              />
              <select
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  borderRadius: components.inputRadius,
                  borderWidth: components.borderWidth,
                }}
              >
                <option>Select option</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
              <textarea
                placeholder="Textarea"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  borderRadius: components.inputRadius,
                  borderWidth: components.borderWidth,
                }}
              />
            </div>
          </div>

          {/* Badges */}
          <div>
            <p className="text-xs text-gray-600 mb-3">Badges</p>
            <div className="flex flex-wrap gap-2">
              <span
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium"
                style={{ borderRadius: components.buttonRadius }}
              >
                Primary
              </span>
              <span
                className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium"
                style={{ borderRadius: components.buttonRadius }}
              >
                Success
              </span>
              <span
                className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium"
                style={{ borderRadius: components.buttonRadius }}
              >
                Warning
              </span>
              <span
                className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium"
                style={{ borderRadius: components.buttonRadius }}
              >
                Danger
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentsSection;
